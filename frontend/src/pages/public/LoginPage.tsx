import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { authService, isValidUomEmail, normalizeEmail, useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { getErrorMessage, isApiError } from '@/lib/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const normalized = normalizeEmail(email);
    if (!normalized) {
      errors.email = 'University email is required';
    } else if (!isValidUomEmail(normalized)) {
      errors.email = 'Please enter an official @uom.lk university email';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setUnverifiedEmail(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const authResponse = await authService.login({
        email: normalizeEmail(email),
        password,
      });

      // Synchronize in auth context
      login(authResponse);

      // Determine appropriate redirect destination
      if (from && from !== ROUTES.PUBLIC.LOGIN && from !== ROUTES.PUBLIC.UNAUTHORIZED) {
        navigate(from, { replace: true });
      } else {
        switch (authResponse.user.role) {
          case 'SUPER_ADMIN':
            navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
            break;
          case 'SECURITY_OFFICER':
            navigate(ROUTES.OFFICER.DASHBOARD, { replace: true });
            break;
          default:
            navigate(ROUTES.APP.DASHBOARD, { replace: true });
            break;
        }
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 401) {
          setServerError('Invalid email or password. Please verify your credentials and try again.');
        } else if (err.status === 403) {
          if (err.message && err.message.toLowerCase().includes('not verified')) {
            setUnverifiedEmail(normalizeEmail(email));
            setServerError(err.message);
          } else {
            setServerError(err.message || 'Your account is suspended or deactivated. Please contact the administrator.');
          }
        } else {
          setServerError(getErrorMessage(err, 'Authentication failed. Please try again.'));
        }
      } else {
        setServerError('Network error. Unable to connect to the CampusFind authentication service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-campus-100 text-campus-900 mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-slate-900">Log In to CampusFind</CardTitle>
          <CardDescription>
            Enter your verified @uom.lk university credentials.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {from && (
              <Alert variant="info" title="Authentication Required">
                You must log in to access <span className="font-mono text-xs">{from}</span>.
              </Alert>
            )}

            {serverError && (
              <Alert variant="danger" title="Login Error" onClose={() => setServerError(null)}>
                <div>{serverError}</div>
                {unverifiedEmail && (
                  <div className="mt-2 pt-2 border-t border-rose-200">
                    <Link
                      to={`${ROUTES.PUBLIC.VERIFY_EMAIL}?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="font-medium underline hover:text-rose-950 text-xs"
                    >
                      Click here to activate your account or resend your verification link &rarr;
                    </Link>
                  </div>
                )}
              </Alert>
            )}

            {/* University Email Field */}
            <Input
              id="loginEmail"
              label="University Email"
              type="email"
              placeholder="username@uom.lk"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              error={fieldErrors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="loginPassword" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to={ROUTES.PUBLIC.FORGOT_PASSWORD}
                  className="text-xs text-campus-700 hover:text-campus-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  error={fieldErrors.password}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pointer-events-auto text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                CampusFind uses secure stateless JWT authentication. Sessions expire after 24 hours.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
            >
              Log In
            </Button>

            <div className="text-center text-xs text-slate-500">
              Don&apos;t have an account yet?{' '}
              <Link
                to={ROUTES.PUBLIC.REGISTER}
                className="font-medium text-campus-700 hover:text-campus-900 underline"
              >
                Register with @uom.lk
              </Link>
            </div>

            <Link to={ROUTES.PUBLIC.HOME} className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-slate-500" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
