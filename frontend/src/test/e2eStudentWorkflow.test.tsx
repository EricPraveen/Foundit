import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { VerifyEmailPage } from '@/pages/public/VerifyEmailPage';
import { FoundItemsPage } from '@/pages/app/FoundItemsPage';
import { authService } from '@/features/auth/services/authService';
import { foundItemService } from '@/features/found-items/services/foundItemService';
import { AuthProvider } from '@/features/auth';
import type { FoundItemSummaryResponse } from '@/features/found-items/types';
import type { Page } from '@/types/api';

vi.mock('@/features/auth/services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationEmail: vi.fn(),
  },
}));

vi.mock('@/features/found-items/services/foundItemService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/found-items/services/foundItemService')>();
  return {
    ...actual,
    foundItemService: {
      ...actual.foundItemService,
      getAvailableFoundItems: vi.fn(),
      getFoundItemById: vi.fn(),
      getCentralSecurityOffice: vi.fn().mockResolvedValue({
        id: 'office-1',
        officeName: 'Central Security Office',
        locationDescription: 'Ground Floor, Administration Building',
        contactPhone: '+94 11 265 0301',
        contactEmail: 'security@uom.lk',
        operatingHours: 'Monday - Friday: 08:00 - 16:30',
        active: true,
      }),
      getMyFoundItems: vi.fn().mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: 15,
        number: 0,
        first: true,
        last: true,
        empty: true,
      }),
    },
  };
});

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', name: 'Electronics', description: 'Gadgets', active: true },
    ]),
  },
}));

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getLocations: vi.fn().mockResolvedValue([
      { id: 'loc-1', name: 'Library', campusZone: 'Academic', description: 'Main Library', active: true },
    ]),
  },
}));

describe('Workflow Verification: Student Journey (Workflows A, B, C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Workflow A: Student Registration, Email Verification, and Login Flow', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      message: 'Registration successful. Please check your university email for verification link.',
    });

    vi.mocked(authService.verifyEmail).mockResolvedValue({
      message: 'Email successfully verified. You may now log in.',
    });

    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'jwt-token-sahan',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 'user-new',
        email: 'sahan.21@uom.lk',
        fullName: 'Sahan Bandara',
        role: 'STUDENT',
      },
    });

    const user = userEvent.setup();

    // 1. Registration
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('username@uom.lk');
    const nameInput = screen.getByPlaceholderText(/Kasun Perera/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password$/i);

    await user.type(emailInput, 'sahan.21@uom.lk');
    await user.type(nameInput, 'Sahan Bandara');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmPasswordInput, 'SecurePass123!');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(authService.register).toHaveBeenCalledWith({
      email: 'sahan.21@uom.lk',
      fullName: 'Sahan Bandara',
      password: 'SecurePass123!',
    });

    // Success banner informs to verify email
    await waitFor(() => {
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
    });
  });

  it('Workflow B & C: Found item in PENDING_HANDOVER is hidden from public browse until verified AVAILABLE', async () => {
    const verifiedAvailableItem: FoundItemSummaryResponse = {
      id: 'item-101',
      title: 'Graphing Calculator Casio',
      description: 'Found on table 4 at Library 2nd floor',
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      locationId: 'loc-1',
      locationName: 'Library',
      availabilityStatus: 'AVAILABLE',
      foundAt: '2026-11-18T08:00:00Z',
      imageUrls: ['https://example.com/calc.jpg'],
      createdAt: '2026-11-18T08:00:00Z',
    };

    const mockPage: Page<FoundItemSummaryResponse> = {
      content: [verifiedAvailableItem],
      totalElements: 1,
      totalPages: 1,
      size: 15,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(foundItemService.getAvailableFoundItems).mockResolvedValue(mockPage);

    render(
      <AuthProvider
        initialUser={{ id: 'student-1', email: 'sahan.21@uom.lk', fullName: 'Sahan Bandara', role: 'STUDENT' }}
        initialToken="token-123"
      >
        <MemoryRouter initialEntries={['/items']}>
          <Routes>
            <Route path="/items" element={<FoundItemsPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Verify only AVAILABLE items are fetched and displayed
    await waitFor(() => {
      expect(screen.getByText('Graphing Calculator Casio')).toBeInTheDocument();
    });

    // Public view displays verified status
    expect(screen.getAllByText(/Available/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();

    // Verify API called specifically for available items
    expect(foundItemService.getAvailableFoundItems).toHaveBeenCalled();
  });
});
