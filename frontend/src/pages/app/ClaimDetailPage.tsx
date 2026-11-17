import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  Lock,
  User,
  RotateCcw,
  FileText,
  Download,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/paths';
import {
  useClaimDetails,
  CancelClaimModal,
  SubmitClaimModal,
  type ClaimEvidenceResponse,
  type ClaimStatus,
  type EvidenceType,
} from '@/features/claims';

export const ClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { claim, isLoading, error, refetch, downloadEvidence, isDownloading } =
    useClaimDetails(id);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [downloadingEvidenceId, setDownloadingEvidenceId] = useState<string | null>(null);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <LoadingIndicator size="lg" message="Loading claim details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !claim) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Link
            to={ROUTES.APP.CLAIMS}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to My Claims
          </Link>
        </div>
        <EmptyState
          icon={<ShieldAlert className="h-10 w-10 text-rose-500" />}
          title="Claim Not Found or Access Restricted"
          description="This ownership claim does not exist or you do not have permission to access it. Claim evidence and claimant identity are protected against unauthorized enumeration."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.APP.CLAIMS)}
            >
              Return to My Claims
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const isPending = claim.status === 'PENDING';
  const isRejected = claim.status === 'REJECTED';

  return (
    <PageContainer>
      {/* Navigation Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={ROUTES.APP.CLAIMS}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Claims
        </Link>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelOpen(true)}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Cancel Claim
            </Button>
          )}

          {isRejected && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsResubmitOpen(true)}
              className="bg-campus-700 hover:bg-campus-800 text-white"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Resubmit Claim
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              {renderStatusBadge(claim.status)}
              <Badge variant="outline" className="flex items-center gap-1 text-campus-700 border-campus-200">
                <Lock className="h-3 w-3" />
                <span>Private Ownership Claim</span>
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Claim ID: <code className="font-mono text-slate-700">{claim.id}</code>
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {claim.foundItemTitle}
          </h1>

          {/* Status-specific Guidance */}
          {claim.status === 'PENDING' && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Review Pending by Security Office</p>
                  <p className="mt-1 text-amber-900 leading-relaxed">
                    Your claim is queued for review at{' '}
                    <strong>{claim.designatedSecurityOfficeName}</strong>. A Security Officer will inspect
                    the physical item against your description and uploaded evidence.
                  </p>
                </div>
              </div>
            </div>
          )}

          {claim.status === 'APPROVED' && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Ownership Confirmed — Ready for Collection</p>
                  <p className="mt-1 text-emerald-900 leading-relaxed">
                    Please visit the <strong>{claim.designatedSecurityOfficeName}</strong> during working hours.
                    Bring your physical University Student ID card to collect your item.
                  </p>
                  {claim.reviewNotes && (
                    <div className="mt-2.5 rounded-md bg-white/80 p-2.5 border border-emerald-200 text-slate-800">
                      <span className="font-medium">Officer Review Notes: </span>
                      {claim.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {claim.status === 'REJECTED' && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Claim Not Approved</p>
                  <p className="mt-1 text-rose-900 leading-relaxed">
                    The Security Officer was unable to verify ownership based on your current evidence.
                  </p>
                  {claim.rejectionReason && (
                    <div className="mt-2 rounded-md bg-white/80 p-2.5 border border-rose-200 text-rose-900">
                      <span className="font-medium">Rejection Reason: </span>
                      {claim.rejectionReason}
                    </div>
                  )}
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsResubmitOpen(true)}
                      className="bg-campus-700 hover:bg-campus-800 text-white"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Submit New Claim with Fresh Evidence
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {claim.status === 'COMPLETED' && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-950">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Collection Completed</p>
                  <p className="mt-1 text-blue-900 leading-relaxed">
                    Physical handover was verified by the Security Officer and the item was returned to you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-campus-700" />
                Designated Security Office
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
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ownership Description
            </h3>
            <div className="rounded-lg bg-white border border-slate-200 p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {claim.ownershipDescription}
            </div>
          </div>

          {/* Evidence Documents */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Confidential Evidence Files ({claim.evidence?.length || 0})
            </h3>

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
                        <p className="text-[11px] text-slate-500">
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
                <p className="text-xs text-slate-400 italic">No evidence uploaded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelClaimModal
        claim={claim}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Resubmit Modal */}
      <SubmitClaimModal
        itemId={claim.foundItemId}
        itemTitle={claim.foundItemTitle}
        securityOfficeName={claim.designatedSecurityOfficeName}
        isOpen={isResubmitOpen}
        onClose={() => setIsResubmitOpen(false)}
        onSuccess={() => {
          setIsResubmitOpen(false);
          navigate(ROUTES.APP.CLAIMS);
        }}
      />
    </PageContainer>
  );
};

export default ClaimDetailPage;
