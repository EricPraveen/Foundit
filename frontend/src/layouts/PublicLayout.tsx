import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Search, LogIn, UserPlus, Menu, X, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (user?.role === 'SUPER_ADMIN') return ROUTES.ADMIN.DASHBOARD;
    if (user?.role === 'SECURITY_OFFICER') return ROUTES.OFFICER.DASHBOARD;
    return ROUTES.APP.DASHBOARD;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top University Public Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={ROUTES.PUBLIC.HOME} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-campus-900 text-white shadow-sm">
              <Search className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-campus-900">CampusFind</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                University Lost & Found
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to={ROUTES.PUBLIC.HOME}
              className="text-sm font-medium text-slate-600 hover:text-campus-900 transition-colors"
            >
              Browse Items
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            {isAuthenticated ? (
              <Link to={getDashboardPath()}>
                <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.PUBLIC.LOGIN}>
                  <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                    Log in
                  </Button>
                </Link>
                <Link to={ROUTES.PUBLIC.REGISTER}>
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                    Register (@uom.lk)
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-600"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3">
            <Link
              to={ROUTES.PUBLIC.HOME}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Browse Items
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to={ROUTES.PUBLIC.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      Log in
                    </Button>
                  </Link>
                  <Link to={ROUTES.PUBLIC.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full justify-center">
                      Register (@uom.lk)
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* University Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-campus-700" />
            <span>CampusFind &bull; University of Moratuwa Central Security Office</span>
          </div>
          <div>All handovers and claims are physically verified by University Security Officers.</div>
        </div>
      </footer>
    </div>
  );
};
