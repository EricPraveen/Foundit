import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import { getErrorMessage } from '@/lib/api/apiError';

interface ProvisionOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProvisionOfficerModal: React.FC<ProvisionOfficerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setFullName('');
      setPassword('');
      setBadgeNumber('');
      setValidationError(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      setValidationError('Official officer university email is required.');
      return;
    }

    if (!trimmedEmail.endsWith('@uom.lk')) {
      setValidationError('Officer email must be a valid university address ending in @uom.lk.');
      return;
    }

    if (!trimmedName) {
      setValidationError('Officer full name is required.');
      return;
    }

    if (!password || password.length < 8) {
      setValidationError('Temporary password must be at least 8 characters long.');
      return;
    }

    setIsPending(true);

    try {
      const response = await adminService.provisionOfficer({
        email: trimmedEmail,
        fullName: trimmedName,
        password,
        badgeNumber: badgeNumber.trim() || undefined,
      });

      setSuccessMessage(
        `Security Officer ${response.fullName} (${response.email}) provisioned successfully.`
      );
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(
        getErrorMessage(
          err,
          'Failed to provision officer account. Please verify email uniqueness and format.'
        )
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) {
          setValidationError(null);
          setErrorMessage(null);
          setSuccessMessage(null);
          onClose();
        }
      }}
      title="Provision Security Officer Account"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <Alert variant="warning" title="Validation Error">
            {validationError}
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="danger" title="Provisioning Failed">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Officer Provisioned">
            {successMessage}
          </Alert>
        )}

        <Alert variant="info" title="Central Security Office Assignment">
          Provisioned officers are automatically assigned to the Central Security Office
          with email-verified status and granted desk access for handovers, claims review,
          and collections.
        </Alert>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            University Email (@uom.lk) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer.name@uom.lk"
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Officer Full Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Officer Suneth Perera"
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Temporary Password <span className="text-rose-500">*</span>
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={isPending}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Share this temporary password securely with the officer for first login.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Officer Badge Number (Optional)
          </label>
          <Input
            type="text"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            placeholder="e.g. SEC-019"
            disabled={isPending}
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
            Provision Officer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
