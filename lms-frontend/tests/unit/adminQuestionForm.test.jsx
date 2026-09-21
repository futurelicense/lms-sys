import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdminQuestionForm from '../../src/features/assessments/components/AdminQuestionForm';
import { ToastProvider } from '../../src/components/feedback/Toast';

describe('AdminQuestionForm update existing questions', () => {
  it('successfully submits when editing a coding question from backend', async () => {
    const onSubmit = vi.fn();
    const existingQuestion = {
      id: 'q-1',
      title: 'Reverse a Linked List',
      description: 'Reverse singly linked list in-place.',
      questionType: 'CODING',
      difficulty: 'MEDIUM',
      compiler: null,
      marks: 15,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      testCases: [
        {
          id: 'tc-1',
          inputData: '1 2 3 4 5',
          expectedOutput: '5 4 3 2 1',
          sample: true,
          hidden: false,
          weight: 1,
        },
      ],
      options: [],
    };

    render(
      <ToastProvider>
        <AdminQuestionForm
          defaultValues={existingQuestion}
          onSubmit={onSubmit}
          submitLabel="Update question"
        />
      </ToastProvider>
    );

    const updateBtn = screen.getByRole('button', { name: /update question/i });
    expect(updateBtn).toBeDefined();

    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    }, { timeout: 3000 });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.title).toBe('Reverse a Linked List');
    expect(submitted.testCases.length).toBe(1);
    expect(submitted.testCases[0].expectedOutput).toBe('5 4 3 2 1');
    expect(submitted.options).toEqual([]);
  });

  it('successfully submits when editing an MCQ question from backend', async () => {
    const onSubmit = vi.fn();
    const existingMCQ = {
      id: 'q-2',
      title: 'What is Polymorphism?',
      description: 'Choose the correct definition of polymorphism.',
      questionType: 'MULTIPLE_CHOICE',
      difficulty: 'EASY',
      compiler: null,
      marks: 5,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      testCases: [],
      options: [
        { id: 'opt-1', optionText: 'Ability to take multiple forms', isCorrect: true, explanation: 'Core OOP pillar' },
        { id: 'opt-2', optionText: 'A compiler error', isCorrect: false, explanation: '' },
      ],
    };

    render(
      <ToastProvider>
        <AdminQuestionForm
          defaultValues={existingMCQ}
          onSubmit={onSubmit}
          submitLabel="Update question"
        />
      </ToastProvider>
    );

    const updateBtn = screen.getByRole('button', { name: /update question/i });
    expect(updateBtn).toBeDefined();

    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    }, { timeout: 3000 });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.title).toBe('What is Polymorphism?');
    expect(submitted.options.length).toBe(2);
    expect(submitted.options[0].optionText).toBe('Ability to take multiple forms');
    expect(submitted.testCases).toEqual([]);
  });
});
