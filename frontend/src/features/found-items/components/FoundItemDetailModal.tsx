import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  ShieldCheck,
  PackageSearch,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Alert } from '@/components/ui/Alert';
import { useFoundItemDetails } from '../hooks/useFoundItemDetails';
import { resolveImageUrl } from '../services/foundItemService';
import type { ItemAvailabilityStatus } from '../types';

export interface FoundItemDetailModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditItem?: () => void;
}

export const FoundItemDetailModal: React.FC<FoundItemDetailModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onEditItem,
}) => {
  const { item, isLoading, error, isOwner } = useFoundItemDetails(itemId || undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  if (!isOpen) return null;

  const renderAvailabilityBadge = (status: ItemAvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Available in Security Custody</span>
          </Badge>
        );
      case 'UNAVAILABLE':
        return <Badge variant="warning">Unavailable / Pending Verification</Badge>;
      case 'CLAIM_PENDING':
        return <Badge variant="info">Claim Pending Review</Badge>;
      case 'COLLECTED':
      case 'RETURNED':
        return <Badge variant="default">Returned to Owner</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formattedFoundDate = item
    ? (() => {
        try {
          return new Date(item.foundAt).toLocaleString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return item.foundAt;
        }
      })()
    : '';

  const activeImage = item?.images && item.images.length > 0 ? item.images[selectedImageIndex] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item?.title || 'Found Item Details'}
      size="xl"
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingIndicator size="md" message="Loading item details..." />
        </div>
      ) : error ? (
        <Alert variant="danger">
          <p className="text-sm">{error}</p>
        </Alert>
      ) : item ? (
        <div className="space-y-6">
          {/* Top Badges & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {renderAvailabilityBadge(item.availabilityStatus)}
              <Badge variant="default">{item.categoryName}</Badge>
              {isOwner && (
                <Badge variant="info" size="sm">
                  Your Report
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-500">
              Ref: <code className="font-mono text-slate-700">{item.id.slice(0, 8)}</code>
            </span>
          </div>

          {/* Photo Gallery Carousel */}
          <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              {activeImage ? (
                <img
                  src={resolveImageUrl(activeImage.publicUrl)}
                  alt={item.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <PackageSearch className="h-14 w-14 stroke-[1.5]" />
                  <p className="mt-2 text-xs font-medium text-slate-500">No photos uploaded</p>
                </div>
              )}
            </div>

            {/* Thumbnail switcher */}
            {item.images && item.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {item.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-campus-700 ring-2 ring-campus-200'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img.publicUrl)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-campus-700" />
                Discovery Location
              </span>
              <p className="text-slate-900 font-medium pl-5.5">{item.locationName}</p>
              {item.specificLocation && (
                <p className="text-slate-600 pl-5.5 text-[11px]">{item.specificLocation}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-campus-700" />
                Found Timestamp
              </span>
              <p className="text-slate-900 font-medium pl-5.5">{formattedFoundDate}</p>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-campus-700" />
                Physical Custody Office
              </span>
              <p className="text-slate-900 font-medium pl-5.5">
                {item.designatedSecurityOfficeName}
              </p>
              {item.handoverConfirmedAt && (
                <p className="text-emerald-700 pl-5.5 text-[11px] flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Physically verified on {new Date(item.handoverConfirmedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </h4>
            <div className="rounded-lg bg-white border border-slate-200 p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {item.description}
            </div>
          </div>

          {/* Guidance Note: For Claimants / Public Visitors */}
          {!isOwner && item.availabilityStatus === 'AVAILABLE' && (
            <div className="rounded-lg border border-campus-200 bg-campus-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-campus-800 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-campus-950">How to Claim This Item</p>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    To claim this item, please visit the{' '}
                    <strong>{item.designatedSecurityOfficeName}</strong> or submit an online claim with
                    your Student ID card and proof of ownership. The duty officer will verify your identity
                    before releasing the item.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guidance Note: For Pending Owner */}
          {isOwner && item.handoverStatus === 'PENDING' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <p className="font-semibold">Handover Pending</p>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    This item is unconfirmed and hidden from the public catalog. Please hand it over to
                    the <strong>{item.designatedSecurityOfficeName}</strong> to verify physical custody and
                    earn your reputation points.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isOwner && item.handoverStatus === 'PENDING' && onEditItem ? (
              <Button variant="outline" size="sm" onClick={onEditItem}>
                Edit Report
              </Button>
            ) : (
              <div />
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
