import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportFoundItemModal } from '@/features/found-items/components/ReportFoundItemModal';
import { foundItemService } from '@/features/found-items/services/foundItemService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import { resetSecurityOfficeCache } from '@/features/found-items/hooks/useSecurityOffice';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';
import type { SecurityOfficeResponse, FoundItemResponse } from '@/features/found-items/types';

vi.mock('@/features/found-items/services/foundItemService', async () => {
  const actual = await vi.importActual<typeof import('@/features/found-items/services/foundItemService')>(
    '@/features/found-items/services/foundItemService'
  );
  return {
    ...actual,
    foundItemService: {
      ...actual.foundItemService,
      reportFoundItem: vi.fn(),
      uploadImage: vi.fn(),
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

describe('ReportFoundItemModal Component', () => {
  const mockOffice: SecurityOfficeResponse = {
    id: 'office-1',
    name: 'Central Security Office',
    campusLocation: 'Admin Building Ground Floor, Room 102',
    contactEmail: 'security@uom.lk',
    contactPhone: '+94 11 2650301',
    operatingHours: 'Mon - Fri 08:00 - 18:00',
    active: true,
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Electronics & Gadgets', description: 'Phones, calculators, laptops', active: true },
    { id: 'cat-2', name: 'Identity & Cards', description: 'Student IDs, wallets, keys', active: true },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Central Library', campusZone: 'North Zone', active: true },
    { id: 'loc-2', name: 'Sumanadasa Building', campusZone: 'East Zone', active: true },
  ];

  const mockCreatedItem: FoundItemResponse = {
    id: 'item-uuid-1234',
    title: 'Casio fx-991EX Calculator',
    description: 'Found on desk 4 in discussion room B',
    categoryId: 'cat-1',
    categoryName: 'Electronics & Gadgets',
    locationId: 'loc-1',
    locationName: 'Central Library',
    specificLocation: 'Discussion Room B Desk 4',
    foundAt: '2026-11-15T08:30:00Z',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    handoverStatus: 'PENDING',
    availabilityStatus: 'UNAVAILABLE',
    images: [],
    createdAt: '2026-11-15T08:35:00Z',
    updatedAt: '2026-11-15T08:35:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetSecurityOfficeCache();
    resetCategoryCache();
    resetLocationCache();

    vi.mocked(foundItemService.getCentralSecurityOffice).mockResolvedValue(mockOffice);
    vi.mocked(categoryService.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue(mockLocations);
    vi.mocked(foundItemService.reportFoundItem).mockResolvedValue(mockCreatedItem);
    vi.mocked(foundItemService.uploadImage).mockResolvedValue({
      id: 'img-1',
      originalFilename: 'calc.jpg',
      storagePath: 'items/1234/calc.jpg',
      publicUrl: '/api/v1/storage/found-items/items/1234/calc.jpg',
      contentType: 'image/jpeg',
      fileSize: 102400,
      createdAt: '2026-11-15T08:36:00Z',
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders reporting form fields, category/location options, and designated security office details', async () => {
    render(<ReportFoundItemModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Report a Found Item/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Item Title \/ Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Campus Location Where Found \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date & Time Found \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \*/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Central Security Office/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Admin Building Ground Floor, Room 102/i)).toBeInTheDocument();
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
      expect(screen.getByText(/Central Library/i)).toBeInTheDocument();
    });
  });

  it('validates required fields, title length, and description length on client side', async () => {
    const user = userEvent.setup();
    render(<ReportFoundItemModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Found Report/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please select a category')).toBeInTheDocument();
    expect(screen.getByText('Please select a campus location')).toBeInTheDocument();

    // Test title too short
    const titleInput = screen.getByLabelText(/Item Title \/ Name \*/i);
    await user.type(titleInput, 'ab');
    await user.click(submitBtn);
    expect(await screen.findByText('Title must be between 3 and 200 characters')).toBeInTheDocument();

    // Test description too short
    const descInput = screen.getByLabelText(/Description \*/i);
    await user.type(descInput, 'abcd');
    await user.click(submitBtn);
    expect(await screen.findByText('Description must be between 5 and 2000 characters')).toBeInTheDocument();

    expect(foundItemService.reportFoundItem).not.toHaveBeenCalled();
  });

  it('rejects found date and time set in the future', async () => {
    const user = userEvent.setup();
    render(<ReportFoundItemModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/Date & Time Found \*/i);
    // Set a date 2 days in future
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await user.clear(dateInput);
    await user.type(dateInput, futureDate);

    await user.type(screen.getByLabelText(/Item Title \/ Name \*/i), 'Casio Scientific Calculator');
    await user.selectOptions(screen.getByLabelText(/Category \*/i), 'cat-1');
    await user.selectOptions(screen.getByLabelText(/Campus Location Where Found \*/i), 'loc-1');
    await user.type(screen.getByLabelText(/Description \*/i), 'Found on discussion table 4.');

    const submitBtn = screen.getByRole('button', { name: /Submit Found Report/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Found date and time cannot be in the future')).toBeInTheDocument();
    expect(foundItemService.reportFoundItem).not.toHaveBeenCalled();
  });

  it('validates image attachments: rejects non-image files and files larger than 5MB', async () => {
    render(<ReportFoundItemModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // 1. Invalid mime type file
    const invalidFile = new File(['text data'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: true,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(await screen.findByText(/File "notes.txt" is not supported/i)).toBeInTheDocument();

    // 2. Oversized file (> 5 MB)
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: true,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(await screen.findByText(/File "large.jpg" exceeds the 5 MB limit/i)).toBeInTheDocument();
  });

  it('submits valid form with photos, calls backend APIs, and displays handover instructions', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ReportFoundItemModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
    });

    // Fill valid form
    await user.type(screen.getByLabelText(/Item Title \/ Name \*/i), 'Casio fx-991EX Calculator');
    await user.selectOptions(screen.getByLabelText(/Category \*/i), 'cat-1');
    await user.selectOptions(screen.getByLabelText(/Campus Location Where Found \*/i), 'loc-1');
    await user.type(screen.getByLabelText(/Specific Location Details/i), 'Discussion Room B Desk 4');
    await user.type(screen.getByLabelText(/Description \*/i), 'Black calculator with silver buttons and sticker on back.');

    // Attach valid image
    const validImage = new File(['mock content'], 'calculator.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [validImage],
      writable: true,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByAltText('calculator.png')).toBeInTheDocument();
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Found Report/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(foundItemService.reportFoundItem).toHaveBeenCalledTimes(1);
    });

    expect(foundItemService.reportFoundItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Casio fx-991EX Calculator',
        description: 'Black calculator with silver buttons and sticker on back.',
        categoryId: 'cat-1',
        locationId: 'loc-1',
        specificLocation: 'Discussion Room B Desk 4',
        designatedSecurityOfficeId: 'office-1',
      })
    );

    await waitFor(() => {
      expect(foundItemService.uploadImage).toHaveBeenCalledTimes(1);
      expect(foundItemService.uploadImage).toHaveBeenCalledWith('item-uuid-1234', validImage);
    });

    // Verification of Success Screen & Handover guidance
    expect(await screen.findByText(/Report Created: Casio fx-991EX Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/PENDING HANDOVER/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Mandatory Step: Physical Handover/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Admin Building Ground Floor, Room 102/i)[0]).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(mockCreatedItem);
  });
});
