import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import type { LocationResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationResponse | null;
  onSuccess?: () => void;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [campusZone, setCampusZone] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (location) {
      setName(location.name);
      setCampusZone(location.campusZone || '');
      setDescription(location.description || '');
      setActive(location.active);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [location, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    if (!name.trim()) {
      setErrorMessage('Location name is required.');
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await adminService.updateLocation(location.id, {
        name: name.trim(),
        campusZone: campusZone.trim() || undefined,
        description: description.trim() || undefined,
        active,
      });

      setSuccessMessage(`Location "${name.trim()}" updated successfully.`);
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
          'Failed to update location. Please verify unique name constraints.'
        )
      );
    } finally {
      setIsPending(false);
    }
  };

  if (!location) return null;

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
      title="Edit Campus Location"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger" title="Error">
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
            Location Name <span className="text-rose-500">*</span>
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
            Campus Zone (Optional)
          </label>
          <Input
            type="text"
            value={campusZone}
            onChange={(e) => setCampusZone(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={isPending}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600 disabled:bg-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-location-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-slate-300 text-campus-600 focus:ring-campus-500"
          />
          <label
            htmlFor="edit-location-active"
            className="text-sm font-medium text-slate-700"
          >
            Location is active and available in forms
          </label>
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
