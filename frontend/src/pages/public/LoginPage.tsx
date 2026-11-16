import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-campus-100 text-campus-900 mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Log in to CampusFind</CardTitle>
          <CardDescription>
            Enter your verified @uom.lk university credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {from && (
            <Alert variant="info" title="Authentication Required">
              You must log in to access <span className="font-mono text-xs">{from}</span>.
            </Alert>
          )}

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Authentication Foundation Ready
            </p>
            <p className="text-xs text-slate-500">
              Interactive authentication flows and JWT token handling are scheduled for FRONTEND-02 (#100).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link
              to={ROUTES.PUBLIC.REGISTER}
              className="font-medium text-campus-700 hover:text-campus-900 underline"
            >
              Register here
            </Link>
          </div>
          <Link to={ROUTES.PUBLIC.HOME} className="w-full">
            <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default LoginPage;
