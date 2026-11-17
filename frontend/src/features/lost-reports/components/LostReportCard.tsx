import React from 'react';
import { MapPin, Building2, Eye, Edit3, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { LostReportResponse, LostReportStatus } from '../types';

export interface LostReportCardProps {
  report: LostReportResponse;
  onView: (report: LostReportResponse) => void;
  onEdit?: (report: LostReportResponse) => void;
  onResolve?: (report: LostReportResponse) => void;
  onCancel?: (report: LostReportResponse) => void;
}

export const LostReportCard: React.FC<LostReportCardProps> = ({
  report,
  onView,
  onEdit,
  onResolve,
  onCancel,
}) => {
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

  const formattedDate = (() => {
    try {
      return new Date(report.lostAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return report.lostAt;
    }
  })();

  const thumbnail = report.images && report.images.length > 0 ? report.images[0] : null;
  const isEditable = report.status === 'ACTIVE';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-campus-300 hover:shadow-md">
      <div>
        {/* Header Badges & Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {renderStatusBadge(report.status)}
            <Badge variant="outline" className="text-slate-600">
              {report.category?.name || 'Item'}
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {formattedDate}
          </span>
        </div>

        {/* Title and Thumbnail */}
        <div className="flex gap-4">
          <div className="flex-1">
            <h3
              onClick={() => onView(report)}
              className="cursor-pointer text-base font-semibold text-slate-900 transition-colors group-hover:text-campus-700 line-clamp-1"
            >
              {report.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {report.description}
            </p>
          </div>

          {thumbnail && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                src={thumbnail.publicUrl}
                alt={report.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {report.images.length > 1 && (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                  +{report.images.length - 1}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Distinctive Features Highlight */}
        {report.distinctiveFeatures && (
          <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50/60 p-2 text-xs text-amber-900 border border-amber-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="line-clamp-1 italic">
              Features: {report.distinctiveFeatures}
            </p>
          </div>
        )}

        {/* Meta Info */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {report.location?.name}
              {report.specificLocation && ` (${report.specificLocation})`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Office: {report.designatedSecurityOffice?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(report)}
          className="text-xs text-campus-700 hover:text-campus-800 p-0 h-auto"
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View Details
        </Button>

        {isEditable && (
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(report)}
                className="h-7 text-xs px-2"
                title="Edit Report"
              >
                <Edit3 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            {onResolve && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(report)}
                className="h-7 text-xs px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                title="Mark as Resolved"
              >
                <CheckCircle2 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Resolve</span>
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(report)}
                className="h-7 text-xs px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                title="Cancel Report"
              >
                <XCircle className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
