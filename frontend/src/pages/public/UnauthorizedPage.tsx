import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home, LogIn } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-rose-200">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700 mb-2">
            <ShieldX className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-slate-900">403 — Access Restricted</CardTitle>
          <CardDescription>
            You do not have the required role or authorization to access this area of CampusFind.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-rose-50/60 border border-rose-200 p-4 text-xs text-rose-800 leading-relaxed">
            Operations under Security Office or Super Admin governance require designated university staff privileges.
            If you believe this is an error, please contact the Central Security Office or the system administrator.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Link to={ROUTES.PUBLIC.HOME} className="w-full">
            <Button variant="outline" size="sm" className="w-full" leftIcon={<Home className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
          <Link to={ROUTES.PUBLIC.LOGIN} className="w-full">
            <Button variant="primary" size="sm" className="w-full" leftIcon={<LogIn className="h-4 w-4" />}>
              Switch Account
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default UnauthorizedPage;
