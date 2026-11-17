import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OfficerLostReportsPage } from '@/pages/officer/OfficerLostReportsPage';
import { OfficerLostReportDetailPage } from '@/pages/officer/OfficerLostReportDetailPage';
import { officerService } from '@/features/officer/services/officerService';
import type { LostReportResponse } from '@/features/officer/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    searchLostReports: vi.fn(),
    getLostReportById: vi.fn(),
    resolveLostReport: vi.fn(),
    cancelLostReport: vi.fn(),
    getLostReportAuditHistory: vi.fn(),
  },
}));

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getActiveCategories: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getActiveLocations: vi.fn().mockResolvedValue([]),
  },
}));

describe('Officer Private Lost Reports Management', () => {
  const mockReports: LostReportResponse[] = [
    {
      id: 'lost-101',
      title: 'Blue Hydro Flask 32oz',
      description: 'Navy blue bottle with University crest sticker',
      distinctiveFeatures: 'Scratch near the bottom rim',
      category: { id: 'c1', name: 'Bottles & Containers', description: 'Drinkware', active: true },
      location: { id: 'l1', name: 'Computer Science Department', active: true },
      specificLocation: 'Lab 03',
      lostAt: '2026-11-16T14:00:00Z',
      designatedSecurityOffice: {
        id: 'office-1',
        name: 'Central Security Office',
        campusLocation: 'Admin Block',
        contactEmail: 'security@uom.lk',
        contactPhone: '+94112650301',
        operatingHours: '24/7',
        active: true,
      },
      status: 'ACTIVE',
      images: [],
      studentContact: {
        id: 'student-1',
        fullName: 'Dinuka Jayasuriya',
        email: 'dinuka@uom.lk',
        phoneNumber: '+94771234567',
      },
      createdAt: '2026-11-16T15:00:00Z',
      updatedAt: '2026-11-16T15:00:00Z',
    },
  ];

  const mockPageData: Page<LostReportResponse> = {
    content: mockReports,
    totalElements: 1,
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

  it('renders private lost reports with student contact and privacy directive', async () => {
    vi.mocked(officerService.searchLostReports).mockResolvedValue(mockPageData);

    render(
      <MemoryRouter>
        <OfficerLostReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Private Lost Reports Desk')).toBeInTheDocument();
    });

    // Privacy warning is visible
    expect(screen.getByText(/Strict Confidentiality Directive/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Lost reports are private student records/i)
    ).toBeInTheDocument();

    // Report and student details
    expect(screen.getByText('Blue Hydro Flask 32oz')).toBeInTheDocument();
    expect(screen.getByText(/Dinuka Jayasuriya/i)).toBeInTheDocument();
    expect(screen.getByText(/dinuka@uom.lk/i)).toBeInTheDocument();
  });

  it('officer resolves an active lost report with notes', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.searchLostReports).mockResolvedValue(mockPageData);

    const resolvedReport: LostReportResponse = {
      ...mockReports[0],
      status: 'RESOLVED',
      resolutionNotes: 'Found and collected by student from lab technician',
    };
    vi.mocked(officerService.resolveLostReport).mockResolvedValue(resolvedReport);

    render(
      <MemoryRouter>
        <OfficerLostReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Blue Hydro Flask 32oz')).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /Resolve/i });
    await user.click(resolveBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Resolve Lost Report')).toBeInTheDocument();
    });

    const notesInput = screen.getByLabelText(/Officer Resolution Notes/i);
    await user.type(notesInput, 'Found and collected by student from lab technician');

    const submitBtn = screen.getByRole('button', { name: /Mark as Resolved/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(officerService.resolveLostReport).toHaveBeenCalledWith('lost-101', {
        resolutionNotes: 'Found and collected by student from lab technician',
      });
      expect(screen.getByText(/marked as RESOLVED/i)).toBeInTheDocument();
    });
  });

  it('officer inspects lost report detail page with student contact information', async () => {
    vi.mocked(officerService.getLostReportById).mockResolvedValue(mockReports[0]);

    render(
      <MemoryRouter initialEntries={['/officer/lost-reports/lost-101']}>
        <Routes>
          <Route path="/officer/lost-reports/:reportId" element={<OfficerLostReportDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Blue Hydro Flask 32oz')).toBeInTheDocument();
      expect(screen.getByText('Dinuka Jayasuriya')).toBeInTheDocument();
      expect(screen.getByText('dinuka@uom.lk')).toBeInTheDocument();
      expect(screen.getByText('+94771234567')).toBeInTheDocument();
      expect(screen.getByText(/Scratch near the bottom rim/i)).toBeInTheDocument();
    });
  });
});
