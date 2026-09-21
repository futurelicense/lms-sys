export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mirror of the API password policy - keep both sides in sync. */
export const PASSWORD_POLICY = Object.freeze({
  minLength: 12,
  requiresUppercase: true,
  requiresLowercase: true,
  requiresNumber: true,
  requiresSymbol: true,
});

export const isValidEmail = (value = '') => EMAIL_PATTERN.test(value.trim());

export const getPasswordIssues = (value = '') => {
  const issues = [];
  if (value.length < PASSWORD_POLICY.minLength) {
    issues.push(`At least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (PASSWORD_POLICY.requiresUppercase && !/[A-Z]/.test(value))
    issues.push('One uppercase letter');
  if (PASSWORD_POLICY.requiresLowercase && !/[a-z]/.test(value))
    issues.push('One lowercase letter');
  if (PASSWORD_POLICY.requiresNumber && !/[0-9]/.test(value)) issues.push('One number');
  if (PASSWORD_POLICY.requiresSymbol && !/[^A-Za-z0-9]/.test(value)) issues.push('One symbol');
  return issues;
};

export const isStrongPassword = (value = '') => getPasswordIssues(value).length === 0;
