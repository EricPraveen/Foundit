import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import {
  officerService,
  ApproveClaimModal,
  RejectClaimModal,
  EvidenceViewerModal,
  CollectionDetailsModal,
  type ClaimResponse,
} from '@/features/officer';
import { ROUTES } from '@/routes/paths';

export const OfficerClaimDetailPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();

  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getClaimById(claimId)
      .then((data) => {
        if (isMounted) setClaim(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load claim details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [claimId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-20 flex justify-center">
          <LoadingIndicator size="lg" message="Loading claim details & evidence..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !claim) {
    return (
      <PageContainer>
        <Alert variant="danger" title="Claim Not Found" className="mb-4">
          {error || 'Unable to access the requested claim.'}
        </Alert>
        <Link to={ROUTES.OFFICER.CLAIMS}>
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Claims Review
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const isPending = claim.status === 'PENDING';
  const isApproved = claim.status === 'APPROVED';
  const isCompleted = claim.status === 'COMPLETED';

  return (
    <PageContainer>
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Link
          to={ROUTES.OFFICER.CLAIMS}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Claims Review Desk</span>
        </Link>
      </div>

      {actionSuccessMessage && (
        <Alert variant="success" title="Success" className="mb-6">
          {actionSuccessMessage}
        </Alert>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Claim for: {claim.foundItemTitle}
            </h1>
            <Badge variant={isPending ? 'warning' : isApproved ? 'info' : isCompleted ? 'success' : 'danger'}>
              {claim.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">Claim ID: {claim.id}</p>
        </div>

        <div className="flex items-center gap-2">
          {claim.evidence && claim.evidence.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEvidenceModal(true)}
              leftIcon={<Lock className="h-4 w-4 text-amber-600" />}
            >
              View Evidence ({claim.evidence.length})
            </Button>
          )}

          {isPending && (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowApproveModal(true)}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Approve Claim
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Reject Claim
              </Button>
            </>
          )}

          {isApproved && (
            <Link to={`/officer/collections/${claim.id}`}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<PackageCheck className="h-4 w-4" />}
              >
                Confirm Collection
              </Button>
            </Link>
          )}

          {isCompleted && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCollectionModal(true)}
              leftIcon={<PackageCheck className="h-4 w-4" />}
            >
              Collection Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Approved Notice Banner */}
      {isApproved && (
        <Alert variant="info" title="Approved Claim Awaiting Collection" className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>
              This claim has been approved. The item is reserved (<strong>CLAIM_PENDING</strong>). Please verify the student's physical ID card at the Central Security Office when they arrive to collect the item.
            </span>
            <Link to={`/officer/collections/${claim.id}`}>
              <Button size="sm" variant="primary">
                Proceed to Collection Handover
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ownership Description & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claimant's Ownership Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {claim.ownershipDescription}
              </p>
            </CardContent>
          </Card>

          {/* Evidence Files Card */}
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-base">Confidential Evidence Submitted</CardTitle>
                </div>
                <Badge variant="warning">Restricted Access</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">
                University Student ID card and proof documents are strictly confidential.
              </p>

              {claim.evidence && claim.evidence.length > 0 ? (
                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
                  {claim.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {ev.evidenceType}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {(ev.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {ev.originalFilename}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEvidenceModal(true)}
                        leftIcon={<Lock className="h-3.5 w-3.5" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No evidence attached.</p>
              )}
            </CardContent>
          </Card>

          {/* Rejection Details (if rejected) */}
          {claim.rejectionReason && (
            <Card className="border-rose-200 bg-rose-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-rose-950 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Official Rejection Justification
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-rose-900 space-y-1">
                <p>"{claim.rejectionReason}"</p>
                {claim.reviewingOfficerName && (
                  <p className="text-[11px] text-rose-700">
                    Reviewed by {claim.reviewingOfficerName} on {new Date(claim.updatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Notes (if approved) */}
          {claim.reviewNotes && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Officer Review Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-emerald-900 space-y-1">
                <p>"{claim.reviewNotes}"</p>
                {claim.reviewingOfficerName && (
                  <p className="text-[11px] text-emerald-700">
                    Approved by {claim.reviewingOfficerName} on {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Claimant Identity & Office Jurisdiction */}
        <div className="space-y-6">
          {/* Claimant Information */}
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-700" />
                <CardTitle className="text-base">Claimant Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Full Name</span>
                <span className="font-semibold text-slate-900">{claim.claimant.fullName}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">University Index Number</span>
                <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs inline-block">
                  {claim.claimant.indexNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Email Address</span>
                  <span className="text-slate-800">{claim.claimant.email}</span>
                </div>
              </div>

              {claim.claimant.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-xs text-slate-500 block">Contact Phone</span>
                    <span className="text-slate-800">{claim.claimant.phoneNumber}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Item & Office Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Found Item Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Item Name</span>
                <Link
                  to={`/officer/handovers/${claim.foundItemId}`}
                  className="font-medium text-campus-900 hover:underline block"
                >
                  {claim.foundItemTitle}
                </Link>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Designated Security Office</span>
                  <span className="font-medium text-slate-900">
                    {claim.designatedSecurityOfficeName}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Claim Submitted</span>
                  <span className="font-medium text-slate-900">
                    {new Date(claim.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Claim Modal */}
      <ApproveClaimModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        claim={claim}
        onConfirm={async (claimId, request) => {
          const updated = await officerService.approveClaim(claimId, request);
          setClaim(updated);
          setActionSuccessMessage(`Claim approved successfully. Item marked CLAIM_PENDING.`);
        }}
      />

      {/* Reject Claim Modal */}
      <RejectClaimModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        claim={claim}
        onConfirm={async (claimId, request) => {
          const updated = await officerService.rejectClaim(claimId, request);
          setClaim(updated);
          setActionSuccessMessage(`Claim has been rejected.`);
        }}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        claimId={claim.id}
        evidenceList={claim.evidence || []}
      />

      {/* Collection Details Modal */}
      <CollectionDetailsModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        claimId={claim.id}
        title={`Collection Receipt for: ${claim.foundItemTitle}`}
      />
    </PageContainer>
  );
};

export default OfficerClaimDetailPage;
