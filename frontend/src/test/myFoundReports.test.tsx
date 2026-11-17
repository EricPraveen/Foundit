import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FoundItemsPage } from '@/pages/app/FoundItemsPage';
import { foundItemService } from '@/features/found-items/services/foundItemService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';
import { resetSecurityOfficeCache } from '@/features/found-items/hooks/useSecurityOffice';
import type { FoundItemResponse } from '@/features/found-items/types';
import type { Page } from '@/types/api';

vi.mock('@/features/found-items/services/foundItemService', async () => {
  const actual = await vi.importActual<typeof import('@/features/found-items/services/foundItemService')>(
    '@/features/found-items/services/foundItemService'
  );
  return {
    ...actual,
    foundItemService: {
      ...actual.foundItemService,
      getAvailableFoundItems: vi.fn(),
      getMyFoundReports: vi.fn(),
      getFoundItemById: vi.fn(),
      updateFoundItem: vi.fn(),
      cancelFoundReport: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
      getCentralSecurityOffice: vi.fn(),
    },
  };
});

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getActiveCategories: vi.fn(),
  },
}));

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getActiveLocations: vi.fn(),
  },
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'student-1',
      email: 'student@uom.lk',
      fullName: 'Student Finder',
      role: 'STUDENT',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('My Found Reports (FoundItemsPage tab)', () => {
  const mockPendingItem: FoundItemResponse = {
    id: 'report-pending-1',
    title: 'Sony Bluetooth Headphones',
    description: 'Black over-ear headphones found on bench outside ENTC',
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    locationId: 'loc-1',
    locationName: 'ENTC Building',
    specificLocation: 'North bench',
    foundAt: '2026-11-16T14:00:00Z',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    handoverStatus: 'PENDING',
    availabilityStatus: 'UNAVAILABLE',
    images: [
      {
        id: 'img-1',
        originalFilename: 'headphones.jpg',
        storagePath: 'items/1/headphones.jpg',
        publicUrl: '/api/v1/storage/found-items/headphones.jpg',
        contentType: 'image/jpeg',
        fileSize: 200000,
        createdAt: '2026-11-16T14:10:00Z',
      },
    ],
    createdAt: '2026-11-16T14:05:00Z',
    updatedAt: '2026-11-16T14:05:00Z',
  };

  const mockConfirmedItem: FoundItemResponse = {
    id: 'report-confirmed-2',
    title: 'Student ID Card - Bandara M.',
    description: 'Found near mechanical workshop',
    categoryId: 'cat-2',
    categoryName: 'ID Cards',
    locationId: 'loc-2',
    locationName: 'Mechanical Dept',
    specificLocation: 'Workshop 1',
    foundAt: '2026-11-10T10:00:00Z',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    handoverStatus: 'CONFIRMED',
    availabilityStatus: 'AVAILABLE',
    receivingOfficerName: 'Officer Jayasuriya',
    handoverConfirmedAt: '2026-11-10T11:00:00Z',
    officerNotes: 'Verified ID card matches student registry',
    images: [],
    createdAt: '2026-11-10T10:30:00Z',
    updatedAt: '2026-11-10T11:00:00Z',
  };

  const mockReportsPage: Page<FoundItemResponse> = {
    content: [mockPendingItem, mockConfirmedItem],
    totalElements: 2,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockOffice = {
    id: 'office-1',
    name: 'Central Security Office',
    campusLocation: 'Admin Building Ground Floor, Room 102',
    contactEmail: 'security@uom.lk',
    contactPhone: '+94 11 2650301',
    operatingHours: 'Mon - Fri 08:00 - 18:00',
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetSecurityOfficeCache();
    resetCategoryCache();
    resetLocationCache();

    vi.mocked(foundItemService.getCentralSecurityOffice).mockResolvedValue(mockOffice);
    vi.mocked(categoryService.getActiveCategories).mockResolvedValue([
      { id: 'cat-1', name: 'Electronics', description: '', active: true },
      { id: 'cat-2', name: 'ID Cards', description: '', active: true },
    ]);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue([
      { id: 'loc-1', name: 'ENTC Building', campusZone: 'East', active: true },
      { id: 'loc-2', name: 'Mechanical Dept', campusZone: 'West', active: true },
    ]);
    vi.mocked(foundItemService.getAvailableFoundItems).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 12,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
    vi.mocked(foundItemService.getMyFoundReports).mockResolvedValue(mockReportsPage);
  });

  it('renders student reports with correct status badges and handover notices', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    // Switch to "My Found Reports" tab
    const myReportsTab = screen.getByRole('button', { name: /My Found Reports/i });
    await user.click(myReportsTab);

    await waitFor(() => {
      expect(screen.getByText('Sony Bluetooth Headphones')).toBeInTheDocument();
      expect(screen.getByText('Student ID Card - Bandara M.')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Pending Handover').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Handed Over & Verified').length).toBeGreaterThanOrEqual(1);

    // Verify Pending Handover guidance card is shown for unconfirmed item
    expect(screen.getByText(/Next Step: Physical Handover Required/i)).toBeInTheDocument();

    // Verify Officer verification notes for confirmed item
    expect(screen.getByText(/Verified by Officer Officer Jayasuriya/i)).toBeInTheDocument();
    expect(screen.getByText(/"Verified ID card matches student registry"/i)).toBeInTheDocument();
  });

  it('allows editing a report while PENDING and calls updateFoundItem', async () => {
    const user = userEvent.setup();
    const updatedItem: FoundItemResponse = {
      ...mockPendingItem,
      title: 'Sony WH-1000XM4 Headphones (Updated)',
      description: 'Updated description with serial number',
    };
    vi.mocked(foundItemService.updateFoundItem).mockResolvedValue(updatedItem);

    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    const myReportsTab = screen.getByRole('button', { name: /My Found Reports/i });
    await user.click(myReportsTab);

    await waitFor(() => {
      expect(screen.getByText('Sony Bluetooth Headphones')).toBeInTheDocument();
    });

    // The PENDING report has an "Edit" button, but CONFIRMED report does not
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    expect(editButtons).toHaveLength(1);

    await user.click(editButtons[0]);

    // Modal opens
    expect(await screen.findByRole('heading', { name: 'Edit Found Report' })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Item Title \*/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Sony WH-1000XM4 Headphones (Updated)');

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(foundItemService.updateFoundItem).toHaveBeenCalledWith(
        'report-pending-1',
        expect.objectContaining({
          title: 'Sony WH-1000XM4 Headphones (Updated)',
        })
      );
    });

    expect(await screen.findByText('Sony WH-1000XM4 Headphones (Updated)')).toBeInTheDocument();
  });

  it('allows cancelling a report while PENDING with confirmation step', async () => {
    const user = userEvent.setup();
    const cancelledItem: FoundItemResponse = {
      ...mockPendingItem,
      handoverStatus: 'CANCELLED',
      availabilityStatus: 'UNAVAILABLE',
    };
    vi.mocked(foundItemService.cancelFoundReport).mockResolvedValue(cancelledItem);

    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    const myReportsTab = screen.getByRole('button', { name: /My Found Reports/i });
    await user.click(myReportsTab);

    await waitFor(() => {
      expect(screen.getByText('Sony Bluetooth Headphones')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancel Report/i });
    await user.click(cancelBtn);

    // Confirmation prompt appears
    expect(screen.getByText('Cancel this report?')).toBeInTheDocument();
    const confirmCancelBtn = screen.getByRole('button', { name: 'Yes, Cancel' });
    await user.click(confirmCancelBtn);

    await waitFor(() => {
      expect(foundItemService.cancelFoundReport).toHaveBeenCalledWith('report-pending-1');
    });

    await waitFor(() => {
      expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('allows deleting an attached image on a pending report', async () => {
    const user = userEvent.setup();
    vi.mocked(foundItemService.deleteImage).mockResolvedValue();

    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    const myReportsTab = screen.getByRole('button', { name: /My Found Reports/i });
    await user.click(myReportsTab);

    await waitFor(() => {
      expect(screen.getByAltText('headphones.jpg')).toBeInTheDocument();
    });

    const deleteImgBtn = screen.getByRole('button', { name: 'Delete image' });
    await user.click(deleteImgBtn);

    await waitFor(() => {
      expect(foundItemService.deleteImage).toHaveBeenCalledWith('report-pending-1', 'img-1');
    });

    await waitFor(() => {
      expect(screen.queryByAltText('headphones.jpg')).not.toBeInTheDocument();
    });
  });
});
