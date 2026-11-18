import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminAuditLogDetailPage } from '@/pages/admin/AdminAuditLogDetailPage';
import { adminService } from '@/features/admin/services/adminService';
import type { AuditLogResponse } from '@/features/admin/types';
import type { Page } from '@/types/api';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getAuditLogs: vi.fn(),
    getAuditLogById: vi.fn(),
  },
}));

describe('Admin System Audit Trail', () => {
  const mockAuditLogs: AuditLogResponse[] = [
    {
      id: 'audit-1',
      actorUserId: 'admin-1',
      actorEmail: 'admin@uom.lk',
      actorRole: 'SUPER_ADMIN',
      action: 'USER_ROLE_UPDATED',
      entityType: 'USER',
      entityId: 'user-101',
      outcome: 'SUCCESS',
      metadata: 'Role changed from STUDENT to SECURITY_OFFICER. Assigned badge: SEC-088.',
      ipAddress: '192.168.1.10',
      createdAt: '2026-11-15T12:00:00Z',
    },
    {
      id: 'audit-2',
      actorUserId: 'officer-1',
      actorEmail: 'officer.kamal@uom.lk',
      actorRole: 'SECURITY_OFFICER',
      action: 'FOUND_ITEM_HANDOVER_CONFIRMED',
      entityType: 'FOUND_ITEM',
      entityId: 'item-202',
      outcome: 'SUCCESS',
      metadata: 'Physical custody verified at Central Security Office. Status -> AVAILABLE.',
      ipAddress: '192.168.1.15',
      createdAt: '2026-11-15T13:00:00Z',
    },
  ];

  const mockPageData: Page<AuditLogResponse> = {
    content: mockAuditLogs,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders append-only audit trail records with actor identity, action, and outcome', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue(mockPageData);

    render(
      <MemoryRouter>
        <AdminAuditLogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('System Audit Trail')).toBeInTheDocument();
    });

    expect(screen.getByText('USER_ROLE_UPDATED')).toBeInTheDocument();
    expect(screen.getByText('admin@uom.lk')).toBeInTheDocument();

    expect(screen.getByText('FOUND_ITEM_HANDOVER_CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('officer.kamal@uom.lk')).toBeInTheDocument();

    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThanOrEqual(2);
  });

  it('applies filters to query audit logs by action and outcome', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue(mockPageData);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminAuditLogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. USER_STATUS_UPDATED/i)).toBeInTheDocument();
    });

    const actionInput = screen.getByPlaceholderText(/e.g. USER_STATUS_UPDATED/i);
    await user.type(actionInput, 'USER_ROLE_UPDATED');

    await user.click(screen.getByRole('button', { name: /Apply Filters/i }));

    expect(adminService.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_ROLE_UPDATED',
      })
    );
  });

  it('opens audit record detail modal displaying sanitized metadata without secrets', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue(mockPageData);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminAuditLogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('View').length).toBe(2);
    });

    const viewBtns = screen.getAllByText('View');
    await user.click(viewBtns[0]);

    expect(screen.getByText('Audit Trail Record Details')).toBeInTheDocument();
    expect(screen.getByText(/Role changed from STUDENT to SECURITY_OFFICER/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sensitive fields such as credentials, tokens, and private claimant documents are permanently sanitized/i)
    ).toBeInTheDocument();
  });

  it('renders audit detail page with sanitized metadata and back navigation', async () => {
    vi.mocked(adminService.getAuditLogById).mockResolvedValue(mockAuditLogs[0]);

    render(
      <MemoryRouter initialEntries={['/admin/audit-logs/audit-1']}>
        <Routes>
          <Route path="/admin/audit-logs/:auditId" element={<AdminAuditLogDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sanitized Audit Metadata & Details')).toBeInTheDocument();
    });

    expect(screen.getByText('USER_ROLE_UPDATED')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
    expect(screen.getByText('Back to System Audit Trail')).toBeInTheDocument();
  });
});
