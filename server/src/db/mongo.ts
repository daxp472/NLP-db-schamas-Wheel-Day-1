import { MongoClient, Db, Collection, Document, ObjectId } from 'mongodb';
import { ENV } from '../config/env';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// In-memory fallback stores when standalone without active MongoDB daemon
const memoryStore = new Map<string, Map<string, any>>();

function getMemoryCollection(name: string) {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, new Map());
  }
  return memoryStore.get(name)!;
}

export async function connectMongo(): Promise<Db | null> {
  if (isConnected && db) return db;

  try {
    client = new MongoClient(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await client.connect();
    db = client.db(ENV.MONGODB_DATABASE);
    isConnected = true;
    console.log(`[Database] Connected to MongoDB: ${ENV.MONGODB_DATABASE}`);

    // Create indexes for efficient queries and uniqueness
    await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await db.collection('projects').createIndex({ userId: 1, updatedAt: -1 }).catch(() => {});
    await db.collection('projects').createIndex({ visibility: 1, updatedAt: -1 }).catch(() => {});
    await db.collection('projects').createIndex({ visibility: 1, cloneCount: -1 }).catch(() => {});
    await db.collection('projects').createIndex({ 'members.userId': 1 }).catch(() => {});
    await db.collection('project_invitations').createIndex({ tokenHash: 1 }, { unique: true }).catch(() => {});
    await db.collection('project_invitations').createIndex({ projectId: 1, status: 1 }).catch(() => {});
    await db.collection('project_invitations').createIndex({ invitedEmail: 1, status: 1 }).catch(() => {});
    return db;
  } catch (err: any) {
    console.warn(`[Database] MongoDB offline or unreachable (${err.message}). Using memory fallback persistence.`);
    isConnected = false;
    db = null;
    return null;
  }
}

export function getDb(): Db | null {
  return db;
}

export function isMongoConnected(): boolean {
  return isConnected;
}

// Direct Collection Access Helper
export function getCollection<T extends Document>(name: string): Collection<T> | null {
  if (db && isConnected) {
    return db.collection<T>(name);
  }
  return null;
}

export interface QueryOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

// Persistence Wrapper supporting both live MongoDB driver & in-memory fallback
export const DataStore = {
  async findOne<T = any>(collection: string, query: Record<string, any>): Promise<T | null> {
    const col = getCollection(collection);
    if (col) {
      if (query._id && typeof query._id === 'string') {
        const idStr = query._id;
        const orConditions: any[] = [{ _id: idStr }, { id: idStr }];
        if (ObjectId.isValid(idStr) && idStr.length === 24) {
          try {
            orConditions.push({ _id: new ObjectId(idStr) });
          } catch {}
        }
        const modifiedQuery = { ...query };
        delete modifiedQuery._id;
        const finalQuery = Object.keys(modifiedQuery).length > 0
          ? { $and: [{ $or: orConditions }, modifiedQuery] }
          : { $or: orConditions };
        return (await col.findOne(finalQuery)) as T | null;
      }
      return (await col.findOne(query)) as T | null;
    }
    const mem = getMemoryCollection(collection);
    for (const item of mem.values()) {
      const match = Object.entries(query).every(([k, v]) => {
        if (k === '_id') return item._id?.toString() === v?.toString() || item.id === v?.toString();
        if (k === 'members.userId') {
          return Array.isArray(item.members) && item.members.some((m: any) => m.userId === v);
        }
        return item[k] === v;
      });
      if (match) return item as T;
    }
    return null;
  },

  async find<T = any>(
    collection: string,
    query: Record<string, any> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    const col = getCollection(collection);
    if (col) {
      let cursor = col.find(query);
      if (options?.sort) {
        cursor = cursor.sort(options.sort);
      }
      if (options?.skip) {
        cursor = cursor.skip(options.skip);
      }
      if (options?.limit) {
        cursor = cursor.limit(options.limit);
      }
      return (await cursor.toArray()) as T[];
    }

    const mem = getMemoryCollection(collection);
    let results: T[] = [];
    for (const item of mem.values()) {
      const match = Object.entries(query).every(([k, v]) => {
        if (k === '_id') return item._id?.toString() === v?.toString() || item.id === v;
        if (k === 'members.userId') {
          return Array.isArray(item.members) && item.members.some((m: any) => m.userId === v);
        }
        if (k === '$or' && Array.isArray(v)) {
          return v.some((cond) => {
            return Object.entries(cond).every(([ck, cv]) => {
              if (ck === 'members.userId') {
                return Array.isArray(item.members) && item.members.some((m: any) => m.userId === cv);
              }
              return item[ck] === cv;
            });
          });
        }
        return item[k] === v;
      });
      if (match) results.push(item as T);
    }

    // Apply sorting in memory
    if (options?.sort) {
      const [sortField, sortDir] = Object.entries(options.sort)[0] || [];
      if (sortField) {
        results.sort((a: any, b: any) => {
          const valA = a[sortField];
          const valB = b[sortField];
          if (valA === valB) return 0;
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          const cmp = valA > valB ? 1 : -1;
          return sortDir === 1 ? cmp : -cmp;
        });
      }
    }

    // Apply skip & limit
    if (options?.skip) {
      results = results.slice(options.skip);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  },

  async count(collection: string, query: Record<string, any> = {}): Promise<number> {
    const col = getCollection(collection);
    if (col) {
      return await col.countDocuments(query);
    }

    const items = await this.find(collection, query);
    return items.length;
  },

  async insertOne<T = any>(collection: string, doc: any): Promise<{ insertedId: string }> {
    const id = doc._id ? doc._id.toString() : `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullDoc = { ...doc, _id: id, id, createdAt: doc.createdAt || new Date(), updatedAt: new Date() };

    const col = getCollection(collection);
    if (col) {
      const res = await col.insertOne(fullDoc as any);
      return { insertedId: res.insertedId.toString() };
    }

    const mem = getMemoryCollection(collection);
    mem.set(id, fullDoc);
    return { insertedId: id };
  },

  async updateOne(collection: string, query: Record<string, any>, update: Record<string, any>): Promise<boolean> {
    const col = getCollection(collection);
    if (col) {
      let targetQuery = query;
      if (query._id && typeof query._id === 'string') {
        const idStr = query._id;
        const orConditions: any[] = [{ _id: idStr }, { id: idStr }];
        if (ObjectId.isValid(idStr) && idStr.length === 24) {
          try {
            orConditions.push({ _id: new ObjectId(idStr) });
          } catch {}
        }
        const modifiedQuery = { ...query };
        delete modifiedQuery._id;
        targetQuery = Object.keys(modifiedQuery).length > 0
          ? { $and: [{ $or: orConditions }, modifiedQuery] }
          : { $or: orConditions };
      }
      const res = await col.updateOne(targetQuery, update);
      return res.matchedCount > 0;
    }

    const item = await this.findOne(collection, query);
    if (!item) return false;

    const mem = getMemoryCollection(collection);
    const updated = { ...item };

    if (update.$set) {
      Object.assign(updated, update.$set);
    }
    if (update.$inc) {
      for (const [key, incVal] of Object.entries(update.$inc)) {
        updated[key] = (typeof updated[key] === 'number' ? updated[key] : 0) + (incVal as number);
      }
    }
    if (update.$push) {
      for (const [key, pushVal] of Object.entries(update.$push)) {
        if (!Array.isArray(updated[key])) updated[key] = [];
        updated[key].push(pushVal);
      }
    }
    if (update.$pull) {
      for (const [key, pullCondition] of Object.entries(update.$pull)) {
        if (Array.isArray(updated[key])) {
          updated[key] = updated[key].filter((el: any) => {
            if (typeof pullCondition === 'object' && pullCondition !== null) {
              return !Object.entries(pullCondition).every(([pk, pv]) => el[pk] === pv);
            }
            return el !== pullCondition;
          });
        }
      }
    }
    if (!update.$set && !update.$inc && !update.$push && !update.$pull) {
      Object.assign(updated, update);
    }

    updated.updatedAt = new Date();
    mem.set(item._id || item.id, updated);
    return true;
  },

  async deleteOne(collection: string, query: Record<string, any>): Promise<boolean> {
    const col = getCollection(collection);
    if (col) {
      let targetQuery = query;
      if (query._id && typeof query._id === 'string') {
        const idStr = query._id;
        const orConditions: any[] = [{ _id: idStr }, { id: idStr }];
        if (ObjectId.isValid(idStr) && idStr.length === 24) {
          try {
            orConditions.push({ _id: new ObjectId(idStr) });
          } catch {}
        }
        const modifiedQuery = { ...query };
        delete modifiedQuery._id;
        targetQuery = Object.keys(modifiedQuery).length > 0
          ? { $and: [{ $or: orConditions }, modifiedQuery] }
          : { $or: orConditions };
      }
      const res = await col.deleteOne(targetQuery);
      return res.deletedCount > 0;
    }

    const item = await this.findOne(collection, query);
    if (!item) return false;

    const mem = getMemoryCollection(collection);
    mem.delete(item._id || item.id);
    return true;
  },
};
