import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-2">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Email Verification</CardTitle>
          <CardDescription>
            Validating single-use account verification token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            {token ? (
              <p className="text-xs font-mono text-slate-600 break-all">
                Token detected: {token.slice(0, 16)}...
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Please check your @uom.lk inbox and click the verification link sent upon registration.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Token activation endpoint will be integrated in FRONTEND-02 (#100).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link to={ROUTES.PUBLIC.LOGIN} className="w-full">
            <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Proceed to Log in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default VerifyEmailPage;
