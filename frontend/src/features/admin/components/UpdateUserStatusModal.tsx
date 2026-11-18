import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminService } from '../services/adminService';
import type { AdminUserResponse } from '../types';
import type { UserStatus } from '@/types/auth';
import { getErrorMessage } from '@/lib/api/apiError';

interface UpdateUserStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserResponse | null;
  onSuccess?: () => void;
}

export const UpdateUserStatusModal: React.FC<UpdateUserStatusModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setStatus(user.status);
      setReason('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await adminService.updateUserStatus(user.id, {
        status,
        reason: reason.trim() || undefined,
      });

      setSuccessMessage(`Account status updated to ${status} successfully.`);
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(
        getErrorMessage(
          err,
          'Failed to update user status. Please verify permissions and constraints.'
        )
      );
    } finally {
      setIsPending(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) {
          setErrorMessage(null);
          setSuccessMessage(null);
          onClose();
        }
      }}
      title="Update Account Status"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger" title="Status Update Error">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-sm">
          <p className="font-medium text-slate-900">{user.fullName}</p>
          <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Current Role:</span>
            <span className="font-semibold text-slate-800">{user.role}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Email Verified:</span>
            <span
              className={
                user.emailVerified
                  ? 'font-medium text-emerald-600'
                  : 'font-medium text-amber-600'
              }
            >
              {user.emailVerified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {!user.emailVerified && (
          <Alert variant="warning" title="Unverified Email Restriction">
            This user account has not yet completed university email verification. The
            backend prohibits activating unverified accounts.
          </Alert>
        )}

        {user.role === 'SUPER_ADMIN' && (
          <Alert variant="info" title="Super Admin Safety Protection">
            The platform requires at least one active Super Admin. Deactivating the last
            active Super Admin will be rejected by backend integrity guards.
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            disabled={isPending}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600 disabled:bg-slate-100"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Administrative Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            disabled={isPending}
            placeholder="e.g. Requested account hold, graduation deactivation, disciplinary suspension..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600 disabled:bg-slate-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};
