import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '@/pages/app/ProfilePage';
import { AuthProvider } from '@/features/auth';
import { profileService } from '@/features/profile/services/profileService';
import { reputationService } from '@/features/reputation/services/reputationService';
import { User } from '@/types/auth';

vi.mock('@/features/profile/services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('@/features/reputation/services/reputationService', () => ({
  reputationService: {
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
  },
}));

describe('ProfilePage Component', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'kamal@uom.lk',
    fullName: 'Kamal Perera',
    role: 'STUDENT',
  };

  const mockProfileResponse = {
    id: 'user-123',
    email: 'kamal@uom.lk',
    fullName: 'Kamal Perera',
    role: 'STUDENT' as const,
    status: 'ACTIVE' as const,
    emailVerified: true,
    indexNumber: '220050K', // SENSITIVE: MUST NOT BE DISPLAYED
    phoneNumber: '+94771234567',
    indexNumberVerified: false,
    createdAt: '2026-11-14T10:00:00Z',
  };

  const mockReputationBalance = {
    userId: 'user-123',
    currentBalance: 25,
    totalEarned: 25,
    totalTransactions: 2,
  };

  const mockReputationTransactions = {
    content: [
      {
        id: 'tx-1',
        transactionType: 'FOUND_ITEM_HANDOVER' as const,
        points: 15,
        description: 'Points awarded for handing over found item: Scientific Calculator',
        createdAt: '2026-11-15T12:00:00Z',
      },
      {
        id: 'tx-2',
        transactionType: 'ITEM_COLLECTION' as const,
        points: 10,
        description: 'Points awarded for item collection: Blue Water Bottle',
        createdAt: '2026-11-16T09:00:00Z',
      },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileService.getProfile).mockResolvedValue(mockProfileResponse);
    vi.mocked(reputationService.getBalance).mockResolvedValue(mockReputationBalance);
    vi.mocked(reputationService.getTransactions).mockResolvedValue(mockReputationTransactions);
  });

  const renderProfilePage = () => {
    return render(
      <MemoryRouter>
        <AuthProvider initialUser={mockUser} initialToken="mock-token">
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders student profile information from backend API', async () => {
    renderProfilePage();

    expect(screen.getByText('Student Profile & Reputation')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Kamal Perera').length).toBeGreaterThan(0);
      expect(screen.getAllByText('kamal@uom.lk').length).toBeGreaterThan(0);
      expect(screen.getByText('+94771234567')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Verified University Email')).toBeInTheDocument();
    });
  });

  it('STRICT PRIVACY: never renders student Index Number or indexNumberVerified', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getAllByText('Kamal Perera').length).toBeGreaterThan(0);
    });

    // Verify sensitive Index Number is NOT in document anywhere
    expect(screen.queryByText('220050K')).not.toBeInTheDocument();
    expect(screen.queryByText(/220050/i)).not.toBeInTheDocument();
  });

  it('toggles edit mode, validates required full name, and submits update to backend', async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce({
      ...mockProfileResponse,
      fullName: 'Kamal S. Perera',
      phoneNumber: '+94779999999',
    });

    const user = userEvent.setup();
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

    const fullNameInput = screen.getByLabelText(/Full Name/i);
    const phoneInput = screen.getByLabelText(/Contact Phone Number/i);

    expect(fullNameInput).toHaveValue('Kamal Perera');
    expect(phoneInput).toHaveValue('+94771234567');

    // Test blank name validation
    await user.clear(fullNameInput);
    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(screen.getByText('Full name cannot be blank')).toBeInTheDocument();
    expect(profileService.updateProfile).not.toHaveBeenCalled();

    // Type valid updated name and phone
    await user.type(fullNameInput, 'Kamal S. Perera');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+94779999999');

    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        fullName: 'Kamal S. Perera',
        phoneNumber: '+94779999999',
        indexNumber: null,
      });
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('preserves read-only status of email and system role during edit mode', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Edit Profile/i }));

    // Institutional email has read-only badge and is not an editable text input
    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.getByText('System Assigned')).toBeInTheDocument();
  });

  it('displays backend error message when update profile fails', async () => {
    vi.mocked(profileService.updateProfile).mockRejectedValueOnce(
      new Error('Full name contains invalid characters.')
    );

    const user = userEvent.setup();
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Edit Profile/i }));
    await user.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
      expect(screen.getByText('Full name contains invalid characters.')).toBeInTheDocument();
    });
  });

  it('renders reputation points balance and transaction history', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getAllByText('25 pts').length).toBeGreaterThan(0);
      expect(screen.getByText('Points awarded for handing over found item: Scientific Calculator')).toBeInTheDocument();
      expect(screen.getByText('+15 pts')).toBeInTheDocument();
      expect(screen.getByText('Handover Reward')).toBeInTheDocument();
      expect(screen.getByText('Points awarded for item collection: Blue Water Bottle')).toBeInTheDocument();
      expect(screen.getByText('+10 pts')).toBeInTheDocument();
      expect(screen.getByText('Collection Reward')).toBeInTheDocument();
    });
  });

  it('displays empty state when user has no reputation transactions', async () => {
    vi.mocked(reputationService.getTransactions).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText(/No Reputation Transactions Yet/i)).toBeInTheDocument();
    });
  });
});
