import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-900 mb-2">
            <KeyRound className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-slate-900">Password Recovery</CardTitle>
          <CardDescription>
            Institutional Account Access & Credential Assistance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="warning" title="Self-Service Recovery Pending">
            Online self-service password reset is currently pending backend service integration.
            The production Spring Boot backend does not currently expose automated password reset endpoints.
          </Alert>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">In-Person Assistance</p>
                <p>
                  Visit the Central Security Office with your physical University Student ID card to request an administrative password reset.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Administrative Support</p>
                <p>
                  Email the system administrators from your official university account to verify your identity.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Link to={ROUTES.PUBLIC.LOGIN} className="w-full">
            <Button variant="primary" size="md" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
