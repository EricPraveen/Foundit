import React, { useRef, useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { resolveImageUrl, MAX_IMAGES_PER_ITEM } from '../services/foundItemService';
import type { FoundItemResponse, HandoverStatus, ItemAvailabilityStatus } from '../types';

export interface MyFoundReportCardProps {
  report: FoundItemResponse;
  onEdit?: (report: FoundItemResponse) => void;
  onCancel?: (id: string) => void;
  onUploadImage?: (id: string, file: File) => Promise<void>;
  onDeleteImage?: (id: string, imageId: string) => Promise<void>;
  onViewDetails?: (id: string) => void;
  isActionLoading?: boolean;
  className?: string;
}

export const MyFoundReportCard: React.FC<MyFoundReportCardProps> = ({
  report,
  onEdit,
  onCancel,
  onUploadImage,
  onDeleteImage,
  onViewDetails,
  isActionLoading = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  const isPending = report.handoverStatus === 'PENDING';
  const isConfirmed = report.handoverStatus === 'CONFIRMED';

  const renderHandoverBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending Handover</span>
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Handed Over & Verified</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
    }
  };

  const renderAvailabilityBadge = (status: ItemAvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Catalog Available</Badge>;
      case 'UNAVAILABLE':
        return <Badge variant="outline">Hidden from Public</Badge>;
      case 'CLAIM_PENDING':
        return <Badge variant="info">Claim Pending Review</Badge>;
      case 'COLLECTED':
      case 'RETURNED':
        return <Badge variant="default">Returned to Owner</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formattedDate = (() => {
    try {
      return new Date(report.foundAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return report.foundAt;
    }
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    setImageError(null);
    setIsUploading(true);
    try {
      await onUploadImage(report.id, file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo';
      setImageError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!onDeleteImage) return;
    setDeletingImageId(imageId);
    try {
      await onDeleteImage(report.id, imageId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete photo';
      setImageError(msg);
    } finally {
      setDeletingImageId(null);
    }
  };

  const imagesCount = report.images?.length || 0;
  const canUploadMore = isPending && imagesCount < MAX_IMAGES_PER_ITEM;

  return (
    <Card className={`border-slate-200 shadow-xs hover:border-slate-300 transition-colors ${className}`}>
      <CardContent className="p-5">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {renderHandoverBadge(report.handoverStatus)}
            {renderAvailabilityBadge(report.availabilityStatus)}
            <Badge variant="default" size="sm">
              {report.categoryName}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">
            Reported {new Date(report.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title & Description */}
        <div className="mt-3">
          <h3 className="text-base font-bold text-slate-900">{report.title}</h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {report.description}
          </p>
        </div>

        {/* Location & Metadata */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              <strong>Found at:</strong> {report.locationName}
              {report.specificLocation ? ` (${report.specificLocation})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              <strong>Found time:</strong> {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Building2 className="h-4 w-4 text-campus-700 shrink-0" />
            <span>
              <strong>Designated Custody Office:</strong> {report.designatedSecurityOfficeName}
            </span>
          </div>
        </div>

        {/* Handover Guidance Alert for Pending Items */}
        {isPending && (
          <div className="mt-3 rounded-md bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Next Step: Physical Handover Required</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  This report is currently unconfirmed and hidden from the public catalog. Please hand over
                  the item to an officer at the <strong>{report.designatedSecurityOfficeName}</strong>. Once
                  verified, it becomes available and your reputation points will be awarded.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Officer Verification Notes if Confirmed */}
        {isConfirmed && report.officerNotes && (
          <div className="mt-3 rounded-md bg-emerald-50/80 border border-emerald-200 p-3 text-xs text-emerald-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">
                  Verified by Officer {report.receivingOfficerName || ''}
                </p>
                <p className="mt-0.5 text-emerald-800 italic">"{report.officerNotes}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery & Upload Section */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700">
              Attached Photos ({imagesCount}/{MAX_IMAGES_PER_ITEM})
            </span>
            {canUploadMore && (
              <label className="cursor-pointer text-campus-800 hover:text-campus-950 font-medium inline-flex items-center gap-1">
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Add Photo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading || isActionLoading}
                />
              </label>
            )}
          </div>

          {imageError && (
            <Alert variant="danger" className="mb-2 text-xs py-1.5">
              {imageError}
            </Alert>
          )}

          {imagesCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.images.map((img) => (
                <div key={img.id} className="relative group/thumb rounded-md overflow-hidden border border-slate-200">
                  <img
                    src={resolveImageUrl(img.publicUrl)}
                    alt={img.originalFilename || 'Item photo'}
                    className="h-16 w-16 object-cover"
                  />
                  {isPending && onDeleteImage && (
                    <button
                      type="button"
                      aria-label="Delete image"
                      disabled={deletingImageId === img.id}
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity focus:opacity-100"
                    >
                      {deletingImageId === img.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-rose-300 hover:text-rose-100" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No photos attached yet.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(report.id)}
                leftIcon={<Eye className="h-3.5 w-3.5" />}
              >
                View
              </Button>
            )}

            {isPending && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(report)}
                disabled={isActionLoading}
                leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              >
                Edit
              </Button>
            )}
          </div>

          {isPending && onCancel && (
            <div>
              {showCancelConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-700 font-medium">Cancel this report?</span>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => {
                      onCancel(report.id);
                      setShowCancelConfirm(false);
                    }}
                  >
                    Yes, Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isActionLoading}
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Cancel Report
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
