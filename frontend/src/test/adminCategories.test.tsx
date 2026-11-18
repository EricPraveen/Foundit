import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { adminService } from '@/features/admin/services/adminService';
import type { CategoryResponse } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getAllCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    setCategoryStatus: vi.fn(),
  },
}));

describe('Admin Category Management', () => {
  const mockCategories: CategoryResponse[] = [
    {
      id: 'cat-1',
      name: 'Electronics & Devices',
      description: 'Laptops, mobile phones, chargers, and calculators',
      active: true,
    },
    {
      id: 'cat-2',
      name: 'Identity & Cards',
      description: 'University Student ID cards, national identity cards, bank cards',
      active: true,
    },
    {
      id: 'cat-3',
      name: 'Archived Apparel',
      description: 'Jackets, umbrellas, and bags from past terms',
      active: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all taxonomy categories with active and inactive status badges', async () => {
    vi.mocked(adminService.getAllCategories).mockResolvedValue(mockCategories);

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Item Category Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Electronics & Devices')).toBeInTheDocument();
    expect(screen.getByText('Identity & Cards')).toBeInTheDocument();
    expect(screen.getByText('Archived Apparel')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('filters category rows by keyword search', async () => {
    vi.mocked(adminService.getAllCategories).mockResolvedValue(mockCategories);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'Apparel');

    expect(screen.getByText('Archived Apparel')).toBeInTheDocument();
    expect(screen.queryByText('Electronics & Devices')).not.toBeInTheDocument();
  });

  it('opens create category modal and submits new category', async () => {
    vi.mocked(adminService.getAllCategories).mockResolvedValue(mockCategories);
    vi.mocked(adminService.createCategory).mockResolvedValue({
      id: 'cat-4',
      name: 'Stationery & Books',
      description: 'Textbooks, notebooks, and pencil cases',
      active: true,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Category')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Category'));

    expect(screen.getByText('Create Item Category')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Identity Documents/i);
    await user.type(nameInput, 'Stationery & Books');

    const submitButtons = screen.getAllByRole('button', { name: /^Create Category$/i });
    await user.click(submitButtons[submitButtons.length - 1]);

    expect(adminService.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Stationery & Books',
        active: true,
      })
    );
  });

  it('toggles category active status safely', async () => {
    vi.mocked(adminService.getAllCategories).mockResolvedValue(mockCategories);
    vi.mocked(adminService.setCategoryStatus).mockResolvedValue({
      ...mockCategories[0],
      active: false,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics & Devices')).toBeInTheDocument();
    });

    const toggleBtns = screen.getAllByTitle('Deactivate Category');
    await user.click(toggleBtns[0]);

    expect(adminService.setCategoryStatus).toHaveBeenCalledWith('cat-1', false);
  });
});
