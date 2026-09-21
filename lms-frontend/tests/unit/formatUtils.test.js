import { describe, it, expect } from 'vitest';
import { truncate, initials, titleCase, formatPercent } from '../../src/utils/formatUtils';

describe('formatUtils', () => {
  it('truncates only when longer than the limit', () => {
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('a much longer string', 10)).toBe('a much lo...');
  });

  it('builds initials from at most two words', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Ada Byron King Lovelace')).toBe('AB');
    expect(initials('')).toBe('');
  });

  it('title-cases snake and kebab input', () => {
    expect(titleCase('IN_REVIEW')).toBe('In Review');
    expect(titleCase('course-player')).toBe('Course Player');
  });

  it('formats percentages from 0-100 values', () => {
    expect(formatPercent(42)).toBe('42%');
  });
});
