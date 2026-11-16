import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PublicLayout, AuthenticatedLayout } from '@/layouts';
import { AuthProvider } from '@/features/auth';
import type { User } from '@/types/auth';

describe('Application Layouts', () => {
  describe('PublicLayout', () => {
    it('renders branding, navigation links, and university footer', () => {
      render(
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      );

      expect(screen.getByText('CampusFind')).toBeInTheDocument();
      expect(screen.getByText('University Lost & Found')).toBeInTheDocument();
      expect(screen.getByText('Browse Items')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
      expect(screen.getByText(/University of Moratuwa Central Security Office/i)).toBeInTheDocument();
    });

    it('toggles mobile menu when clicking menu button', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      );

      const toggleButton = screen.getByLabelText('Toggle navigation menu');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('AuthenticatedLayout', () => {
    it('renders user details and student navigation links for Student user', () => {
      const studentUser: User = {
        id: 's-1',
        email: 'student@uom.lk',
        fullName: 'Jane Doe',
        role: 'STUDENT',
      };

      render(
        <AuthProvider initialUser={studentUser} initialToken="test-token">
          <MemoryRouter>
            <AuthenticatedLayout />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('student@uom.lk')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();

      // Navigation links
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Browse Found Items')).toBeInTheDocument();
      expect(screen.getByText('My Lost Reports')).toBeInTheDocument();
      expect(screen.getByText('My Claims')).toBeInTheDocument();
      expect(screen.getByText('Profile & Reputation')).toBeInTheDocument();

      // Officer/Admin groups shouldn't be rendered for a Student
      expect(screen.queryByText('Security Office')).not.toBeInTheDocument();
      expect(screen.queryByText('System Admin')).not.toBeInTheDocument();
    });

    it('renders officer navigation links for Security Officer user', () => {
      const officerUser: User = {
        id: 'o-1',
        email: 'officer@uom.lk',
        fullName: 'Officer Smith',
        role: 'SECURITY_OFFICER',
      };

      render(
        <AuthProvider initialUser={officerUser} initialToken="test-token">
          <MemoryRouter>
            <AuthenticatedLayout />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Officer Smith')).toBeInTheDocument();
      expect(screen.getByText('Security Officer')).toBeInTheDocument();
      expect(screen.getByText('Security Office')).toBeInTheDocument();
      expect(screen.getByText('Officer Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Item Inventory')).toBeInTheDocument();
      expect(screen.getByText('Claim Reviews')).toBeInTheDocument();
      expect(screen.getByText('Handover Verification')).toBeInTheDocument();
    });

    it('renders admin navigation links for Super Admin user', () => {
      const adminUser: User = {
        id: 'a-1',
        email: 'admin@uom.lk',
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
      };

      render(
        <AuthProvider initialUser={adminUser} initialToken="test-token">
          <MemoryRouter>
            <AuthenticatedLayout />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Super Administrator')).toBeInTheDocument();
      expect(screen.getByText('System Admin')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('User Governance')).toBeInTheDocument();
      expect(screen.getByText('Reputation Rules')).toBeInTheDocument();
      expect(screen.getByText('System Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('System Configuration')).toBeInTheDocument();
    });
  });
});
