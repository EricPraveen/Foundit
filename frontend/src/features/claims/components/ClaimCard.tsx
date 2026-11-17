import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ClaimStatus, ClaimSummaryResponse } from '../types';

export interface ClaimCardProps {
  claim: ClaimSummaryResponse;
  onView: (claim: ClaimSummaryResponse) => void;
  onCancel?: (claim: ClaimSummaryResponse) => void;
  onResubmit?: (claim: ClaimSummaryResponse) => void;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  onView,
  onCancel,
  onResubmit,
}) => {
  const renderStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Under Review</span>
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="success" className="flex items-center gap-1 bg-emerald-600 text-white">
            <ShieldCheck className="h-3 w-3" />
            <span>Approved for Pickup</span>
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Claim Rejected</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-slate-500">
            <span>Cancelled</span>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Collected</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formattedSubmitted = (() => {
    try {
      return new Date(claim.submittedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return claim.submittedAt;
    }
  })();

  const isPending = claim.status === 'PENDING';
  const isRejected = claim.status === 'REJECTED';
  const isApproved = claim.status === 'APPROVED';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-campus-300 hover:shadow-md">
      <div>
        {/* Status Badge & Submission Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {renderStatusBadge(claim.status)}
          <span className="text-xs text-slate-400 font-mono">
            {formattedSubmitted}
          </span>
        </div>

        {/* Found Item Title */}
        <div className="mt-1">
          <h3
            onClick={() => onView(claim)}
            className="cursor-pointer text-base font-semibold text-slate-900 transition-colors group-hover:text-campus-700 line-clamp-1"
          >
            {claim.foundItemTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Claim Ref: <code className="font-mono text-slate-700">{claim.id.slice(0, 8)}</code>
          </p>
        </div>

        {/* Status Callout */}
        {isApproved && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900">
            <p className="font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Claim Approved
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-800">
              Please present your university student ID card at the designated security office to collect your item.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-900">
            <p className="font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              Evidence Insufficient
            </p>
            <p className="mt-0.5 text-[11px] text-rose-800">
              The reviewing officer could not verify ownership. You may submit a new claim with additional proof.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(claim)}
          className="text-xs text-campus-700 hover:text-campus-800 p-0 h-auto"
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View Details
        </Button>

        <div className="flex items-center gap-2">
          {isPending && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(claim)}
              className="h-7 text-xs px-2.5 text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Cancel Claim
            </Button>
          )}

          {isRejected && onResubmit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResubmit(claim)}
              className="h-7 text-xs px-2.5 text-campus-700 border-campus-200 hover:bg-campus-50"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Resubmit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
