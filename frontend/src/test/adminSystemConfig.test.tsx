import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSystemConfigPage } from '@/pages/admin/AdminSystemConfigPage';
import { adminService } from '@/features/admin/services/adminService';
import type { SystemConfigResponse } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getSystemConfig: vi.fn(),
  },
}));

describe('Admin System Configuration & Unclaimed Policy', () => {
  const mockConfig: SystemConfigResponse = {
    unclaimedEscalationEnabled: true,
    unclaimedThresholdDays: 30,
    handoverReminderIntervalHours: 24,
    emailNotificationsEnabled: true,
    maxEmailRetries: 3,
    emailRetryDelaySeconds: 5,
    defaultHandoverPoints: 10,
    defaultCollectionPoints: 0,
    storageProvider: 'local',
    appBaseUrl: 'http://localhost:5173',
    notice:
      'Operational policies are managed via environment variables and application profiles. Category-based reputation rules can be calibrated dynamically under /api/v1/admin/reputation-rules.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unclaimed item escalation policy with university property regulation notice', async () => {
    vi.mocked(adminService.getSystemConfig).mockResolvedValue(mockConfig);

    render(
      <MemoryRouter>
        <AdminSystemConfigPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('System Configuration & Policies')).toBeInTheDocument();
    });

    expect(screen.getByText('Unclaimed Item Policy')).toBeInTheDocument();
    expect(screen.getByText('Escalation Active')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(
      screen.getByText(/Items are never automatically disposed of or deleted/i)
    ).toBeInTheDocument();
  });

  it('renders handover reminder schedule and notification parameters', async () => {
    vi.mocked(adminService.getSystemConfig).mockResolvedValue(mockConfig);

    render(
      <MemoryRouter>
        <AdminSystemConfigPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Handover Reminders')).toBeInTheDocument();
    });

    expect(screen.getByText('Every 24 Hours')).toBeInTheDocument();
    expect(screen.getByText('Notification Delivery')).toBeInTheDocument();
    expect(screen.getByText('Email Active')).toBeInTheDocument();
    expect(screen.getByText('3 attempts')).toBeInTheDocument();
    expect(screen.getByText('5 seconds')).toBeInTheDocument();
  });

  it('renders infrastructure settings and operational policy notice', async () => {
    vi.mocked(adminService.getSystemConfig).mockResolvedValue(mockConfig);

    render(
      <MemoryRouter>
        <AdminSystemConfigPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Infrastructure & Environment')).toBeInTheDocument();
    });

    expect(screen.getByText('LOCAL')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:5173')).toBeInTheDocument();
    expect(screen.getByText(mockConfig.notice)).toBeInTheDocument();
  });
});
