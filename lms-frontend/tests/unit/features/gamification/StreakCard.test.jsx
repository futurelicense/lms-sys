import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StreakCard from '../../../../src/features/gamification/components/StreakCard';

describe('StreakCard Component', () => {
  it('renders current streak days and longest streak record', () => {
    const streak = {
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: '2026-09-14',
    };

    render(<StreakCard streak={streak} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/days streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Record: 12d/i)).toBeInTheDocument();
  });

  it('renders zero streak guidance message', () => {
    const streak = { currentStreak: 0, longestStreak: 0 };

    render(<StreakCard streak={streak} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/Complete a lesson or quiz today to start/i)).toBeInTheDocument();
  });
});
