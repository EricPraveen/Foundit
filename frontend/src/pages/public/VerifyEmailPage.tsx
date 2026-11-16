import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Mail, Send, ArrowRight, Home } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { authService, isValidUomEmail, normalizeEmail } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { getErrorMessage, isApiError } from '@/lib/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');

  const [tokenInput, setTokenInput] = useState(tokenFromUrl || '');
  const [isVerifying, setIsVerifying] = useState(Boolean(tokenFromUrl));
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Resend verification state
  const [resendEmail, setResendEmail] = useState(emailFromUrl || '');
  const [resendEmailError, setResendEmailError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const handleVerify = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) {
      setVerificationError('Please provide a verification token.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await authService.verifyEmail(tokenToVerify.trim());
      setIsSuccess(true);
      setSuccessMessage(response.message || 'Email successfully verified! You may now log in to Foundit.');
    } catch (err: unknown) {
      setIsSuccess(false);
      if (isApiError(err)) {
        setVerificationError(getErrorMessage(err, 'The verification token is invalid or has expired.'));
      } else {
        setVerificationError('Network error. Unable to verify token with the CampusFind server.');
      }
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Automatically attempt verification if token is provided in URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl, handleVerify]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendNotice(null);
    setResendEmailError(null);

    const normalized = normalizeEmail(resendEmail);
    if (!normalized) {
      setResendEmailError('Email address is required.');
      return;
    }
    if (!isValidUomEmail(normalized)) {
      setResendEmailError('Must be an official @uom.lk university email.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authService.resendVerification(normalized);
      setResendNotice(response.message);
    } catch (err: unknown) {
      setResendNotice(getErrorMessage(err, 'Failed to process resend request. Please try again.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-campus-100 text-campus-900 mb-2">
            <Mail className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-slate-900">Email Verification</CardTitle>
          <CardDescription>
            Activate your university account to participate in campus lost and found reporting.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* State 1: In Flight Verifying */}
          {isVerifying && (
            <div className="py-8">
              <LoadingIndicator size="lg" message="Verifying your university email address..." />
            </div>
          )}

          {/* State 2: Verification Successful */}
          {!isVerifying && isSuccess && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h4 className="text-lg font-bold text-emerald-900">Account Activated!</h4>
                <p className="text-sm text-emerald-800">{successMessage}</p>
              </div>

              <Link to={ROUTES.PUBLIC.LOGIN} className="block w-full">
                <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Proceed to Log In
                </Button>
              </Link>
            </div>
          )}

          {/* State 3: Verification Failed */}
          {!isVerifying && !isSuccess && verificationError && (
            <div className="space-y-4">
              <Alert variant="danger" title="Verification Failed">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{verificationError}</span>
                </div>
              </Alert>

              <p className="text-xs text-slate-500">
                Verification tokens are single-use and expire after 24 hours. If your link has expired or was already used, please request a fresh link below.
              </p>
            </div>
          )}

          {/* State 4: Manual Token Entry (when no token in URL or after failure) */}
          {!isVerifying && !isSuccess && !tokenFromUrl && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-700">Enter verification token manually:</p>
              <div className="flex gap-2">
                <Input
                  id="tokenInput"
                  placeholder="Paste verification token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleVerify(tokenInput)}
                  disabled={!tokenInput.trim()}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {/* Resend Verification Section */}
          {!isSuccess && !isVerifying && (
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resend Verification Link
              </h5>
              <p className="text-xs text-slate-500">
                Didn&apos;t receive the email? Enter your official @uom.lk address to dispatch a new single-use token.
              </p>

              {resendNotice && (
                <Alert variant="info" onClose={() => setResendNotice(null)}>
                  {resendNotice}
                </Alert>
              )}

              <form onSubmit={handleResend} className="space-y-3" noValidate>
                <Input
                  id="resendEmail"
                  type="email"
                  placeholder="username@uom.lk"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    if (resendEmailError) setResendEmailError(null);
                  }}
                  error={resendEmailError || undefined}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={isResending}
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Send New Verification Link
                </Button>
              </form>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Link to={ROUTES.PUBLIC.HOME}>
            <Button variant="ghost" size="sm" leftIcon={<Home className="h-4 w-4" />}>
              Home
            </Button>
          </Link>
          <Link to={ROUTES.PUBLIC.LOGIN}>
            <Button variant="outline" size="sm">
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
