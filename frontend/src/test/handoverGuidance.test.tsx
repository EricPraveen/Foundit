import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HandoverGuidanceNotice } from '@/features/found-items/components/HandoverGuidanceNotice';
import type { SecurityOfficeResponse } from '@/features/found-items/types';

describe('HandoverGuidanceNotice Component', () => {
  const mockOffice: SecurityOfficeResponse = {
    id: 'office-1',
    name: 'Central Security Office',
    campusLocation: 'Admin Building Ground Floor, Room 102',
    contactEmail: 'security@uom.lk',
    contactPhone: '+94 11 2650301',
    operatingHours: 'Mon - Fri 08:00 - 18:00',
    active: true,
  };

  it('renders official handover protocol steps and security invariants', () => {
    render(<HandoverGuidanceNotice office={mockOffice} />);

    expect(screen.getByText('Official Handover & Custody Policy')).toBeInTheDocument();
    expect(screen.getByText('University of Moratuwa Lost & Found Security Protocol')).toBeInTheDocument();

    // Step 1
    expect(screen.getByText('Pending Handover')).toBeInTheDocument();
    expect(screen.getByText(/excluded from the public catalog/i)).toBeInTheDocument();

    // Step 2
    expect(screen.getByText('Physical Handover')).toBeInTheDocument();
    expect(screen.getByText(/Bring the found item to the Central Security Office/i)).toBeInTheDocument();

    // Step 3
    expect(screen.getByText('Published & Points Awarded')).toBeInTheDocument();
    expect(screen.getByText(/reputation points are awarded/i)).toBeInTheDocument();

    // Security Office details
    expect(screen.getByText(/Custody Desk: Central Security Office/i)).toBeInTheDocument();
    expect(screen.getByText('Admin Building Ground Floor, Room 102')).toBeInTheDocument();
    expect(screen.getByText('Mon - Fri 08:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('+94 11 2650301')).toBeInTheDocument();
    expect(screen.getByText('security@uom.lk')).toBeInTheDocument();

    // Security Invariant reminder: no student self-verification
    expect(screen.getByText(/Students cannot self-verify handovers/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirm Handover/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark Available/i })).not.toBeInTheDocument();
  });

  it('renders compact handover alert banner correctly', () => {
    render(<HandoverGuidanceNotice office={mockOffice} compact />);

    expect(screen.getByText('Physical Handover Required for Catalog Listing')).toBeInTheDocument();
    expect(screen.getByText(/hidden from public search/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Building Ground Floor, Room 102/i)).toBeInTheDocument();
  });
});
