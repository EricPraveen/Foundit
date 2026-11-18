import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { NotificationDropdown } from '@/features/notifications';
import { ROUTES } from '@/routes/paths';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.PUBLIC.LOGIN, { replace: true });
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger';
      case 'SECURITY_OFFICER':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'SECURITY_OFFICER':
        return 'Security Officer';
      default:
        return 'Student';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-600"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to={ROUTES.APP.DASHBOARD} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-campus-900 text-white shadow-sm">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-campus-900 hidden sm:inline-block">
            CampusFind
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user?.role && (
          <Badge variant={getRoleBadgeVariant(user.role)} size="sm" className="hidden sm:inline-flex">
            {formatRoleLabel(user.role)}
          </Badge>
        )}

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.fullName || 'Campus User'}
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">{user?.email}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-rose-600 p-2"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:text-xs">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
