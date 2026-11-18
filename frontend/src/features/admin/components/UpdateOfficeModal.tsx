import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import type { SecurityOfficeResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

interface UpdateOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: SecurityOfficeResponse | null;
  onSuccess?: () => void;
}

export const UpdateOfficeModal: React.FC<UpdateOfficeModalProps> = ({
  isOpen,
  onClose,
  office,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [operatingHours, setOperatingHours] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (office) {
      setName(office.name);
      setCampusLocation(office.campusLocation);
      setContactEmail(office.contactEmail || '');
      setContactPhone(office.contactPhone || '');
      setOperatingHours(office.operatingHours || '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [office, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !campusLocation.trim()) {
      setErrorMessage('Office name and campus location are required.');
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await adminService.updateCentralOffice({
        name: name.trim(),
        campusLocation: campusLocation.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        operatingHours: operatingHours.trim() || undefined,
      });

      setSuccessMessage('Central Security Office details updated successfully.');
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to update office details.'));
    } finally {
      setIsPending(false);
    }
  };

  if (!office) return null;

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
      title="Configure Central Security Office"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger" title="Update Failed">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Office Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Campus Physical Location <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={campusLocation}
            onChange={(e) => setCampusLocation(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Public Contact Email
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contact Phone Number
          </label>
          <Input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Operating Hours
          </label>
          <Input
            type="text"
            value={operatingHours}
            onChange={(e) => setOperatingHours(e.target.value)}
            placeholder="e.g. 24/7 (Desk staffed around the clock)"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
