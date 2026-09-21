import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BadgeCard from '../../../../src/features/gamification/components/BadgeCard';

describe('BadgeCard Component', () => {
  it('renders earned badge with name and description', () => {
    const badge = {
      id: 'b-1',
      name: 'Course Completer',
      description: 'Finish your first full course',
      icon: 'trophy',
      category: 'COURSE',
      awardedAt: '2026-09-10T12:00:00Z',
    };

    render(<BadgeCard badge={badge} />);

    expect(screen.getByText('Course Completer')).toBeInTheDocument();
    expect(screen.getByText('Finish your first full course')).toBeInTheDocument();
    expect(screen.getByText('COURSE')).toBeInTheDocument();
    expect(screen.getByText(/Earned/i)).toBeInTheDocument();
  });

  it('renders locked badge styling when not earned', () => {
    const badge = {
      id: 'b-2',
      name: 'Mastery 100',
      description: 'Score 100 on 5 assessments',
      icon: 'star',
      category: 'ASSESSMENT',
      awardedAt: null,
    };

    render(<BadgeCard badge={badge} />);

    expect(screen.getByText('Mastery 100')).toBeInTheDocument();
    expect(screen.queryByText(/Earned/i)).not.toBeInTheDocument();
  });
});
