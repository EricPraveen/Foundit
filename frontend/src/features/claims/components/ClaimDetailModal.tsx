import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Building2,
  Lock,
  User,
  RotateCcw,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useClaimDetails } from '../hooks/useClaimDetails';
import type { ClaimEvidenceResponse, ClaimResponse, ClaimStatus, EvidenceType } from '../types';

export interface ClaimDetailModalProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelClaim?: (claim: ClaimResponse) => void;
  onResubmitClaim?: (claim: ClaimResponse) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onCancelClaim,
  onResubmitClaim,
}) => {
  const { claim, isLoading, error, downloadEvidence, isDownloading } = useClaimDetails(
    claimId || undefined
  );
  const [downloadingEvidenceId, setDownloadingEvidenceId] = useState<string | null>(null);

  if (!isOpen) return null;

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
            <span>Approved for Collection</span>
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="outline" className="text-slate-500">Cancelled</Badge>;
      case 'COMPLETED':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Collection Completed</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatEvidenceType = (type: EvidenceType) => {
    switch (type) {
      case 'STUDENT_ID_CARD':
        return 'Student ID Card';
      case 'OWNERSHIP_PROOF':
        return 'Proof of Ownership';
      case 'ADDITIONAL_PROOF':
        return 'Additional Supporting Document';
      default:
        return type;
    }
  };

  const handleDownload = async (evidenceId: string, filename: string) => {
    setDownloadingEvidenceId(evidenceId);
    try {
      await downloadEvidence(evidenceId, filename);
    } catch {
      // handled in hook
    } finally {
      setDownloadingEvidenceId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={claim?.foundItemTitle || 'Claim Details'}
      size="lg"
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingIndicator size="md" message="Loading claim details..." />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-semibold">Unable to load claim</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : claim ? (
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {renderStatusBadge(claim.status)}
              <Badge variant="outline" className="flex items-center gap-1 text-campus-700 border-campus-200">
                <Lock className="h-3 w-3" />
                <span>Private Ownership Claim</span>
              </Badge>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Ref: <code className="font-mono text-slate-700">{claim.id.slice(0, 8)}</code>
            </span>
          </div>

          {/* Status-specific Guidance Callout */}
          {claim.status === 'PENDING' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Review Pending</p>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    Your claim is currently being evaluated by the Security Office at{' '}
                    <strong>{claim.designatedSecurityOfficeName}</strong>. You will receive an update once an officer verifies your evidence against the item.
                  </p>
                </div>
              </div>
            </div>
          )}

          {claim.status === 'APPROVED' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Claim Approved for Physical Collection</p>
                  <p className="mt-1 text-emerald-900 leading-relaxed">
                    The Security Officer has reviewed and verified your ownership. Please visit the{' '}
                    <strong>{claim.designatedSecurityOfficeName}</strong> with your physical Student ID card to collect your item.
                  </p>
                  {claim.reviewNotes && (
                    <div className="mt-2.5 rounded-md bg-white/80 p-2.5 border border-emerald-200 text-slate-800">
                      <span className="font-medium">Officer Notes: </span>
                      {claim.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {claim.status === 'REJECTED' && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Claim Rejected</p>
                  <p className="mt-1 text-rose-900 leading-relaxed">
                    The reviewing officer was unable to verify ownership based on the submitted evidence.
                  </p>
                  {claim.rejectionReason && (
                    <div className="mt-2 rounded-md bg-white/80 p-2.5 border border-rose-200 text-rose-900">
                      <span className="font-medium">Reason for rejection: </span>
                      {claim.rejectionReason}
                    </div>
                  )}
                  {onResubmitClaim && (
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onClose();
                          onResubmitClaim(claim);
                        }}
                        className="bg-campus-700 hover:bg-campus-800 text-white"
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Submit New Claim with Updated Evidence
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {claim.status === 'COMPLETED' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Collection Completed</p>
                  <p className="mt-1 text-blue-900 leading-relaxed">
                    This item was successfully returned and collected from the Security Office.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Core Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-campus-700" />
                Custody Security Office
              </span>
              <p className="text-slate-900 font-medium pl-5.5">
                {claim.designatedSecurityOfficeName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="h-4 w-4 text-campus-700" />
                Claimant Index Number
              </span>
              <p className="text-slate-900 font-medium pl-5.5 font-mono">
                {claim.claimant?.indexNumber}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200 text-slate-500">
              <span>Submitted: {new Date(claim.submittedAt).toLocaleString()}</span>
              {claim.reviewedAt && (
                <span className="ml-4">Reviewed: {new Date(claim.reviewedAt).toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Ownership Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Ownership Description
            </h4>
            <div className="rounded-lg bg-white border border-slate-200 p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {claim.ownershipDescription}
            </div>
          </div>

          {/* Evidence Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Private Evidence Files ({claim.evidence?.length || 0})
              </h4>
            </div>

            <div className="space-y-2">
              {claim.evidence && claim.evidence.length > 0 ? (
                claim.evidence.map((ev: ClaimEvidenceResponse) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-md bg-campus-50 p-2 text-campus-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{formatEvidenceType(ev.evidenceType)}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-[320px]">
                          {ev.originalFilename} • {formatFileSize(ev.fileSize)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(ev.id, ev.originalFilename)}
                      isLoading={downloadingEvidenceId === ev.id}
                      disabled={isDownloading}
                      className="h-8 text-xs px-2.5"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No evidence records found.</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {claim.status === 'PENDING' && onCancelClaim && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCancelClaim(claim);
                  }}
                  className="text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  Withdraw Claim
                </Button>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
