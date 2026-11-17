import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  FileQuestion,
  ClipboardCheck,
  User,
  Shield,
  ShieldAlert,
  Users,
  Settings,
  ScrollText,
  Award,
  Layers,
  PackageCheck,
  Archive,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const studentItems: NavItem[] = [
    { label: 'Dashboard', to: ROUTES.APP.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Browse Found Items', to: ROUTES.APP.FOUND_ITEMS, icon: <PackageSearch className="h-4 w-4" /> },
    { label: 'My Lost Reports', to: ROUTES.APP.LOST_REPORTS, icon: <FileQuestion className="h-4 w-4" /> },
    { label: 'My Claims', to: ROUTES.APP.CLAIMS, icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: 'Profile & Reputation', to: ROUTES.APP.PROFILE, icon: <User className="h-4 w-4" /> },
  ];

  const officerItems: NavItem[] = [
    { label: 'Officer Dashboard', to: ROUTES.OFFICER.DASHBOARD, icon: <Shield className="h-4 w-4" /> },
    { label: 'Pending Handovers', to: ROUTES.OFFICER.HANDOVERS, icon: <ShieldAlert className="h-4 w-4" /> },
    { label: 'Found Items', to: ROUTES.OFFICER.FOUND_ITEMS, icon: <Layers className="h-4 w-4" /> },
    { label: 'Lost Reports', to: ROUTES.OFFICER.LOST_REPORTS, icon: <FileQuestion className="h-4 w-4" /> },
    { label: 'Claims Review', to: ROUTES.OFFICER.CLAIMS, icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: 'Pending Collections', to: ROUTES.OFFICER.COLLECTIONS, icon: <PackageCheck className="h-4 w-4" /> },
    { label: 'Returned Items', to: ROUTES.OFFICER.RETURNED_ITEMS, icon: <Archive className="h-4 w-4" /> },
  ];

  const adminItems: NavItem[] = [
    { label: 'Admin Dashboard', to: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'User Governance', to: ROUTES.ADMIN.USERS, icon: <Users className="h-4 w-4" /> },
    { label: 'Reputation Rules', to: ROUTES.ADMIN.REPUTATION_RULES, icon: <Award className="h-4 w-4" /> },
    { label: 'System Audit Logs', to: ROUTES.ADMIN.AUDIT_LOGS, icon: <ScrollText className="h-4 w-4" /> },
    { label: 'System Configuration', to: ROUTES.ADMIN.SYSTEM_CONFIG, icon: <Settings className="h-4 w-4" /> },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="py-2">
      <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-campus-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 lg:hidden">
          <span className="font-bold text-campus-900">CampusFind Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {renderNavGroup('Student Portal', studentItems)}

          {role === 'SECURITY_OFFICER' &&
            renderNavGroup('Security Office', officerItems)}

          {role === 'SUPER_ADMIN' && renderNavGroup('System Admin', adminItems)}
        </div>
      </aside>
    </>
  );
};
