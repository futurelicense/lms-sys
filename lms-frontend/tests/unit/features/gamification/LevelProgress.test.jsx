import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import LevelProgress from '../../../../src/features/gamification/components/LevelProgress';

describe('LevelProgress Component', () => {
  it('renders level number, title, and progress percentage', () => {
    const currentLevel = {
      levelNumber: 2,
      title: 'Learner',
      minPoints: 100,
      maxPoints: 299,
    };

    render(<LevelProgress currentLevel={currentLevel} levelProgress={45} totalPoints={190} />);

    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Learner')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText(/110 points needed for Level 3/i)).toBeInTheDocument();
  });

  it('handles max level gracefully', () => {
    const currentLevel = {
      levelNumber: 6,
      title: 'Master',
      minPoints: 1500,
      maxPoints: null,
    };

    render(<LevelProgress currentLevel={currentLevel} levelProgress={100} totalPoints={2000} />);

    expect(screen.getByText('Max level achieved!')).toBeInTheDocument();
    expect(screen.getByText('Infinity')).toBeInTheDocument();
  });
});
