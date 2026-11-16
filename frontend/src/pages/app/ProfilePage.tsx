import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Award,
  Mail,
  Phone,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/features/profile';
import { useReputation } from '@/features/reputation';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const {
    profile,
    isLoading: isLoadingProfile,
    isSaving,
    error: profileError,
    saveError,
    saveSuccess,
    fetchProfile,
    updateProfile,
    clearSaveStatus,
  } = useProfile();

  const {
    balance,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    balanceError,
    transactionsError,
    fetchBalance,
    fetchTransactions,
  } = useReputation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
  });
  const [formValidationErrors, setFormValidationErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
  }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile]);

  const handleStartEdit = () => {
    clearSaveStatus();
    setFormValidationErrors({});
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    clearSaveStatus();
    setFormValidationErrors({});
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
    setIsEditing(false);
  };

  const validateForm = (): boolean => {
    const errors: { fullName?: string; phoneNumber?: string } = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name cannot be blank';
    } else if (formData.fullName.trim().length > 150) {
      errors.fullName = 'Full name cannot exceed 150 characters';
    }

    if (formData.phoneNumber && formData.phoneNumber.trim().length > 30) {
      errors.phoneNumber = 'Phone number cannot exceed 30 characters';
    }

    setFormValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await updateProfile({
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim() || null,
      // Strictly omit or keep indexNumber untouched; indexNumber is not student-editable here
      indexNumber: null,
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PageContainer size="default">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Student Profile & Reputation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your student identity details and review verified reputation point provenance.
        </p>
      </div>

      {/* Global Profile Error */}
      {profileError && (
        <Alert variant="danger" title="Failed to load profile" className="mb-6">
          <p className="text-sm">{profileError}</p>
          <Button variant="outline" size="sm" onClick={() => fetchProfile()} className="mt-2 text-xs">
            Retry Loading
          </Button>
        </Alert>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <Alert variant="success" title="Profile updated successfully" className="mb-6">
          Your student profile details have been saved and synchronized across the platform.
        </Alert>
      )}

      {/* Save Error Alert */}
      {saveError && (
        <Alert variant="danger" title="Update failed" className="mb-6">
          {saveError}
        </Alert>
      )}

      <div className="space-y-6">
        {/* 1. Profile Information Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-campus-100 text-campus-800 font-bold text-lg shadow-xs">
                  {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : <UserIcon className="h-6 w-6" />}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {isLoadingProfile ? (
                      <Skeleton className="h-6 w-40" />
                    ) : (
                      profile?.fullName || user?.fullName || 'Student User'
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-0.5">
                    <span>{profile?.email || user?.email}</span>
                    {profile?.emailVerified && (
                      <Badge variant="success" size="sm" className="text-[10px]">
                        Verified University Email
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>

              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  disabled={isLoadingProfile}
                  className="flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isLoadingProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            ) : isEditing ? (
              /* Profile Edit Form */
              <form noValidate onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <Input
                      label="Full Name"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      error={formValidationErrors.fullName}
                      placeholder="e.g. John Doe"
                      leftIcon={<UserIcon className="h-4 w-4 text-slate-400" />}
                    />
                  </div>

                  {/* University Email (Read-only protected) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      University Email
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500 text-sm">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                      <Badge variant="default" size="sm" className="ml-auto text-[10px]">
                        Read-only
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Institutional email domain cannot be modified.
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Input
                      label="Contact Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      error={formValidationErrors.phoneNumber}
                      placeholder="e.g. +94771234567"
                      leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
                      helperText="Optional phone for Central Security Office return notifications."
                    />
                  </div>

                  {/* System Role (Read-only protected) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Account Role
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500 text-sm">
                      <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{profile?.role || 'STUDENT'}</span>
                      <Badge variant="default" size="sm" className="ml-auto text-[10px]">
                        System Assigned
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            ) : (
              /* Profile Details View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </span>
                  <span className="text-sm font-semibold text-slate-900 block">
                    {profile?.fullName || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    University Email
                  </span>
                  <span className="text-sm font-semibold text-slate-900 block truncate">
                    {profile?.email}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Contact Phone
                  </span>
                  <span className="text-sm font-semibold text-slate-900 block">
                    {profile?.phoneNumber || <em className="text-slate-400">Not provided</em>}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Account Status
                  </span>
                  <div>
                    <Badge variant={profile?.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                      {profile?.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Role
                  </span>
                  <div>
                    <Badge variant="info" size="sm">
                      {profile?.role || 'STUDENT'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Account Created
                  </span>
                  <span className="text-sm text-slate-700 block">
                    {formatDate(profile?.createdAt)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Reputation Points & Ledger Section */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Reputation Points Ledger</CardTitle>
                  <CardDescription>
                    Auditable points awarded by the Central Security Office for handovers and returns
                  </CardDescription>
                </div>
              </div>

              {/* Balance Summary Header */}
              <div className="flex items-center gap-3 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                    Current Balance
                  </span>
                  <span className="text-xl font-bold text-amber-900 leading-none">
                    {isLoadingBalance ? '—' : `${balance?.currentBalance ?? 0} pts`}
                  </span>
                </div>
                <div className="border-l border-amber-200 pl-3">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                    Lifetime Earned
                  </span>
                  <span className="text-sm font-semibold text-amber-800 leading-none">
                    {isLoadingBalance ? '—' : `${balance?.totalEarned ?? 0} pts`}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Balance error alert */}
            {balanceError && (
              <Alert variant="warning" title="Reputation Balance Unavailable" className="mb-4">
                <p className="text-sm">{balanceError}</p>
                <Button variant="outline" size="sm" onClick={() => fetchBalance()} className="mt-2 text-xs">
                  Retry Balance
                </Button>
              </Alert>
            )}

            {/* Transactions error alert */}
            {transactionsError && (
              <Alert variant="danger" title="Transaction Ledger Unavailable" className="mb-4">
                <p className="text-sm">{transactionsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions(0)}
                  className="mt-2 text-xs"
                >
                  Retry Transactions
                </Button>
              </Alert>
            )}

            {/* Loading state for transactions */}
            {isLoadingTransactions && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border border-slate-100 rounded-lg space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty transactions state */}
            {!isLoadingTransactions && !transactionsError && transactions.length === 0 && (
              <EmptyState
                icon={<Sparkles className="h-10 w-10 text-amber-500" />}
                title="No Reputation Transactions Yet"
                description="When you hand in found items at the Central Security Office or complete verified item returns, your awarded points and audit trail will appear here."
              />
            )}

            {/* Transactions List */}
            {!isLoadingTransactions && !transactionsError && transactions.length > 0 && (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{tx.description}</span>
                          <Badge variant="warning" size="sm" className="text-[10px]">
                            {tx.transactionType === 'FOUND_ITEM_HANDOVER'
                              ? 'Handover Reward'
                              : tx.transactionType === 'ITEM_COLLECTION'
                              ? 'Collection Reward'
                              : 'Admin Adjustment'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        +{tx.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Strict Student Privacy Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-campus-700" />
            <span>Institutional Identity & Privacy Protection</span>
          </p>
          <p>
            Your sensitive university identity documents (such as Student ID card photos and Index
            Numbers) are encrypted and isolated in compliance with university privacy policies. They
            are accessible only to authorized Security Officers during in-person claim verification
            and are never exposed publicly or across other students' accounts.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
