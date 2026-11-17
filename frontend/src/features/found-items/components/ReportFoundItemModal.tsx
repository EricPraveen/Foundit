import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Building2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useCategories } from '@/features/categories';
import { useLocations } from '@/features/locations';
import { useSecurityOffice } from '../hooks/useSecurityOffice';
import {
  foundItemService,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGES_PER_ITEM,
} from '../services/foundItemService';
import type { CreateFoundItemRequest, FoundItemResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface ReportFoundItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: FoundItemResponse) => void;
}

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  locationId: string;
  specificLocation: string;
  foundAt: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  locationId?: string;
  specificLocation?: string;
  foundAt?: string;
  images?: string;
  general?: string;
}

export const ReportFoundItemModal: React.FC<ReportFoundItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories, isLoading: loadingCategories } = useCategories();
  const { locations, isLoading: loadingLocations } = useLocations();
  const { office, isLoading: loadingOffice } = useSecurityOffice();

  // Initialize with current local time formatted for datetime-local input
  const getNowLocalString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const initialFormState: FormState = {
    title: '',
    description: '',
    categoryId: '',
    locationId: '',
    specificLocation: '',
    foundAt: getNowLocalString(),
  };

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccessItem, setSubmissionSuccessItem] = useState<FoundItemResponse | null>(null);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrors((prev) => ({ ...prev, images: undefined }));

    const validNewFiles: File[] = [];
    const newPreviews: string[] = [];
    let fileError: string | null = null;

    for (const file of files) {
      if (selectedFiles.length + validNewFiles.length >= MAX_IMAGES_PER_ITEM) {
        fileError = `You can attach at most ${MAX_IMAGES_PER_ITEM} photos.`;
        break;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        fileError = `File "${file.name}" is not supported. Allowed formats: JPEG, PNG, WebP.`;
        continue;
      }

      if (file.size > MAX_IMAGE_FILE_SIZE) {
        fileError = `File "${file.name}" exceeds the 5 MB limit.`;
        continue;
      }

      validNewFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (fileError) {
      setErrors((prev) => ({ ...prev, images: fileError! }));
    }

    if (validNewFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validNewFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Title is required';
    } else if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      newErrors.title = 'Title must be between 3 and 200 characters';
    }

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'Description is required';
    } else if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      newErrors.description = 'Description must be between 5 and 2000 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Please select a campus location';
    }

    if (formData.specificLocation && formData.specificLocation.length > 255) {
      newErrors.specificLocation = 'Specific location must not exceed 255 characters';
    }

    if (!formData.foundAt) {
      newErrors.foundAt = 'Date and time when found is required';
    } else {
      const foundDate = new Date(formData.foundAt);
      if (isNaN(foundDate.getTime())) {
        newErrors.foundAt = 'Please enter a valid date and time';
      } else if (foundDate.getTime() > Date.now() + 60000) {
        // Allow up to 1 minute clock drift
        newErrors.foundAt = 'Found date and time cannot be in the future';
      }
    }

    if (!office?.id) {
      newErrors.general = 'Designated Security Office is currently unavailable. Please reload.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate() || !office) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const request: CreateFoundItemRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        locationId: formData.locationId,
        specificLocation: formData.specificLocation.trim() || undefined,
        foundAt: new Date(formData.foundAt).toISOString(),
        designatedSecurityOfficeId: office.id,
      };

      // 1. Create Found Item Report
      const createdItem = await foundItemService.reportFoundItem(request);

      // 2. Upload any attached images
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await foundItemService.uploadImage(createdItem.id, file);
          } catch (uploadErr) {
            console.error('Failed to upload image during creation:', uploadErr);
          }
        }
      }

      setSubmissionSuccessItem(createdItem);
      if (onSuccess) {
        onSuccess(createdItem);
      }
    } catch (err) {
      setErrors({ general: getErrorMessage(err, 'Failed to submit found report. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    // Cleanup preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormData(initialFormState);
    setErrors({});
    setSubmissionSuccessItem(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={submissionSuccessItem ? 'Report Submitted Successfully' : 'Report a Found Item'}
      description={
        submissionSuccessItem
          ? 'Physical handover at Central Security Office is required to complete verification.'
          : 'Submit details of property found on campus. You must hand over the item to the Central Security Office to earn points and make it public.'
      }
      size="xl"
    >
      {submissionSuccessItem ? (
        <div className="space-y-5 py-2">
          {/* Success Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-emerald-950">
              Found Report Created: {submissionSuccessItem.title}
            </h3>
            <p className="mt-1 text-xs text-emerald-800">
              Current Status:{' '}
              <Badge variant="warning" size="sm" className="ml-1 font-semibold">
                PENDING HANDOVER
              </Badge>
            </p>
          </div>

          {/* Important Handover Next Steps */}
          <div className="rounded-xl border border-campus-200 bg-gradient-to-br from-campus-50/70 to-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-campus-950 mb-3">
              <Shield className="h-4 w-4 text-campus-800" />
              <span>Next Mandatory Step: Physical Handover</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
              <li>
                Visit the{' '}
                <strong className="text-slate-900">
                  {office?.name || submissionSuccessItem.designatedSecurityOfficeName}
                </strong>{' '}
                at{' '}
                <span className="font-semibold text-campus-900">
                  {office?.campusLocation || 'Administration Building'}
                </span>
                .
              </li>
              <li>
                Present the physical item to the duty Security Officer and quote report title{' '}
                <span className="font-semibold text-slate-900">"{submissionSuccessItem.title}"</span>.
              </li>
              <li>
                The officer will inspect the item and verify receipt in the system.
              </li>
              <li>
                Once verified, the item will immediately be published to the catalog as{' '}
                <strong className="text-emerald-700">AVAILABLE</strong>, and your reputation points will be awarded!
              </li>
            </ol>

            {office && (
              <div className="mt-4 pt-3 border-t border-campus-100 flex flex-wrap gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-campus-700" />
                  <span>Hours: {office.operatingHours || 'Mon-Fri 08:00 - 18:00'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-campus-700" />
                  <span>Location: {office.campusLocation}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button onClick={handleModalClose} size="md">
              Done & View My Reports
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.general && (
            <Alert variant="danger">
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            </Alert>
          )}

          {/* Central Security Office Custody Preview */}
          <div className="rounded-lg border border-campus-200 bg-campus-50/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-campus-900">
              <Building2 className="h-4 w-4 text-campus-700 shrink-0" />
              <span>Designated Custody Office:</span>
              <span className="font-bold text-campus-950">
                {loadingOffice ? 'Loading office...' : office?.name || 'Central Security Office'}
              </span>
            </div>
            {office && (
              <p className="mt-1 text-xs text-slate-600 pl-6">
                Desk location: <span className="font-medium text-slate-800">{office.campusLocation}</span>{' '}
                ({office.operatingHours || '08:00 - 18:00'})
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <Input
              id="found-item-title"
              label="Item Title / Name *"
              placeholder="e.g. Casio Scientific Calculator fx-991EX"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              helperText="Brief, descriptive title (3-200 characters)"
              required
            />
          </div>

          {/* Category & Location row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="found-item-category" className="block text-sm font-medium text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                id="found-item-category"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={`block w-full rounded-md border py-2 px-3 text-sm transition-colors bg-white ${
                  errors.categoryId
                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 text-slate-900 focus:border-campus-600 focus:ring-campus-600'
                }`}
                disabled={loadingCategories}
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.categoryId}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="found-item-location" className="block text-sm font-medium text-slate-700 mb-1.5">
                Campus Location Where Found *
              </label>
              <select
                id="found-item-location"
                value={formData.locationId}
                onChange={(e) => handleInputChange('locationId', e.target.value)}
                className={`block w-full rounded-md border py-2 px-3 text-sm transition-colors bg-white ${
                  errors.locationId
                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 text-slate-900 focus:border-campus-600 focus:ring-campus-600'
                }`}
                disabled={loadingLocations}
                required
              >
                <option value="">Select Campus Location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.campusZone ? `(${loc.campusZone})` : ''}
                  </option>
                ))}
              </select>
              {errors.locationId && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.locationId}</p>
              )}
            </div>
          </div>

          {/* Specific Location & Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                id="found-item-specific-location"
                label="Specific Location Details (Optional)"
                placeholder="e.g. 2nd Floor Discussion Room B, Desk 4"
                value={formData.specificLocation}
                onChange={(e) => handleInputChange('specificLocation', e.target.value)}
                error={errors.specificLocation}
                helperText="Room, floor, or bench details (max 255 chars)"
              />
            </div>

            <div>
              <label htmlFor="found-item-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                Date & Time Found *
              </label>
              <input
                type="datetime-local"
                id="found-item-date"
                value={formData.foundAt}
                onChange={(e) => handleInputChange('foundAt', e.target.value)}
                className={`block w-full rounded-md border py-2 px-3 text-sm transition-colors bg-white ${
                  errors.foundAt
                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 text-slate-900 focus:border-campus-600 focus:ring-campus-600'
                }`}
                required
              />
              {errors.foundAt ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.foundAt}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">Cannot be in the future</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="found-item-description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description *
            </label>
            <textarea
              id="found-item-description"
              rows={4}
              placeholder="Describe color, brand, condition, unique identifiers, accessories, or stickers..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`block w-full rounded-md border py-2 px-3 text-sm transition-colors bg-white ${
                errors.description
                  ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 text-slate-900 focus:border-campus-600 focus:ring-campus-600'
              }`}
              required
            />
            {errors.description ? (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.description}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">Between 5 and 2000 characters</p>
            )}
          </div>

          {/* Image Upload Dropzone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Item Photos (Optional, up to {MAX_IMAGES_PER_ITEM})
            </label>

            <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center hover:border-campus-600 transition-colors bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                id="found-item-images-input"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFilesSelected}
                disabled={selectedFiles.length >= MAX_IMAGES_PER_ITEM || isSubmitting}
              />
              <div className="flex flex-col items-center justify-center">
                <ImageIcon className="h-8 w-8 text-slate-400" />
                <p className="mt-2 text-xs font-medium text-slate-700">
                  Click to select photos or drag & drop
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  JPEG, PNG, or WebP up to 5 MB each. Max {MAX_IMAGES_PER_ITEM} photos.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= MAX_IMAGES_PER_ITEM || isSubmitting}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                >
                  Choose Images ({selectedFiles.length}/{MAX_IMAGES_PER_ITEM})
                </Button>
              </div>
            </div>

            {errors.images && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.images}</p>
            )}

            {/* Thumbnail Previews of Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative group rounded-md overflow-hidden border border-slate-300">
                    <img
                      src={previewUrls[idx]}
                      alt={file.name}
                      className="h-16 w-16 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      disabled={isSubmitting}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      aria-label={`Remove photo ${file.name}`}
                    >
                      <X className="h-4 w-4 text-rose-300 hover:text-rose-100" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white px-1 truncate text-center">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handover Policy Acknowledgement */}
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Submitting this report places it in <Badge variant="warning" size="sm">PENDING</Badge> status.
              To make it visible in the public catalog and receive reputation points, you must physically deliver
              the item to the <strong>{office?.name || 'Central Security Office'}</strong>.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={handleModalClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              leftIcon={<Shield className="h-4 w-4" />}
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Found Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
