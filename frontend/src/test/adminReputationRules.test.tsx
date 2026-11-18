import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminReputationRulesPage } from '@/pages/admin/AdminReputationRulesPage';
import { adminService } from '@/features/admin/services/adminService';
import type { ReputationRuleResponse } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getAllReputationRules: vi.fn(),
    updateReputationRule: vi.fn(),
  },
}));

describe('Admin Reputation Rules Configuration', () => {
  const mockRules: ReputationRuleResponse[] = [
    {
      id: 'rule-1',
      categoryId: 'cat-1',
      categoryName: 'Electronics & Devices',
      transactionType: 'FOUND_ITEM_HANDOVER',
      points: 25,
      active: true,
      createdAt: '2026-11-15T09:00:00Z',
      updatedAt: '2026-11-15T09:00:00Z',
    },
    {
      id: 'rule-2',
      categoryId: 'cat-1',
      categoryName: 'Electronics & Devices',
      transactionType: 'ITEM_COLLECTION',
      points: 15,
      active: true,
      createdAt: '2026-11-15T09:00:00Z',
      updatedAt: '2026-11-15T09:00:00Z',
    },
    {
      id: 'rule-3',
      categoryId: null,
      categoryName: null,
      transactionType: 'FOUND_ITEM_HANDOVER',
      points: 10,
      active: false,
      createdAt: '2026-11-15T09:00:00Z',
      updatedAt: '2026-11-15T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all category reputation rules with transaction types and point values', async () => {
    vi.mocked(adminService.getAllReputationRules).mockResolvedValue(mockRules);

    render(
      <MemoryRouter>
        <AdminReputationRulesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reputation Points Rules')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Electronics & Devices').length).toBe(2);
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('+15 pts')).toBeInTheDocument();
    expect(screen.getAllByText('Physical Handover to Office').length).toBe(2);
    expect(screen.getByText('Owner Collection Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Global Rule')).toBeInTheDocument();
  });

  it('filters reputation rules by keyword search', async () => {
    vi.mocked(adminService.getAllReputationRules).mockResolvedValue(mockRules);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminReputationRulesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by category or transaction/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by category or transaction/i);
    await user.type(searchInput, 'Collection');

    expect(screen.getByText('Owner Collection Confirmed')).toBeInTheDocument();
    expect(screen.queryByText('+25 pts')).not.toBeInTheDocument();
  });

  it('opens calibrate points modal and updates point value', async () => {
    vi.mocked(adminService.getAllReputationRules).mockResolvedValue(mockRules);
    vi.mocked(adminService.updateReputationRule).mockResolvedValue({
      ...mockRules[0],
      points: 30,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminReputationRulesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Calibrate').length).toBeGreaterThan(0);
    });

    const calibrateBtns = screen.getAllByText('Calibrate');
    await user.click(calibrateBtns[0]);

    expect(screen.getByText('Calibrate Reputation Points Rule')).toBeInTheDocument();

    const pointsInput = screen.getByDisplayValue('25');
    await user.clear(pointsInput);
    await user.type(pointsInput, '30');

    await user.click(screen.getByRole('button', { name: /^Save Points Calibration$/i }));

    expect(adminService.updateReputationRule).toHaveBeenCalledWith('rule-1', {
      points: 30,
      active: true,
    });
  });
});
