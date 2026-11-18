import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import { getErrorMessage } from '@/lib/api/apiError';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
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
    if (isOpen) {
      setName('');
      setCampusZone('');
      setDescription('');
      setActive(true);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Location name is required.');
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await adminService.createLocation({
        name: name.trim(),
        campusZone: campusZone.trim() || undefined,
        description: description.trim() || undefined,
        active,
      });

      setSuccessMessage(`Campus location "${name.trim()}" created successfully.`);
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
          'Failed to create location. Please ensure location name is unique.'
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
          setErrorMessage(null);
          setSuccessMessage(null);
          onClose();
        }
      }}
      title="Create Campus Location"
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
            placeholder="e.g. Main Library, Sumanadasa Building Ground Floor"
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
            placeholder="e.g. Academic Zone, North Campus, Sports Complex"
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
            placeholder="Helpful reference cues, nearby landmarks..."
            disabled={isPending}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600 disabled:bg-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="create-location-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-slate-300 text-campus-600 focus:ring-campus-500"
          />
          <label
            htmlFor="create-location-active"
            className="text-sm font-medium text-slate-700"
          >
            Mark location active immediately
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
            Create Location
          </Button>
        </div>
      </form>
    </Modal>
  );
};
