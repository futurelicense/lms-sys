import { describe, expect, it } from 'vitest';
import { adminAssessmentKeys } from '../../src/features/assessments/hooks/useAdminAssessments';

describe('adminAssessmentKeys', () => {
  it('keeps list, detail, question, and analytics caches isolated', () => {
    expect(adminAssessmentKeys.list({ page: 0 })).toEqual(['assessments', 'admin', 'list', { page: 0 }]);
    expect(adminAssessmentKeys.detail('assessment-1')).toEqual(['assessments', 'admin', 'detail', 'assessment-1']);
    expect(adminAssessmentKeys.questions('assessment-1')).toEqual([
      'assessments', 'admin', 'detail', 'assessment-1', 'questions',
    ]);
    expect(adminAssessmentKeys.analytics('assessment-1')).toEqual([
      'assessments', 'admin', 'detail', 'assessment-1', 'analytics',
    ]);
  });
});
