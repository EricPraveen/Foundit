import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, MailCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { authService, isValidUomEmail, normalizeEmail } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage, getFieldValidationError, isApiError } from '@/lib/api';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (fullName.trim().length > 150) {
      errors.fullName = 'Full name cannot exceed 150 characters';
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      errors.email = 'University email is required';
    } else if (!isValidUomEmail(normalizedEmail)) {
      errors.email = 'Registration requires an official @uom.lk email. Subdomains (e.g. @student.uom.lk) are rejected.';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({
        fullName: fullName.trim(),
        email: normalizeEmail(email),
        password,
      });

      setSuccessEmail(normalizeEmail(email));
      setIsSuccess(true);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 409) {
          setServerError('An account with this email address is already registered.');
          setFieldErrors((prev) => ({
            ...prev,
            email: 'This email is already in use.',
          }));
        } else if (err.status === 400) {
          const emailErr = getFieldValidationError(err, 'email');
          const passErr = getFieldValidationError(err, 'password');
          const nameErr = getFieldValidationError(err, 'fullName');

          if (emailErr || passErr || nameErr) {
            setFieldErrors({
              ...(emailErr && { email: emailErr }),
              ...(passErr && { password: passErr }),
              ...(nameErr && { fullName: nameErr }),
            });
          }
          setServerError(getErrorMessage(err, 'Validation failed. Please review the highlighted fields.'));
        } else {
          setServerError(getErrorMessage(err, 'Registration could not be completed. Please try again later.'));
        }
      } else {
        setServerError('Network error. Unable to connect to the CampusFind authentication service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg border-emerald-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3">
              <MailCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-slate-900">Check Your University Inbox</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Registration successful! A single-use verification link has been sent to:
            </CardDescription>
            <div className="pt-2">
              <span className="font-mono text-sm font-semibold text-campus-900 bg-campus-50 px-3 py-1 rounded-md border border-campus-200">
                {successEmail}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Alert variant="info" title="Verification Policy">
              Please click the verification link in your university email within 24 hours to activate your account.
              Email verification alone does not prove student identity; physical handover and ownership verification are conducted in person by Security Officers.
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Link to={ROUTES.PUBLIC.LOGIN} className="w-full">
              <Button variant="primary" size="md" className="w-full">
                Proceed to Log In
              </Button>
            </Link>
            <Link
              to={`${ROUTES.PUBLIC.VERIFY_EMAIL}?email=${encodeURIComponent(successEmail)}`}
              className="w-full text-center text-xs text-slate-600 hover:text-campus-900 underline"
            >
              Need to enter token manually or resend link?
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-campus-100 text-campus-900 mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-slate-900">Student Registration</CardTitle>
          <CardDescription>
            Create your account using your official University of Moratuwa email.
          </CardDescription>
          <div className="pt-2 flex justify-center">
            <Badge variant="default">Accepts exact @uom.lk domains only</Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="danger" title="Registration Error" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}

            {/* Full Name Field */}
            <Input
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="e.g. Kasun Perera"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }
              }}
              error={fieldErrors.fullName}
              leftIcon={<User className="h-4 w-4" />}
              autoComplete="name"
              required
            />

            {/* University Email Field */}
            <Input
              id="email"
              label="University Email Address"
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
              helperText="Must end exactly with @uom.lk (subdomains such as @student.uom.lk are rejected)"
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            {/* Password Field */}
            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
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
                    aria-label={showPassword ? 'Hide password visibility' : 'Show password visibility'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <Input
                id="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                error={fieldErrors.confirmPassword}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pointer-events-auto text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password visibility' : 'Show confirm password visibility'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                autoComplete="new-password"
                required
              />
            </div>

            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                By registering, you confirm that you will abide by university campus property regulations. Handing in or claiming items requires in-person Security Office verification.
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
              Create Account
            </Button>

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

export default RegisterPage;
