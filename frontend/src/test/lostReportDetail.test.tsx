import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LostReportDetailPage } from '@/pages/app/LostReportDetailPage';
import { lostReportService } from '@/features/lost-reports/services/lostReportService';
import type { LostReportResponse } from '@/features/lost-reports/types';
import { ApiError } from '@/lib/api/apiError';

vi.mock('@/features/lost-reports/services/lostReportService', async () => {
  const actual = await vi.importActual<typeof import('@/features/lost-reports/services/lostReportService')>(
    '@/features/lost-reports/services/lostReportService'
  );
  return {
    ...actual,
    lostReportService: {
      ...actual.lostReportService,
      getMyLostReportById: vi.fn(),
      updateLostReport: vi.fn(),
      resolveLostReport: vi.fn(),
      cancelLostReport: vi.fn(),
    },
  };
});

describe('LostReportDetailPage Component', () => {
  const mockReport: LostReportResponse = {
    id: 'report-abc-123',
    title: 'Silver Apple Watch Series 8',
    description: 'Lost somewhere around the library study cubicles',
    distinctiveFeatures: 'Engraved with initials EP on back',
    category: { id: 'cat-1', name: 'Electronics & Gadgets', description: 'Phones, watches', active: true },
    location: { id: 'loc-1', name: 'Central Library', active: true },
    specificLocation: 'Cubicle 12, Level 2',
    lostAt: '2026-11-15T10:00:00Z',
    designatedSecurityOffice: {
      id: 'off-1',
      name: 'Central Security Office',
      campusLocation: 'Admin Building Room 102',
      contactEmail: 'security@uom.lk',
      contactPhone: '+94 11 2650301',
      operatingHours: '08:00 - 18:00',
      active: true,
    },
    status: 'ACTIVE',
    images: [
      {
        id: 'img-1',
        originalFilename: 'watch.png',
        publicUrl: 'http://cdn/watch.png',
        contentType: 'image/png',
        fileSize: 2048,
        createdAt: '2026-11-15T10:05:00Z',
      },
    ],
    createdAt: '2026-11-15T10:05:00Z',
    updatedAt: '2026-11-15T10:05:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialId = 'report-abc-123') => {
    return render(
      <MemoryRouter initialEntries={[`/lost-reports/${initialId}`]}>
        <Routes>
          <Route path="/lost-reports/:id" element={<LostReportDetailPage />} />
          <Route path="/lost-reports" element={<div>My Lost Reports List View</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders complete lost report details, photos, and distinctive features for report owner', async () => {
    vi.mocked(lostReportService.getMyLostReportById).mockResolvedValue(mockReport);

    renderWithRouter();

    expect(await screen.findByText('Silver Apple Watch Series 8')).toBeInTheDocument();
    expect(screen.getByText('Engraved with initials EP on back')).toBeInTheDocument();
    expect(screen.getByText('Cubicle 12, Level 2')).toBeInTheDocument();
    expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    expect(screen.getByText('Private to Owner & Officers')).toBeInTheDocument();
  });

  it('displays anti-IDOR 404 message when unauthorized or nonexistent report is requested', async () => {
    vi.mocked(lostReportService.getMyLostReportById).mockRejectedValue(
      new ApiError({
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: 'Lost report not found or access restricted.',
        path: '/api/v1/lost-reports/unauthorized-id',
      })
    );

    renderWithRouter('unauthorized-id');

    expect(await screen.findByText('Report Not Found or Access Restricted')).toBeInTheDocument();
    expect(screen.getByText(/To protect student privacy, lost reports are strictly restricted/i)).toBeInTheDocument();
  });

  it('navigates back to lost reports list when clicking return button', async () => {
    const user = userEvent.setup();
    vi.mocked(lostReportService.getMyLostReportById).mockRejectedValue(
      new ApiError({
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: 'Not found',
        path: '/api/v1/lost-reports/unauthorized-id',
      })
    );

    renderWithRouter('unauthorized-id');

    const returnBtn = await screen.findByRole('button', { name: /Return to My Lost Reports/i });
    await user.click(returnBtn);

    expect(await screen.findByText('My Lost Reports List View')).toBeInTheDocument();
  });
});
