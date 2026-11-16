import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesList } from '@/features/categories';
import { categoryService } from '@/features/categories/services/categoryService';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getActiveCategories: vi.fn(),
  },
}));

describe('CategoriesList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCategoryCache();
  });

  const mockCategories = [
    { id: 'cat-1', name: 'Electronics', description: 'Phones, laptops, chargers, cables', active: true },
    { id: 'cat-2', name: 'Identity & Cards', description: 'Student IDs, National Identity Cards, ATM cards', active: true },
    { id: 'cat-3', name: 'Stationery & Books', description: 'Notebooks, textbooks, pens, pencil cases', active: true },
  ];

  it('renders active categories loaded from the backend API', async () => {
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce(mockCategories);

    render(<CategoriesList />);

    expect(screen.getByText(/Lost & Found Categories/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Phones, laptops, chargers, cables')).toBeInTheDocument();
      expect(screen.getByText('Identity & Cards')).toBeInTheDocument();
      expect(screen.getByText('Stationery & Books')).toBeInTheDocument();
    });
  });

  it('filters categories when typing in search input', async () => {
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce(mockCategories);
    const user = userEvent.setup();

    render(<CategoriesList />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search categories\.\.\./i);
    await user.type(searchInput, 'Identity');

    expect(screen.getByText('Identity & Cards')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    expect(screen.queryByText('Stationery & Books')).not.toBeInTheDocument();
  });

  it('displays empty state when backend returns empty categories list', async () => {
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce([]);

    render(<CategoriesList />);

    await waitFor(() => {
      expect(screen.getByText(/No Categories Available/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Active categories have not yet been provisioned by the campus administrator/i)
      ).toBeInTheDocument();
    });
  });

  it('displays error alert with retry button when API fails', async () => {
    vi.mocked(categoryService.getActiveCategories).mockRejectedValueOnce(
      new Error('Failed to fetch categories from server')
    );

    render(<CategoriesList />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load categories/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch categories from server')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    // Test retry
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce(mockCategories);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });

  it('triggers onSelectCategory callback when a category is clicked', async () => {
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce(mockCategories);
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<CategoriesList onSelectCategory={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Electronics'));
    expect(onSelect).toHaveBeenCalledWith('cat-1');
  });
});
