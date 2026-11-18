import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import type { AdminUserResponse } from '../types';
import type { UserRole } from '@/types/auth';
import { getErrorMessage } from '@/lib/api/apiError';

interface UpdateUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserResponse | null;
  onSuccess?: () => void;
}

export const UpdateUserRoleModal: React.FC<UpdateUserRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setBadgeNumber(user.badgeNumber || '');
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
      await adminService.updateUserRole(user.id, {
        role,
        badgeNumber:
          role === 'SECURITY_OFFICER' && badgeNumber.trim()
            ? badgeNumber.trim()
            : undefined,
        reason: reason.trim() || undefined,
      });

      setSuccessMessage(`User role successfully updated to ${role}.`);
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
          'Failed to update user role. Please verify permissions and constraints.'
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
      title="Change User Role"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger" title="Role Update Error">
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
            <span className="text-slate-500">Account Status:</span>
            <span className="font-medium text-slate-800">{user.status}</span>
          </div>
        </div>

        {user.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN' && (
          <Alert variant="warning" title="Super Admin Demotion Protection">
            Demoting the last active Super Admin account is prohibited by the backend.
            Confirm that another active Super Admin account is available before proceeding.
          </Alert>
        )}

        {role === 'SECURITY_OFFICER' && (
          <Alert variant="info" title="Security Officer Provisioning">
            Assigning the SECURITY_OFFICER role will automatically associate the user with
            the Central Security Office and establish an official officer profile.
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Role <span className="text-rose-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isPending}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600 disabled:bg-slate-100"
          >
            <option value="STUDENT">STUDENT (General User)</option>
            <option value="SECURITY_OFFICER">SECURITY_OFFICER (Desk Operations)</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN (System Governance)</option>
          </select>
        </div>

        {role === 'SECURITY_OFFICER' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Officer Badge Number (Optional)
            </label>
            <Input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. SEC-042"
              disabled={isPending}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Administrative Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            disabled={isPending}
            placeholder="e.g. Appointed Central Security Officer, administrative promotion..."
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
            Update Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};
