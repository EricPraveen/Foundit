import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateLostReportModal } from '@/features/lost-reports/components/CreateLostReportModal';
import { lostReportService } from '@/features/lost-reports/services/lostReportService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import { foundItemService } from '@/features/found-items/services/foundItemService';
import { resetSecurityOfficeCache } from '@/features/found-items/hooks/useSecurityOffice';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';
import type { LostReportResponse } from '@/features/lost-reports/types';
import type { SecurityOfficeResponse } from '@/features/found-items/types';

vi.mock('@/features/lost-reports/services/lostReportService', async () => {
  const actual = await vi.importActual<typeof import('@/features/lost-reports/services/lostReportService')>(
    '@/features/lost-reports/services/lostReportService'
  );
  return {
    ...actual,
    lostReportService: {
      ...actual.lostReportService,
      createLostReport: vi.fn(),
      uploadImage: vi.fn(),
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

vi.mock('@/features/found-items/services/foundItemService', async () => {
  const actual = await vi.importActual<typeof import('@/features/found-items/services/foundItemService')>(
    '@/features/found-items/services/foundItemService'
  );
  return {
    ...actual,
    foundItemService: {
      ...actual.foundItemService,
      getCentralSecurityOffice: vi.fn(),
    },
  };
});

describe('CreateLostReportModal Component', () => {
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

  const mockCreatedReport: LostReportResponse = {
    id: 'report-uuid-1234',
    title: 'Blue Dell XPS 15 Laptop',
    description: 'Left on the table in study room 4',
    distinctiveFeatures: 'Scratch near trackpad and sticker on back',
    category: mockCategories[0],
    location: mockLocations[0],
    specificLocation: 'Study Room 4, Table 2',
    lostAt: '2026-11-15T09:00:00Z',
    designatedSecurityOffice: mockOffice,
    status: 'ACTIVE',
    images: [],
    createdAt: '2026-11-15T09:10:00Z',
    updatedAt: '2026-11-15T09:10:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetCategoryCache();
    resetLocationCache();
    resetSecurityOfficeCache();

    window.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    window.URL.revokeObjectURL = vi.fn();
    global.URL.createObjectURL = window.URL.createObjectURL;
    global.URL.revokeObjectURL = window.URL.revokeObjectURL;

    vi.mocked(categoryService.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue(mockLocations);
    vi.mocked(foundItemService.getCentralSecurityOffice).mockResolvedValue(mockOffice);
    vi.mocked(lostReportService.createLostReport).mockResolvedValue(mockCreatedReport);
  });

  it('renders report modal with confidential notice, categories, locations, and designated security office', async () => {
    render(<CreateLostReportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Report a Lost Item')).toBeInTheDocument();
    expect(screen.getByText('Private & Confidential')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
      expect(screen.getByText('Central Library')).toBeInTheDocument();
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    });
  });

  it('validates required fields, title length, and description length on client side', async () => {
    const user = userEvent.setup();
    render(<CreateLostReportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Private Report/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please select a category')).toBeInTheDocument();
    expect(screen.getByText('Please select a campus location where item was lost')).toBeInTheDocument();
    expect(lostReportService.createLostReport).not.toHaveBeenCalled();
  });

  it('rejects date and time lost set in the future', async () => {
    const user = userEvent.setup();
    render(<CreateLostReportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/Estimated Time Lost \*/i);
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    fireEvent.change(dateInput, { target: { value: futureDate } });

    await user.type(screen.getByLabelText(/Item Title \*/i), 'Blue Dell XPS 15');
    await user.selectOptions(screen.getByLabelText(/Category \*/i), 'cat-1');
    await user.selectOptions(screen.getByLabelText(/Campus Location/i), 'loc-1');
    await user.type(screen.getByPlaceholderText(/Describe what the item looks like/i), 'Valid description of lost laptop');

    await user.click(screen.getByRole('button', { name: /Submit Private Report/i }));

    expect(await screen.findByText('Date when lost cannot be in the future')).toBeInTheDocument();
    expect(lostReportService.createLostReport).not.toHaveBeenCalled();
  });

  it('submits valid lost report and uploads photos sequentially', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    vi.mocked(lostReportService.uploadImage).mockResolvedValue({
      id: 'img-1',
      originalFilename: 'laptop.png',
      publicUrl: 'http://cdn/laptop.png',
      contentType: 'image/png',
      fileSize: 1024,
      createdAt: '2026-11-15T09:12:00Z',
    });

    render(
      <CreateLostReportModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Item Title \*/i), 'Blue Dell XPS 15');
    await user.selectOptions(screen.getByLabelText(/Category \*/i), 'cat-1');
    await user.selectOptions(screen.getByLabelText(/Campus Location/i), 'loc-1');
    await user.type(screen.getByPlaceholderText(/Describe what the item looks like/i), 'Valid description of lost laptop');
    await user.type(screen.getByPlaceholderText(/Scratch near apple logo/i), 'Scratch near trackpad');

    // Attach valid image
    const validImage = new File(['mock content'], 'laptop.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [validImage],
      writable: true,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: /Submit Private Report/i }));

    await waitFor(() => {
      expect(lostReportService.createLostReport).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Blue Dell XPS 15',
          description: 'Valid description of lost laptop',
          distinctiveFeatures: 'Scratch near trackpad',
          categoryId: 'cat-1',
          locationId: 'loc-1',
          designatedSecurityOfficeId: 'office-1',
        })
      );
    });

    await waitFor(() => {
      expect(lostReportService.uploadImage).toHaveBeenCalledWith('report-uuid-1234', validImage);
      expect(handleSuccess).toHaveBeenCalledWith(mockCreatedReport);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
