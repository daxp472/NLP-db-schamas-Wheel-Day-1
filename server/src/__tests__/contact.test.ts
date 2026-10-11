import { describe, it, expect } from 'vitest';
import { DataStore } from '../db/mongo';

describe('Contact Submission Service & Storage', () => {
  it('stores valid contact submission in DataStore', async () => {
    const contactData = {
      name: 'Morgan Stanley',
      email: 'morgan@example.com',
      category: 'feature_request',
      subject: 'MySQL dialect support request',
      message: 'We are looking forward to MySQL dialect support in the studio.',
    };

    const { insertedId } = await DataStore.insertOne('contact_submissions', contactData);
    expect(insertedId).toBeDefined();

    const retrieved = await DataStore.findOne('contact_submissions', { _id: insertedId });
    expect(retrieved).toBeDefined();
    expect(retrieved?.email).toBe('morgan@example.com');
    expect(retrieved?.subject).toBe('MySQL dialect support request');
  });
});
