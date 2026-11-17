import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  PackageSearch,
  Clock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { LostReportResponse, LostReportStatus } from '../types';

export interface LostReportDetailModalProps {
  report: LostReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (report: LostReportResponse) => void;
  onResolve?: (report: LostReportResponse) => void;
  onCancel?: (report: LostReportResponse) => void;
}

export const LostReportDetailModal: React.FC<LostReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEdit,
  onResolve,
  onCancel,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!isOpen || !report) return null;

  const renderStatusBadge = (status: LostReportStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="animate-pulse">
            Active Search
          </Badge>
        );
      case 'RESOLVED':
        return <Badge variant="default" className="bg-emerald-600 text-white">Resolved</Badge>;
      case 'RECOVERED':
        return <Badge variant="info">Recovered</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-slate-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formattedLostDate = (() => {
    try {
      return new Date(report.lostAt).toLocaleString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return report.lostAt;
    }
  })();

  const formattedCreatedDate = (() => {
    try {
      return new Date(report.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return report.createdAt;
    }
  })();

  const activeImage = report.images && report.images.length > 0 ? report.images[selectedImageIndex] : null;
  const isEditable = report.status === 'ACTIVE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={report.title}
      size="xl"
    >
      <div className="space-y-6">
        {/* Top Badges & Privacy indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {renderStatusBadge(report.status)}
            <Badge variant="default">{report.category?.name || 'Item'}</Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-campus-700 border-campus-200">
              <Lock className="h-3 w-3" />
              <span>Private to Owner & Officers</span>
            </Badge>
          </div>
          <span className="text-xs text-slate-500">
            Ref: <code className="font-mono text-slate-700">{report.id.slice(0, 8)}</code>
          </span>
        </div>

        {/* Photo Gallery Carousel */}
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage.publicUrl}
                alt={report.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <PackageSearch className="h-14 w-14 stroke-[1.5]" />
                <p className="mt-2 text-xs font-medium text-slate-500">No photos attached</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {report.images && report.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {report.images.map((img, idx) => (
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
                    src={img.publicUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-14 w-14 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Core Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-campus-700" />
              Estimated Location Lost
            </span>
            <p className="text-slate-900 font-medium pl-5.5">{report.location?.name}</p>
            {report.specificLocation && (
              <p className="text-slate-600 pl-5.5 text-[11px]">{report.specificLocation}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-campus-700" />
              Time Lost
            </span>
            <p className="text-slate-900 font-medium pl-5.5">{formattedLostDate}</p>
            <p className="text-slate-500 pl-5.5 text-[11px]">Reported: {formattedCreatedDate}</p>
          </div>

          <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-campus-700" />
              Assigned Security Office
            </span>
            <p className="text-slate-900 font-medium pl-5.5">
              {report.designatedSecurityOffice?.name}
            </p>
            {report.designatedSecurityOffice?.contactPhone && (
              <p className="text-slate-500 pl-5.5 text-[11px]">
                Phone: {report.designatedSecurityOffice.contactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            General Description
          </h4>
          <div className="rounded-lg bg-white border border-slate-200 p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {report.description}
          </div>
        </div>

        {/* Distinctive Features */}
        {report.distinctiveFeatures && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Distinctive Features / Confidential Proof
            </h4>
            <div className="rounded-lg bg-amber-50/50 border border-amber-200 p-4 text-xs text-amber-950 whitespace-pre-line leading-relaxed">
              {report.distinctiveFeatures}
            </div>
          </div>
        )}

        {/* Resolution or Cancellation Notes if applicable */}
        {report.status === 'RESOLVED' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Report Resolved</span>
            </div>
            {report.resolvedAt && (
              <p className="text-emerald-700 text-[11px]">
                Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
              </p>
            )}
            {report.resolutionNotes && (
              <p className="mt-2 text-slate-700 bg-white/70 p-2.5 rounded-md border border-emerald-100">
                Notes: {report.resolutionNotes}
              </p>
            )}
          </div>
        )}

        {report.status === 'CANCELLED' && (
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4 text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-semibold mb-1">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Report Cancelled / Withdrawn</span>
            </div>
            {report.cancelledAt && (
              <p className="text-rose-700 text-[11px]">
                Cancelled on {new Date(report.cancelledAt).toLocaleDateString()}
              </p>
            )}
            {report.cancellationReason && (
              <p className="mt-2 text-slate-700 bg-white/70 p-2.5 rounded-md border border-rose-100">
                Reason: {report.cancellationReason}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {isEditable && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(report);
                }}
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isEditable && onResolve && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onResolve(report);
                }}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Mark Resolved
              </Button>
            )}
            {isEditable && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onCancel(report);
                }}
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Cancel Report
              </Button>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
