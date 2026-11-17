import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useCategories } from '@/features/categories';
import { useLocations } from '@/features/locations';
import type { FoundItemResponse, UpdateFoundItemRequest } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface EditFoundItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FoundItemResponse | null;
  onSave: (id: string, request: UpdateFoundItemRequest) => Promise<FoundItemResponse>;
}

export const EditFoundItemModal: React.FC<EditFoundItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const { categories, isLoading: loadingCategories } = useCategories();
  const { locations, isLoading: loadingLocations } = useLocations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setCategoryId(item.categoryId);
      setLocationId(item.locationId);
      setSpecificLocation(item.specificLocation || '');
      setErrors({});
    }
  }, [item]);

  if (!item) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Title is required';
    } else if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      newErrors.title = 'Title must be between 3 and 200 characters';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'Description is required';
    } else if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      newErrors.description = 'Description must be between 5 and 2000 characters';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!locationId) {
      newErrors.locationId = 'Location is required';
    }

    if (specificLocation && specificLocation.length > 255) {
      newErrors.specificLocation = 'Specific location must not exceed 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const request: UpdateFoundItemRequest = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationId,
        specificLocation: specificLocation.trim() || undefined,
      };

      await onSave(item.id, request);
      onClose();
    } catch (err) {
      setErrors({ general: getErrorMessage(err, 'Failed to update item details.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Edit Found Report"
      description="Update report details prior to physical handover at the Central Security Office."
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <Alert variant="danger">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          </Alert>
        )}

        <div>
          <Input
            id="edit-found-item-title"
            label="Item Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-found-category" className="block text-sm font-medium text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              id="edit-found-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
              disabled={loadingCategories}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-found-location" className="block text-sm font-medium text-slate-700 mb-1.5">
              Campus Location *
            </label>
            <select
              id="edit-found-location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
              disabled={loadingLocations}
              required
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.campusZone ? `(${l.campusZone})` : ''}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.locationId}</p>
            )}
          </div>
        </div>

        <div>
          <Input
            id="edit-found-specific-location"
            label="Specific Location Details"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
            error={errors.specificLocation}
            helperText="Room, floor, or desk details"
          />
        </div>

        <div>
          <label htmlFor="edit-found-description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Description *
          </label>
          <textarea
            id="edit-found-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
            required
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
