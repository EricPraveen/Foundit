import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const RegisterPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-campus-100 text-campus-900 mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Student Registration</CardTitle>
          <CardDescription>
            Join CampusFind using your official university email.
          </CardDescription>
          <div className="pt-2">
            <Badge variant="default">Accepts exact @uom.lk domains only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700 mb-1">
              Registration Module Scheduled
            </p>
            <p className="text-xs text-slate-500">
              Registration validation and single-use email verification are scheduled for FRONTEND-02 (#100).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to={ROUTES.PUBLIC.LOGIN}
              className="font-medium text-campus-700 hover:text-campus-900 underline"
            >
              Log in
            </Link>
          </div>
          <Link to={ROUTES.PUBLIC.HOME} className="w-full">
            <Button variant="outline" size="sm" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default RegisterPage;
