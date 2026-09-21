import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PointsSummary from '../../../../src/features/gamification/components/PointsSummary';

describe('PointsSummary Component', () => {
  it('renders total points, level title, badges and streak', () => {
    const summary = {
      totalPoints: 1250,
      badgeCount: 5,
      currentStreak: 7,
      currentLevel: { levelNumber: 3, title: 'Achiever' },
      leaderboardRank: 2,
    };

    render(<PointsSummary summary={summary} />);

    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText(/Level 3 • Achiever/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('triggers onOpenLeaderboard callback when rank button is clicked', () => {
    const handleOpen = vi.fn();
    const summary = { totalPoints: 100, leaderboardRank: 4 };

    render(<PointsSummary summary={summary} onOpenLeaderboard={handleOpen} />);

    fireEvent.click(screen.getByText('#4'));
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});
