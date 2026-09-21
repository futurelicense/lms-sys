import { describe, it, expect } from 'vitest';
import { isValidEmail, getPasswordIssues, isStrongPassword } from '../../src/utils/validationUtils';

describe('validationUtils', () => {
  it('validates email addresses', () => {
    expect(isValidEmail('ada@example.com')).toBe(true);
    expect(isValidEmail('ada@example')).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
  });

  it('reports every unmet password rule', () => {
    expect(getPasswordIssues('short')).toContain('One uppercase letter');
    expect(isStrongPassword('Str0ng!Passw0rd')).toBe(true);
  });
});
