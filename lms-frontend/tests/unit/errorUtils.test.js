import { describe, it, expect } from 'vitest';
import { normalizeError, categorizeAuthError } from '../../src/utils/errorUtils';

describe('normalizeError', () => {
  it('prefers the API message', () => {
    const result = normalizeError({ response: { status: 422, data: { message: 'Email taken' } } });
    expect(result.message).toBe('Email taken');
    expect(result.status).toBe(422);
  });

  it('falls back to a status message', () => {
    const result = normalizeError({ response: { status: 403, data: {} } });
    expect(result.message).toMatch(/permission/i);
  });

  it('flags network failures', () => {
    const result = normalizeError({ message: 'Network Error' });
    expect(result.isNetworkError).toBe(true);
  });
});

describe('categorizeAuthError', () => {
  it('correctly categorizes 401 invalid credentials', () => {
    const error = {
      response: {
        status: 401,
        data: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('CREDENTIALS');
    expect(result.title).toBe('Invalid Credentials');
    expect(result.message).toContain('email or password');
  });

  it('correctly categorizes 403 locked or disabled accounts', () => {
    const error = {
      response: {
        status: 403,
        data: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account is locked. Contact an administrator.',
        },
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('ACCOUNT_LOCKED');
    expect(result.title).toBe('Account Locked or Disabled');
    expect(result.message).toContain('locked');
  });

  it('correctly categorizes 403 inactive workspace', () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'Tenant is not active' },
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('TENANT_INACTIVE');
    expect(result.title).toBe('Workspace Inactive');
  });

  it('correctly categorizes 404 tenant/workspace not found', () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'Tenant not found' },
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('TENANT_NOT_FOUND');
    expect(result.title).toBe('Workspace Not Found');
  });

  it('correctly categorizes 500 internal server error', () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('SERVER_ERROR');
    expect(result.title).toBe('Backend Server Problem');
    expect(result.message).toContain('server error');
  });

  it('correctly categorizes network connection errors', () => {
    const error = {
      code: 'ERR_NETWORK',
      message: 'Network Error',
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('NETWORK_ERROR');
    expect(result.title).toBe('Server Connection Failed');
    expect(result.message).toContain('connect to the backend server');
  });

  it('correctly categorizes 429 rate limit exceeded', () => {
    const error = {
      response: {
        status: 429,
        data: {},
      },
    };
    const result = categorizeAuthError(error);
    expect(result.type).toBe('RATE_LIMIT');
    expect(result.title).toBe('Too Many Attempts');
  });
});
