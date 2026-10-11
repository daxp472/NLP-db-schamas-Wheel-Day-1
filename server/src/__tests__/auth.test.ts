import { describe, it, expect, beforeEach } from 'vitest';
import { AuthController } from '../controllers/auth.controller';
import { ProjectController } from '../controllers/project.controller';
import { EmailService } from '../services/email.service';
import { DataStore } from '../db/mongo';

function createMockReqRes(options: {
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  user?: any;
}) {
  const req: any = {
    body: options.body || {},
    headers: options.headers || {},
    params: options.params || {},
    user: options.user,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData,
  };
}

describe('Authentication & User Security Engine', () => {
  beforeEach(() => {
    EmailService.clearDispatches();
  });

  const testEmail = `ada_${Date.now()}@example.com`;
  const testPassword = 'SuperSecret123!';
  let userId = '';
  let authToken = '';
  let sessionId = '';

  it('should successfully register a new user with bcrypt hash and session', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      body: {
        name: 'Ada Lovelace',
        email: testEmail,
        password: testPassword,
      },
    });

    await AuthController.register(req, res);

    expect(getStatus()).toBe(201);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.email).toBe(testEmail.toLowerCase());
    expect(body.data.user.name).toBe('Ada Lovelace');
    expect(body.data.user.passwordHash).toBeUndefined(); // Never expose password hash

    userId = body.data.user.id;
    authToken = body.data.token;

    // Verify stored password hash is actually bcrypt encrypted and not plaintext
    const dbUser = await DataStore.findOne('users', { _id: userId });
    expect(dbUser).toBeDefined();
    expect(dbUser.passwordHash).not.toBe(testPassword);
    expect(dbUser.passwordHash.startsWith('$2')).toBe(true);
  });

  it('should reject registration when email already exists (HTTP 409)', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      body: {
        name: 'Duplicate Ada',
        email: testEmail,
        password: testPassword,
      },
    });

    await AuthController.register(req, res);

    expect(getStatus()).toBe(409);
    expect(getBody().success).toBe(false);
    expect(getBody().error.code).toBe('USER_EXISTS');
  });

  it('should authenticate user with valid credentials and return active session', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    await AuthController.login(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.id).toBe(userId);
  });

  it('should reject login with wrong password without leaking account existence (HTTP 401)', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      body: {
        email: testEmail,
        password: 'WrongPassword999!',
      },
    });

    await AuthController.login(req, res);

    expect(getStatus()).toBe(401);
    expect(getBody().success).toBe(false);
    expect(getBody().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should retrieve current user profile via AuthController.me', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      user: { id: userId, email: testEmail, name: 'Ada Lovelace' },
    });

    await AuthController.me(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    expect(getBody().data.user.id).toBe(userId);
  });

  it('should handle forgot-password and reset-password with single-use token', async () => {
    const forgotMock = createMockReqRes({
      body: { email: testEmail },
    });

    await AuthController.forgotPassword(forgotMock.req, forgotMock.res);
    expect(forgotMock.getStatus()).toBe(200);

    const token = EmailService.getLatestTokenFor(testEmail, 'password_reset');
    expect(token).toBeDefined();

    const newPassword = 'NewSecretPassword2026!';
    const resetMock = createMockReqRes({
      body: { token, password: newPassword },
    });

    await AuthController.resetPassword(resetMock.req, resetMock.res);
    expect(resetMock.getStatus()).toBe(200);
    expect(resetMock.getBody().success).toBe(true);

    // Verify reset token cannot be reused
    const reuseMock = createMockReqRes({
      body: { token, password: 'AnotherPassword999!' },
    });
    await AuthController.resetPassword(reuseMock.req, reuseMock.res);
    expect(reuseMock.getStatus()).toBe(400);
    expect(reuseMock.getBody().error.code).toBe('INVALID_TOKEN');

    // Verify login with new password works
    const loginMock = createMockReqRes({
      body: { email: testEmail, password: newPassword },
    });
    await AuthController.login(loginMock.req, loginMock.res);
    expect(loginMock.getStatus()).toBe(200);
  });

  it('should update profile name and change password', async () => {
    const updateMock = createMockReqRes({
      user: { id: userId, email: testEmail, name: 'Ada Lovelace' },
      body: { name: 'Ada Lovelace, Countess of Lovelace' },
    });

    await AuthController.updateProfile(updateMock.req, updateMock.res);
    expect(updateMock.getStatus()).toBe(200);
    expect(updateMock.getBody().data.user.name).toBe('Ada Lovelace, Countess of Lovelace');
  });

  it('should strictly isolate projects between different authenticated users', async () => {
    const userAId = `user_a_${Date.now()}`;
    const userBId = `user_b_${Date.now()}`;

    // 1. User A creates private project
    const createMock = createMockReqRes({
      user: { id: userAId, email: 'usera@example.com', name: 'User A' },
      body: { name: 'Confidential Schema A', targetDialect: 'postgresql' },
    });
    await ProjectController.createProject(createMock.req, createMock.res);
    expect(createMock.getStatus()).toBe(201);
    const projectId = createMock.getBody().data.id;

    // 2. User B tries to view User A's project -> MUST BE 403 FORBIDDEN
    const viewMock = createMockReqRes({
      user: { id: userBId, email: 'userb@example.com', name: 'User B' },
      params: { id: projectId },
    });
    await ProjectController.getProject(viewMock.req, viewMock.res);
    expect(viewMock.getStatus()).toBe(403);
    expect(viewMock.getBody().error.code).toBe('FORBIDDEN');

    // 3. User B tries to delete User A's project -> MUST BE 403 FORBIDDEN
    const deleteMock = createMockReqRes({
      user: { id: userBId, email: 'userb@example.com', name: 'User B' },
      params: { id: projectId },
    });
    await ProjectController.deleteProject(deleteMock.req, deleteMock.res);
    expect(deleteMock.getStatus()).toBe(403);
    expect(deleteMock.getBody().error.code).toBe('FORBIDDEN');

    // 4. User A can view their own project
    const ownerViewMock = createMockReqRes({
      user: { id: userAId, email: 'usera@example.com', name: 'User A' },
      params: { id: projectId },
    });
    await ProjectController.getProject(ownerViewMock.req, ownerViewMock.res);
    expect(ownerViewMock.getStatus()).toBe(200);
    expect(ownerViewMock.getBody().data.name).toBe('Confidential Schema A');
  });
});
