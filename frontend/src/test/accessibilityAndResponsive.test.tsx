import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Header } from '@/layouts/Header';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AuthProvider } from '@/features/auth';
import { notificationService } from '@/features/notifications/services/notificationService';

vi.mock('@/features/notifications/services/notificationService', () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getMyNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('Accessibility & Responsive Design QA Suite', () => {
  const mockStudentUser = {
    id: 'student-1',
    email: 'kasun.21@uom.lk',
    fullName: 'Kasun Bandara',
    role: 'STUDENT' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({ unreadCount: 0 });
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
  });

  describe('Skip to Main Content Navigation', () => {
    it('AuthenticatedLayout provides accessible skip to main content link', () => {
      render(
        <AuthProvider initialUser={mockStudentUser} initialToken="mock-token">
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AuthenticatedLayout />}>
                <Route path="/" element={<div>Page Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent?.tagName.toLowerCase()).toBe('main');
    });

    it('PublicLayout provides accessible skip to main content link', () => {
      render(
        <AuthProvider initialUser={null} initialToken={null}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<div>Public Home</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#public-main-content');

      const mainElement = document.getElementById('public-main-content');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement?.tagName.toLowerCase()).toBe('main');
    });
  });

  describe('Modal Accessibility and Keyboard Focus Behavior', () => {
    it('Modal renders with dialog role, aria-modal, and closes on Escape key', async () => {
      const handleClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Verification Required"
          description="Please review physical custody requirements."
        >
          <div>Modal Body Content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Verification Required')).toBeInTheDocument();
      expect(screen.getByText('Please review physical custody requirements.')).toBeInTheDocument();

      // Trigger Escape key
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('Modal close button is keyboard accessible and labeled', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={handleClose} title="Accessible Modal">
          <p>Dialog Body</p>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /Close dialog/i });
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Accessibility & ARIA Associations', () => {
    it('Input establishes accessible label association and handles normal state', () => {
      render(<Input label="Student Index Number" id="indexNumber" placeholder="210001A" />);

      const label = screen.getByText('Student Index Number');
      const input = screen.getByPlaceholderText('210001A');

      expect(label).toHaveAttribute('for', 'indexNumber');
      expect(input).toHaveAttribute('id', 'indexNumber');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('Input connects error message via aria-describedby and sets aria-invalid', () => {
      render(
        <Input
          label="Institutional Email"
          id="email"
          error="Must be a valid @uom.lk university email address"
        />
      );

      const input = screen.getByLabelText('Institutional Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');

      const errorText = screen.getByText('Must be a valid @uom.lk university email address');
      expect(errorText).toHaveAttribute('id', 'email-error');
    });

    it('Input connects helper text via aria-describedby when not in error state', () => {
      render(
        <Input
          label="Password"
          id="password"
          type="password"
          helperText="Must contain at least 8 characters with numbers and symbols"
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('aria-describedby', 'password-helper');

      const helper = screen.getByText('Must contain at least 8 characters with numbers and symbols');
      expect(helper).toHaveAttribute('id', 'password-helper');
    });
  });

  describe('Responsive Navigation QA', () => {
    it('Header renders responsive mobile sidebar toggle button with aria-label', async () => {
      const handleToggleSidebar = vi.fn();
      const user = userEvent.setup();

      render(
        <AuthProvider initialUser={mockStudentUser} initialToken="mock-token">
          <MemoryRouter>
            <Header onToggleSidebar={handleToggleSidebar} />
          </MemoryRouter>
        </AuthProvider>
      );

      const toggleButton = screen.getByRole('button', { name: /Open sidebar/i });
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton);
      expect(handleToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('PublicLayout allows toggling mobile drawer menu on small screens', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider initialUser={null} initialToken={null}>
          <MemoryRouter initialEntries={['/']}>
            <PublicLayout />
          </MemoryRouter>
        </AuthProvider>
      );

      const mobileToggleBtn = screen.getByRole('button', { name: /Toggle navigation menu/i });
      expect(mobileToggleBtn).toBeInTheDocument();

      // Open mobile drawer
      await user.click(mobileToggleBtn);

      // Verify sign in / register navigation buttons are present in drawer
      expect(screen.getAllByRole('button', { name: /Log in/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Register/i }).length).toBeGreaterThan(0);
    });
  });
});
