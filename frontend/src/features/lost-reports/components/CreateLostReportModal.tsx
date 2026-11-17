import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Building2,
  Sparkles,
  Lock,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useCategories } from '@/features/categories';
import { useLocations } from '@/features/locations';
import { useSecurityOffice } from '@/features/found-items/hooks/useSecurityOffice';
import {
  lostReportService,
  ALLOWED_LOST_REPORT_IMAGE_TYPES,
  MAX_LOST_REPORT_IMAGE_SIZE,
  MAX_IMAGES_PER_LOST_REPORT,
} from '../services/lostReportService';
import type { CreateLostReportRequest, LostReportResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface CreateLostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (report: LostReportResponse) => void;
}

interface FormState {
  title: string;
  description: string;
  distinctiveFeatures: string;
  categoryId: string;
  locationId: string;
  specificLocation: string;
  lostAt: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  distinctiveFeatures?: string;
  categoryId?: string;
  locationId?: string;
  specificLocation?: string;
  lostAt?: string;
  images?: string;
  general?: string;
}

export const CreateLostReportModal: React.FC<CreateLostReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories, isLoading: loadingCategories } = useCategories();
  const { locations, isLoading: loadingLocations } = useLocations();
  const { office, isLoading: loadingOffice } = useSecurityOffice();

  // Format local current datetime for input
  const getNowLocalString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const initialFormState: FormState = {
    title: '',
    description: '',
    distinctiveFeatures: '',
    categoryId: '',
    locationId: '',
    specificLocation: '',
    lostAt: getNowLocalString(),
  };

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      if (selectedFiles.length + validNewFiles.length >= MAX_IMAGES_PER_LOST_REPORT) {
        fileError = `You can attach at most ${MAX_IMAGES_PER_LOST_REPORT} photos.`;
        break;
      }

      if (!ALLOWED_LOST_REPORT_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        fileError = `File "${file.name}" is not supported. Allowed formats: JPEG, PNG, WebP.`;
        continue;
      }

      if (file.size > MAX_LOST_REPORT_IMAGE_SIZE) {
        fileError = `File "${file.name}" exceeds the 5 MB limit.`;
        continue;
      }

      validNewFiles.push(file);
      const objUrl = typeof window !== 'undefined' && window.URL?.createObjectURL ? window.URL.createObjectURL(file) : '';
      newPreviews.push(objUrl);
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
    if (typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
      window.URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Title is required';
    } else if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      newErrors.title = 'Title must be between 3 and 120 characters';
    }

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'Description is required';
    } else if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      newErrors.description = 'Description must be between 5 and 2000 characters';
    }

    if (formData.distinctiveFeatures && formData.distinctiveFeatures.trim().length > 1000) {
      newErrors.distinctiveFeatures = 'Distinctive features must not exceed 1000 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Please select a campus location where item was lost';
    }

    if (formData.specificLocation && formData.specificLocation.length > 255) {
      newErrors.specificLocation = 'Specific location must not exceed 255 characters';
    }

    if (!formData.lostAt) {
      newErrors.lostAt = 'Date and time when lost is required';
    } else {
      const lostDate = new Date(formData.lostAt);
      if (isNaN(lostDate.getTime())) {
        newErrors.lostAt = 'Please enter a valid date and time';
      } else if (lostDate.getTime() > Date.now() + 60000) {
        newErrors.lostAt = 'Date when lost cannot be in the future';
      }
    }

    if (!office && !loadingOffice) {
      newErrors.general = 'Designated security office is unavailable. Please try again later.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialFormState);
    previewUrls.forEach((url) => {
      if (typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
        window.URL.revokeObjectURL(url);
      }
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !office) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: CreateLostReportRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        distinctiveFeatures: formData.distinctiveFeatures.trim() || undefined,
        categoryId: formData.categoryId,
        locationId: formData.locationId,
        specificLocation: formData.specificLocation.trim() || undefined,
        lostAt: new Date(formData.lostAt).toISOString(),
        designatedSecurityOfficeId: office.id,
      };

      const createdReport = await lostReportService.createLostReport(payload);

      // Upload photos if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await lostReportService.uploadImage(createdReport.id, file);
          } catch (uploadErr) {
            console.error('Failed to attach photo to lost report:', uploadErr);
          }
        }
      }

      onSuccess?.(createdReport);
      handleClose();
    } catch (err) {
      setErrors({
        general: getErrorMessage(err, 'Failed to submit lost report. Please check the form and try again.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report a Lost Item"
      description="Create a private lost report. Authorized Security Officers cross-reference reported items when found items are handed over."
      size="lg"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {/* Privacy Invariant Banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-campus-200 bg-campus-50/70 p-3.5 text-xs text-campus-900">
          <Lock className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Private & Confidential</p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              Your lost report is visible <strong>only to you and verified Security Officers</strong>.
              It is never shown in public listings or search results.
            </p>
          </div>
        </div>

        {errors.general && (
          <Alert variant="danger">
            <p className="text-xs">{errors.general}</p>
          </Alert>
        )}

        {/* Title */}
        <Input
          label="Item Title *"
          name="title"
          placeholder="e.g. Blue Dell XPS 15 Laptop in black sleeve"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          helperText="3 to 120 characters"
          maxLength={120}
          required
        />

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lost-report-category" className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              id="lost-report-category"
              aria-label="Category *"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              disabled={loadingCategories}
              className={`w-full rounded-lg border px-3 py-2 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                errors.categoryId
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">
                {loadingCategories ? 'Loading categories...' : 'Select a category'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-[11px] text-rose-600">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <label htmlFor="lost-report-location" className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Location (where lost) *
            </label>
            <select
              id="lost-report-location"
              aria-label="Campus Location (where lost) *"
              value={formData.locationId}
              onChange={(e) => handleInputChange('locationId', e.target.value)}
              disabled={loadingLocations}
              className={`w-full rounded-lg border px-3 py-2 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                errors.locationId
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">
                {loadingLocations ? 'Loading locations...' : 'Select campus location'}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-1 text-[11px] text-rose-600">{errors.locationId}</p>
            )}
          </div>
        </div>

        {/* Specific Location & Approximate Lost Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Specific Location (Optional)"
            name="specificLocation"
            placeholder="e.g. 2nd floor silent study room, table 4"
            value={formData.specificLocation}
            onChange={(e) => handleInputChange('specificLocation', e.target.value)}
            error={errors.specificLocation}
            helperText="Desk, room, bench, or landmark"
            maxLength={255}
          />

          <div>
            <label htmlFor="lost-report-lost-at" className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Time Lost *
            </label>
            <input
              id="lost-report-lost-at"
              aria-label="Estimated Time Lost *"
              type="datetime-local"
              value={formData.lostAt}
              onChange={(e) => handleInputChange('lostAt', e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                errors.lostAt
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            />
            {errors.lostAt ? (
              <p className="mt-1 text-[11px] text-rose-600">{errors.lostAt}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">Must be past or present</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Description *
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what the item looks like, brand, color, case, or condition..."
            maxLength={2000}
            className={`w-full rounded-lg border p-3 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
              errors.description
                ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          />
          <div className="flex justify-between items-center mt-1 text-[11px]">
            {errors.description ? (
              <span className="text-rose-600">{errors.description}</span>
            ) : (
              <span className="text-slate-500">5 to 2000 characters</span>
            )}
            <span className="text-slate-400 font-mono">{formData.description.length}/2000</span>
          </div>
        </div>

        {/* Distinctive Features */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Distinctive Features / Confidential Proof (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.distinctiveFeatures}
            onChange={(e) => handleInputChange('distinctiveFeatures', e.target.value)}
            placeholder="e.g. Scratch near apple logo, sticker of GitHub on bottom, unique keychain with initials..."
            maxLength={1000}
            className={`w-full rounded-lg border p-3 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
              errors.distinctiveFeatures
                ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          />
          <div className="flex justify-between items-center mt-1 text-[11px]">
            {errors.distinctiveFeatures ? (
              <span className="text-rose-600">{errors.distinctiveFeatures}</span>
            ) : (
              <span className="text-slate-500">Details only the owner would know (max 1000 characters)</span>
            )}
            <span className="text-slate-400 font-mono">{formData.distinctiveFeatures.length}/1000</span>
          </div>
        </div>

        {/* Security Office Binding */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Building2 className="h-4 w-4 text-campus-700" />
            <span>Assigned Security Office</span>
          </div>
          <p className="mt-1 text-slate-900 font-semibold pl-6">
            {office ? office.name : loadingOffice ? 'Locating central security desk...' : 'Security Office'}
          </p>
          {office?.contactPhone && (
            <p className="text-[11px] text-slate-500 pl-6 mt-0.5">
              Contact: {office.contactPhone}
            </p>
          )}
        </div>

        {/* Photo Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
              Attach Photos (Optional)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {selectedFiles.length}/{MAX_IMAGES_PER_LOST_REPORT} photos
            </span>
          </div>

          {/* Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {previewUrls.map((url, index) => (
                <div
                  key={url}
                  className="relative group aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100"
                >
                  <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length < MAX_IMAGES_PER_LOST_REPORT && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
                id="lost-report-photos"
              />
              <label
                htmlFor="lost-report-photos"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center transition-colors hover:border-campus-400 hover:bg-slate-50"
              >
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-700">
                  Click to select photos
                </span>
                <span className="mt-0.5 text-[11px] text-slate-400">
                  JPEG, PNG, or WebP up to 5 MB each (max {MAX_IMAGES_PER_LOST_REPORT})
                </span>
              </label>
            </div>
          )}

          {errors.images && (
            <p className="mt-1 text-[11px] text-rose-600">{errors.images}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || loadingOffice}
          >
            Submit Private Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
