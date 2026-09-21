import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LeaderboardTable from '../../../../src/features/gamification/components/LeaderboardTable';

describe('LeaderboardTable Component', () => {
  const sampleEntries = [
    { rank: 1, studentId: 's-1', studentName: 'Alice Johnson', levelTitle: 'Master', badgeCount: 8, totalPoints: 1850 },
    { rank: 2, studentId: 's-2', studentName: 'Bob Smith', levelTitle: 'Expert', badgeCount: 6, totalPoints: 1200 },
  ];

  it('renders table headers and student rows', () => {
    const data = { content: sampleEntries, totalPages: 1 };

    render(
      <LeaderboardTable
        data={data}
        currentStudent={null}
        period="ALL_TIME"
        onPeriodChange={vi.fn()}
        page={0}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('1,850')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('highlights current student and calls onPeriodChange', () => {
    const data = { content: sampleEntries, totalPages: 2 };
    const currentStudent = { rank: 2, studentId: 's-2', studentName: 'Bob Smith', totalPoints: 1200 };
    const onPeriodChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <LeaderboardTable
        data={data}
        currentStudent={currentStudent}
        period="ALL_TIME"
        onPeriodChange={onPeriodChange}
        page={0}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/Your Rank #2/i)).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();

    // Click period tab
    fireEvent.click(screen.getByText('This Month'));
    expect(onPeriodChange).toHaveBeenCalledWith('THIS_MONTH');
  });
});
