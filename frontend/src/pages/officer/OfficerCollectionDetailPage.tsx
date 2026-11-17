import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  PackageCheck,
  User,
  Mail,
  Phone,
  CheckCircle2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import {
  officerService,
  type ClaimResponse,
  type CollectionConfirmationResponse,
} from '@/features/officer';
import { ROUTES } from '@/routes/paths';

export const OfficerCollectionDetailPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();

  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [collectionResult, setCollectionResult] = useState<CollectionConfirmationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [idVerified, setIdVerified] = useState(false);
  const [itemHandedOver, setItemHandedOver] = useState(false);
  const [officerNotes, setOfficerNotes] = useState('');
  const [linkedLostReportId, setLinkedLostReportId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getClaimById(claimId)
      .then((data) => {
        if (!isMounted) return;
        setClaim(data);
        if (data.status === 'COMPLETED') {
          // Fetch collection confirmation log
          officerService
            .getCollectionByClaimId(claimId)
            .then((col) => {
              if (isMounted) setCollectionResult(col);
            })
            .catch(() => {});
        }
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
          <LoadingIndicator size="lg" message="Loading collection details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !claim) {
    return (
      <PageContainer>
        <Alert variant="danger" title="Claim Not Found" className="mb-4">
          {error || 'Unable to load collection information.'}
        </Alert>
        <Link to={ROUTES.OFFICER.COLLECTIONS}>
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Pending Collections
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const isCompleted = claim.status === 'COMPLETED' || Boolean(collectionResult);
  const allVerified = idVerified && itemHandedOver;

  const handleConfirmCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allVerified) {
      setFormError('You must physically verify claimant Student ID and item handover.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await officerService.confirmCollection(claim.id, {
        officerNotes: officerNotes.trim() || undefined,
        linkedLostReportId: linkedLostReportId.trim() || undefined,
      });
      setCollectionResult(response);
      setClaim((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to confirm collection. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      {/* Back Link */}
      <div className="mb-4">
        <Link
          to={ROUTES.OFFICER.COLLECTIONS}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Pending Collections</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Physical Item Handover & Collection
            </h1>
            <Badge variant={isCompleted ? 'success' : 'info'}>
              {isCompleted ? 'COMPLETED' : 'PENDING COLLECTION'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Item: <span className="font-semibold text-slate-800">{claim.foundItemTitle}</span> &bull; Central Security Office Custody Safe
          </p>
        </div>
      </div>

      {/* Result Card if Collection Confirmed */}
      {collectionResult && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base text-emerald-950">
                  Item Physically Collected and Reunited
                </CardTitle>
              </div>
              <Badge variant="success">RETURNED</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-emerald-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-emerald-700 block">Claimant</span>
                <span className="font-semibold text-emerald-950">
                  {collectionResult.claimantName} ({collectionResult.claimantEmail})
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-700 block">Confirming Officer</span>
                <span className="font-semibold text-emerald-950">
                  {collectionResult.confirmingOfficerName}
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-700 block">Collection Timestamp</span>
                <span>{new Date(collectionResult.collectedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-emerald-700 block">Reputation Points Awarded</span>
                <span className="font-bold text-amber-700">+{collectionResult.pointsAwarded} points</span>
              </div>
            </div>

            {collectionResult.linkedLostReportId && (
              <div className="pt-2 border-t border-emerald-200">
                <span className="text-xs text-emerald-700 block">Linked Lost Report</span>
                <span className="font-mono text-xs">
                  {collectionResult.linkedLostReportId} (Status: {collectionResult.lostReportStatus})
                </span>
              </div>
            )}

            {collectionResult.officerNotes && (
              <div className="pt-2 border-t border-emerald-200 text-xs">
                <span className="font-semibold block">Officer Notes:</span>
                <p>"{collectionResult.officerNotes}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Handover Form / Verification Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {!isCompleted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">In-Person Verification & Handover</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfirmCollection} className="space-y-4">
                  {formError && (
                    <Alert variant="danger" title="Verification Incomplete">
                      {formError}
                    </Alert>
                  )}

                  {/* Physical Checklist */}
                  <div className="rounded-lg border border-campus-200 bg-campus-50/50 p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-campus-900">
                      Step-by-Step Security Protocol
                    </h4>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={idVerified}
                        onChange={(e) => setIdVerified(e.target.checked)}
                        className="sr-only"
                      />
                      {idVerified ? (
                        <CheckSquare className="h-5 w-5 text-campus-900 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className="text-sm text-slate-800">
                        <strong>1. Claimant ID Check:</strong> I have physically examined the student's <strong>University Student ID Card</strong> and verified that the Index Number matches <strong>{claim.claimant.indexNumber}</strong>.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itemHandedOver}
                        onChange={(e) => setItemHandedOver(e.target.checked)}
                        className="sr-only"
                      />
                      {itemHandedOver ? (
                        <CheckSquare className="h-5 w-5 text-campus-900 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className="text-sm text-slate-800">
                        <strong>2. Item Handover:</strong> The physical item has been taken out from the Central Security Office safe and handed to the verified student.
                      </span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="officerNotes" className="block text-sm font-medium text-slate-700 mb-1">
                      Officer Custody Notes (Optional)
                    </label>
                    <textarea
                      id="officerNotes"
                      rows={3}
                      maxLength={1000}
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="e.g. Student inspected item condition and signed Central Office logbook #102."
                      className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="linkedLostReportId" className="block text-sm font-medium text-slate-700 mb-1">
                      Claimant's Lost Report ID (Optional)
                    </label>
                    <input
                      id="linkedLostReportId"
                      type="text"
                      value={linkedLostReportId}
                      onChange={(e) => setLinkedLostReportId(e.target.value)}
                      placeholder="UUID of claimant's matching private lost report (if known)"
                      className="w-full rounded-md border border-slate-300 p-2.5 text-sm font-mono text-xs focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      If provided, the claimant's matching private lost report will automatically transition to RECOVERED.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!allVerified}
                      isLoading={isSubmitting}
                      leftIcon={<PackageCheck className="h-4 w-4" />}
                    >
                      Confirm Physical Handover & Mark RETURNED
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Alert variant="success" title="Custody Transfer Completed">
              The item has been physically collected and the claim is closed. No further officer action is required.
            </Alert>
          )}
        </div>

        {/* Right Column: Claimant and Item Summary */}
        <div className="space-y-6">
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-700" />
                <CardTitle className="text-base">Claimant Verification Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Full Name</span>
                <span className="font-semibold text-slate-900">{claim.claimant.fullName}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Expected University Index Number</span>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Found Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Item Title</span>
                <span className="font-semibold text-slate-900">{claim.foundItemTitle}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block">Designated Custody Office</span>
                <span className="font-medium text-slate-800">
                  {claim.designatedSecurityOfficeName}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default OfficerCollectionDetailPage;
