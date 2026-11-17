import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Lock,
  FileText,
  Building2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  claimService,
  ALLOWED_EVIDENCE_TYPES,
  MAX_EVIDENCE_FILE_SIZE,
} from '../services/claimService';
import type { ClaimResponse, SubmitClaimPayload } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface SubmitClaimModalProps {
  itemId: string;
  itemTitle: string;
  securityOfficeName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (claim: ClaimResponse) => void;
}

export const SubmitClaimModal: React.FC<SubmitClaimModalProps> = ({
  itemId,
  itemTitle,
  securityOfficeName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const studentIdInputRef = useRef<HTMLInputElement>(null);
  const ownershipProofInputRef = useRef<HTMLInputElement>(null);
  const additionalProofInputRef = useRef<HTMLInputElement>(null);

  const [indexNumber, setIndexNumber] = useState('');
  const [ownershipDescription, setOwnershipDescription] = useState('');
  const [studentIdCardFile, setStudentIdCardFile] = useState<File | null>(null);
  const [ownershipProofFile, setOwnershipProofFile] = useState<File | null>(null);
  const [additionalProofFile, setAdditionalProofFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFile = (file: File | null, label: string): string | null => {
    if (!file) return `${label} is required`;
    if (!ALLOWED_EVIDENCE_TYPES.includes(file.type.toLowerCase())) {
      return `${label} must be JPEG, PNG, WebP, or PDF format`;
    }
    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      return `${label} must not exceed 5 MB`;
    }
    return null;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    field: string
  ) => {
    const file = e.target.files?.[0] || null;
    setter(file);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!indexNumber.trim()) {
      newErrors.indexNumber = 'University Index Number is required';
    }

    const trimmedDesc = ownershipDescription.trim();
    if (!trimmedDesc) {
      newErrors.ownershipDescription = 'Ownership description is required';
    } else if (trimmedDesc.length < 10) {
      newErrors.ownershipDescription = 'Please provide at least 10 characters describing why this item is yours';
    } else if (trimmedDesc.length > 2000) {
      newErrors.ownershipDescription = 'Ownership description must not exceed 2000 characters';
    }

    const studentIdError = validateFile(studentIdCardFile, 'Student ID Card');
    if (studentIdError) newErrors.studentIdCard = studentIdError;

    const proofError = validateFile(ownershipProofFile, 'Ownership Proof');
    if (proofError) newErrors.ownershipProof = proofError;

    if (additionalProofFile) {
      if (!ALLOWED_EVIDENCE_TYPES.includes(additionalProofFile.type.toLowerCase())) {
        newErrors.additionalProof = 'Additional proof must be JPEG, PNG, WebP, or PDF format';
      } else if (additionalProofFile.size > MAX_EVIDENCE_FILE_SIZE) {
        newErrors.additionalProof = 'Additional proof must not exceed 5 MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setIndexNumber('');
    setOwnershipDescription('');
    setStudentIdCardFile(null);
    setOwnershipProofFile(null);
    setAdditionalProofFile(null);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !studentIdCardFile || !ownershipProofFile) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: SubmitClaimPayload = {
        indexNumber: indexNumber.trim(),
        ownershipDescription: ownershipDescription.trim(),
        studentIdCard: studentIdCardFile,
        ownershipProof: ownershipProofFile,
        additionalProof: additionalProofFile || undefined,
      };

      const claim = await claimService.submitClaim(itemId, payload);
      onSuccess?.(claim);
      handleClose();
    } catch (err: unknown) {
      const msg = getErrorMessage(
        err,
        'Failed to submit claim. Please check your evidence files and try again.'
      );
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Claim Found Item"
      description={`Submit your proof of ownership for "${itemTitle}". Authorized Security Officers will review your evidence.`}
      size="lg"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {/* Security & Privacy Invariant Notice */}
        <div className="flex items-start gap-2.5 rounded-lg border border-campus-200 bg-campus-50/70 p-3.5 text-xs text-campus-900">
          <Lock className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Private Evidence Protection</p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              Your Student ID card, Index Number, and evidence documents are strictly confidential and encrypted in private storage.
              They are only accessible to authorized Security Officers reviewing this claim and are <strong>never exposed publicly</strong>.
            </p>
          </div>
        </div>

        {securityOfficeName && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
            <Building2 className="h-4 w-4 text-campus-700 shrink-0" />
            <span>
              Reviewing Office: <strong>{securityOfficeName}</strong>
            </span>
          </div>
        )}

        {errors.general && (
          <Alert variant="danger">
            <p className="text-xs">{errors.general}</p>
          </Alert>
        )}

        {/* Index Number */}
        <Input
          label="University Index Number *"
          name="indexNumber"
          placeholder="e.g. 210001A"
          value={indexNumber}
          onChange={(e) => {
            setIndexNumber(e.target.value);
            if (errors.indexNumber) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.indexNumber;
                return next;
              });
            }
          }}
          error={errors.indexNumber}
          helperText="Your academic index number as printed on your Student ID"
          required
        />

        {/* Ownership Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ownership Description & Distinctive Details *
          </label>
          <textarea
            rows={3}
            value={ownershipDescription}
            onChange={(e) => {
              setOwnershipDescription(e.target.value);
              if (errors.ownershipDescription) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.ownershipDescription;
                  return next;
                });
              }
            }}
            placeholder="Explain why this item belongs to you. Mention specific marks, serial numbers, wallpaper, stickers, scratches, or unique contents that only the owner would know..."
            maxLength={2000}
            className={`w-full rounded-lg border p-3 text-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
              errors.ownershipDescription
                ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          />
          <div className="flex justify-between items-center mt-1 text-[11px]">
            {errors.ownershipDescription ? (
              <span className="text-rose-600">{errors.ownershipDescription}</span>
            ) : (
              <span className="text-slate-500">Minimum 10 characters</span>
            )}
            <span className="text-slate-400 font-mono">{ownershipDescription.length}/2000</span>
          </div>
        </div>

        {/* Evidence File 1: Student ID Card */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            University Student ID Card * (Photo or PDF)
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={studentIdInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(e, setStudentIdCardFile, 'studentIdCard')}
              className="hidden"
              id="student-id-card-upload"
            />
            <label
              htmlFor="student-id-card-upload"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-campus-400 transition-colors"
            >
              <Upload className="h-4 w-4 text-slate-500" />
              <span>{studentIdCardFile ? 'Replace ID Card' : 'Choose Student ID Card'}</span>
            </label>
            {studentIdCardFile && (
              <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 border border-slate-200">
                <FileText className="h-3.5 w-3.5 text-campus-700 shrink-0" />
                <span className="truncate max-w-[180px]">{studentIdCardFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatFileSize(studentIdCardFile.size)})
                </span>
                <button
                  type="button"
                  onClick={() => setStudentIdCardFile(null)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {errors.studentIdCard && (
            <p className="text-[11px] text-rose-600">{errors.studentIdCard}</p>
          )}
          <p className="text-[11px] text-slate-500">
            Official university ID showing your photo, name, and index number (max 5 MB).
          </p>
        </div>

        {/* Evidence File 2: Ownership Proof */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Proof of Ownership * (Receipt, Invoice, Box Photo, Serial Number)
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={ownershipProofInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(e, setOwnershipProofFile, 'ownershipProof')}
              className="hidden"
              id="ownership-proof-upload"
            />
            <label
              htmlFor="ownership-proof-upload"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-campus-400 transition-colors"
            >
              <Upload className="h-4 w-4 text-slate-500" />
              <span>{ownershipProofFile ? 'Replace Proof' : 'Choose Ownership Proof'}</span>
            </label>
            {ownershipProofFile && (
              <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 border border-slate-200">
                <FileText className="h-3.5 w-3.5 text-campus-700 shrink-0" />
                <span className="truncate max-w-[180px]">{ownershipProofFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatFileSize(ownershipProofFile.size)})
                </span>
                <button
                  type="button"
                  onClick={() => setOwnershipProofFile(null)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {errors.ownershipProof && (
            <p className="text-[11px] text-rose-600">{errors.ownershipProof}</p>
          )}
          <p className="text-[11px] text-slate-500">
            Purchase invoice, receipt, previous photo of item, or warranty document (max 5 MB).
          </p>
        </div>

        {/* Evidence File 3: Additional Supporting Proof (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Additional Supporting Document (Optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={additionalProofInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(e, setAdditionalProofFile, 'additionalProof')}
              className="hidden"
              id="additional-proof-upload"
            />
            <label
              htmlFor="additional-proof-upload"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-campus-400 transition-colors"
            >
              <Upload className="h-4 w-4 text-slate-500" />
              <span>{additionalProofFile ? 'Replace File' : 'Choose Additional File'}</span>
            </label>
            {additionalProofFile && (
              <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 border border-slate-200">
                <FileText className="h-3.5 w-3.5 text-campus-700 shrink-0" />
                <span className="truncate max-w-[180px]">{additionalProofFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatFileSize(additionalProofFile.size)})
                </span>
                <button
                  type="button"
                  onClick={() => setAdditionalProofFile(null)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {errors.additionalProof && (
            <p className="text-[11px] text-rose-600">{errors.additionalProof}</p>
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
            disabled={isSubmitting}
          >
            Submit Ownership Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
};
