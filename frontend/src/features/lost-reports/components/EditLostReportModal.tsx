import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useCategories } from '@/features/categories';
import { useLocations } from '@/features/locations';
import {
  lostReportService,
  ALLOWED_LOST_REPORT_IMAGE_TYPES,
  MAX_LOST_REPORT_IMAGE_SIZE,
  MAX_IMAGES_PER_LOST_REPORT,
} from '../services/lostReportService';
import type { LostReportResponse, UpdateLostReportRequest } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface EditLostReportModalProps {
  report: LostReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: LostReportResponse) => void;
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

export const EditLostReportModal: React.FC<EditLostReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories, isLoading: loadingCategories } = useCategories();
  const { locations, isLoading: loadingLocations } = useLocations();

  const getDatetimeString = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState<FormState>({
    title: report?.title || '',
    description: report?.description || '',
    distinctiveFeatures: report?.distinctiveFeatures || '',
    categoryId: report?.category?.id || '',
    locationId: report?.location?.id || '',
    specificLocation: report?.specificLocation || '',
    lostAt: getDatetimeString(report?.lostAt),
  });

  const [existingImages, setExistingImages] = useState(report?.images || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  React.useEffect(() => {
    if (report) {
      setFormData({
        title: report.title,
        description: report.description,
        distinctiveFeatures: report.distinctiveFeatures || '',
        categoryId: report.category?.id || '',
        locationId: report.location?.id || '',
        specificLocation: report.specificLocation || '',
        lostAt: getDatetimeString(report.lostAt),
      });
      setExistingImages(report.images || []);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setErrors({});
    }
  }, [report]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const totalImageCount = existingImages.length + selectedFiles.length;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    const validNewFiles: File[] = [];
    const newPreviews: string[] = [];
    let fileError: string | null = null;

    for (const file of files) {
      if (totalImageCount + validNewFiles.length >= MAX_IMAGES_PER_LOST_REPORT) {
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

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!report) return;
    setDeletingImageId(imageId);
    try {
      await lostReportService.deleteImage(report.id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        images: getErrorMessage(err, 'Failed to remove image.'),
      }));
    } finally {
      setDeletingImageId(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      newErrors.locationId = 'Please select a campus location';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !validate()) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateLostReportRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        distinctiveFeatures: formData.distinctiveFeatures.trim() || undefined,
        categoryId: formData.categoryId,
        locationId: formData.locationId,
        specificLocation: formData.specificLocation.trim() || undefined,
        lostAt: new Date(formData.lostAt).toISOString(),
      };

      const updated = await lostReportService.updateLostReport(report.id, payload);

      // Upload newly added photos if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await lostReportService.uploadImage(report.id, file);
          } catch (uploadErr) {
            console.error('Failed to attach photo to lost report:', uploadErr);
          }
        }
      }

      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: getErrorMessage(err, 'Failed to update lost report.'),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lost Report"
      description="Update report details while active. Changes will reflect for Security Officers."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <Alert variant="danger">
            <p className="text-xs">{errors.general}</p>
          </Alert>
        )}

        <Input
          label="Item Title *"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          maxLength={120}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              disabled={loadingCategories}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location *
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => handleInputChange('locationId', e.target.value)}
              disabled={loadingLocations}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Specific Location (Optional)"
            value={formData.specificLocation}
            onChange={(e) => handleInputChange('specificLocation', e.target.value)}
            maxLength={255}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Time Lost *
            </label>
            <input
              type="datetime-local"
              value={formData.lostAt}
              onChange={(e) => handleInputChange('lostAt', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Description *
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            maxLength={2000}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Distinctive Features (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.distinctiveFeatures}
            onChange={(e) => handleInputChange('distinctiveFeatures', e.target.value)}
            maxLength={1000}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </div>

        {/* Photos Management */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Attached Photos</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalImageCount}/{MAX_IMAGES_PER_LOST_REPORT}
            </span>
          </label>

          {/* Existing Photos */}
          {existingImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100"
                >
                  <img src={img.publicUrl} alt={img.originalFilename} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(img.id)}
                    disabled={deletingImageId === img.id}
                    className="absolute top-1 right-1 rounded-full bg-rose-600/90 p-1 text-white hover:bg-rose-700 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {previewUrls.map((url, index) => (
                <div
                  key={url}
                  className="relative group aspect-square rounded-lg border border-campus-300 overflow-hidden bg-slate-100"
                >
                  <img src={url} alt={`New Preview ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImageCount < MAX_IMAGES_PER_LOST_REPORT && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
                id="edit-lost-report-photos"
              />
              <label
                htmlFor="edit-lost-report-photos"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-600 hover:border-campus-400 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4 text-slate-400" />
                <span>Add more photos</span>
              </label>
            </div>
          )}

          {errors.images && (
            <p className="mt-1 text-[11px] text-rose-600">{errors.images}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
