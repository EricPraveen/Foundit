import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-2">
            <SearchX className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">404 — Page Not Found</CardTitle>
          <CardDescription>
            The page or resource you are looking for does not exist or may have been relocated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            Please check the URL in your address bar or return to the CampusFind homepage.
          </p>
        </CardContent>
        <CardFooter>
          <Link to={ROUTES.PUBLIC.HOME} className="w-full">
            <Button variant="primary" size="sm" className="w-full" leftIcon={<Home className="h-4 w-4" />}>
              Return to Safety
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default NotFoundPage;
