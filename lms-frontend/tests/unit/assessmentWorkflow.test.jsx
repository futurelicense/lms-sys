import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubmitConfirmModal } from '../../src/features/assessments/components/SubmitConfirmModal';
import { useRetestStudent, adminAssessmentKeys } from '../../src/features/assessments/hooks/useAdminAssessments';
import { useAssessmentAttempt } from '../../src/features/assessments/hooks/useAssessmentAttempt';
import adminAssessmentService from '../../src/features/assessments/services/adminAssessmentService';
import assessmentService from '../../src/features/assessments/services/assessmentService';

vi.mock('../../src/features/assessments/services/adminAssessmentService', () => ({ default: {
  retestStudent: vi.fn(),
} }));
vi.mock('../../src/features/assessments/services/assessmentService', () => ({ default: {
  startAttempt: vi.fn(), getResult: vi.fn(), saveSubmissionDraft: vi.fn(), submitAttempt: vi.fn(), getAttemptHistory: vi.fn(),
} }));

beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

describe('assessment workflow regressions', () => {
  it('opens and closes the submit dialog without changing hook order', () => {
    const confirm = vi.fn();
    const props = { onClose: vi.fn(), onConfirm: confirm, questions: [], drafts: {} };
    const { rerender } = render(<SubmitConfirmModal {...props} isOpen={false} />);
    rerender(<SubmitConfirmModal {...props} isOpen />);
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(confirm).toHaveBeenCalledTimes(1);
    rerender(<SubmitConfirmModal {...props} isOpen isLoading />);
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(confirm).toHaveBeenCalledTimes(1);
    rerender(<SubmitConfirmModal {...props} isOpen={false} />);
  });

  it('refreshes analytics after granting a retest', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    adminAssessmentService.retestStudent.mockResolvedValue({});
    const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useRetestStudent('assessment-1'), { wrapper });
    await act(() => result.current.mutateAsync('student-1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: adminAssessmentKeys.analytics('assessment-1') });
  });

  it('flushes every edited answer before debounce expires and propagates save failures', async () => {
    assessmentService.startAttempt.mockResolvedValue({ attemptId: 'attempt-1', questions: [{ id: 'q1' }, { id: 'q2' }] });
    assessmentService.getResult.mockResolvedValue({ submissions: [] });
    assessmentService.saveSubmissionDraft.mockResolvedValue({});
    const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result, unmount } = renderHook(() => useAssessmentAttempt('assessment-1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.updateDraft('q1', { language: 'java', sourceCode: 'first answer' });
      result.current.updateDraft('q2', { language: 'MCQ', sourceCode: 'option-2' });
    });
    await act(() => result.current.flushDrafts());
    expect(assessmentService.saveSubmissionDraft).toHaveBeenCalledWith('attempt-1', 'q1', 'java', 'first answer');
    expect(assessmentService.saveSubmissionDraft).toHaveBeenCalledWith('attempt-1', 'q2', 'MCQ', 'option-2');
    assessmentService.saveSubmissionDraft.mockRejectedValue(new Error('offline'));
    await expect(result.current.flushDrafts()).rejects.toThrow('offline');
    expect(localStorage.getItem('lms_assessment_draft_attempt-1_q1')).toContain('first answer');
    expect(assessmentService.submitAttempt).not.toHaveBeenCalled();
    unmount();
  });
});
