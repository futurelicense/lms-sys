import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogsPage } from '../../../../src/features/audit/pages/AuditLogsPage';
import auditService from '../../../../src/features/audit/services/auditService';

vi.mock('../../../../src/features/audit/services/auditService', () => ({
  default: { list: vi.fn() },
}));

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table content when audit logs are fetched successfully', async () => {
    auditService.list.mockResolvedValue({
      content: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          action: 'LOGIN_SUCCESS',
          resource: 'user',
          resourceId: '123e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          userName: 'Platform Administrator',
          userEmail: 'admin@lms.local',
          ipAddress: '192.168.1.1',
          details: 'User login successful',
          createdAt: '2026-09-01T00:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Audit Logs')).toBeInTheDocument();
    expect(await screen.findByText('LOGIN SUCCESS')).toBeInTheDocument();
    expect(await screen.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await screen.findByText('admin@lms.local')).toBeInTheDocument();
    expect(await screen.findByText('192.168.1.1')).toBeInTheDocument();
  });

  it('displays error state when audit log service call fails', async () => {
    auditService.list.mockRejectedValue({
      message: 'Cannot reach the server. Check your connection.',
    });

    render(<AuditLogsPage />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(await screen.findByText('Cannot reach the server. Check your connection.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
