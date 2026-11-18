import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Tag,
  Building2,
  Lock,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import {
  officerService,
  ResolveLostReportOfficerModal,
  CancelLostReportOfficerModal,
  LostReportAuditModal,
  type LostReportResponse,
} from '@/features/officer';
import { ROUTES } from '@/routes/paths';

export const OfficerLostReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();

  const [report, setReport] = useState<LostReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getLostReportById(reportId)
      .then((data) => {
        if (isMounted) setReport(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load lost report.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reportId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-20 flex justify-center">
          <LoadingIndicator size="lg" message="Loading private lost report..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !report) {
    return (
      <PageContainer>
        <Alert variant="danger" title="Lost Report Unavailable" className="mb-4">
          {error || 'Unable to access this lost report.'}
        </Alert>
        <Link to={ROUTES.OFFICER.LOST_REPORTS}>
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Lost Reports
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const isActive = report.status === 'ACTIVE';

  return (
    <PageContainer>
      {/* Back Breadcrumb */}
      <div className="mb-4">
        <Link
          to={ROUTES.OFFICER.LOST_REPORTS}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Private Lost Reports</span>
        </Link>
      </div>

      {/* Action Notification */}
      {actionSuccessMessage && (
        <Alert variant="success" title="Success" className="mb-6">
          {actionSuccessMessage}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{report.title}</h1>
            <Badge variant={isActive ? 'warning' : 'default'}>{report.status}</Badge>
            <Badge variant="outline">{report.category.name}</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">Report ID: {report.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAuditModal(true)}
            leftIcon={<History className="h-4 w-4" />}
          >
            Audit Trail
          </Button>

          {isActive && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowResolveModal(true)}
                leftIcon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              >
                Resolve
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                leftIcon={<XCircle className="h-4 w-4 text-rose-600" />}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Features, Images */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lost Item Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">General Description:</span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {report.description}
                </p>
              </div>

              {report.distinctiveFeatures && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Distinctive Identifiers / Secret Marks:
                  </span>
                  <p className="text-slate-800 bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-xs">
                    {report.distinctiveFeatures}
                  </p>
                </div>
              )}

              {/* Photos Gallery */}
              {report.images && report.images.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Attached Reference Photos ({report.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {report.images.map((img) => (
                      <div key={img.id} className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 h-40">
                        <img
                          src={img.publicUrl}
                          alt={img.originalFilename}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Officer Resolution Notes Card (if resolved) */}
          {report.resolutionNotes && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Resolution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-emerald-900 space-y-1">
                <p>"{report.resolutionNotes}"</p>
                {report.resolvedAt && (
                  <p className="text-[11px] text-emerald-700">
                    Resolved at {new Date(report.resolvedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Officer Cancellation Reason Card (if cancelled) */}
          {report.cancellationReason && (
            <Card className="border-rose-200 bg-rose-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-rose-950 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Cancellation Reason
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-rose-900 space-y-1">
                <p>"{report.cancellationReason}"</p>
                {report.cancelledAt && (
                  <p className="text-[11px] text-rose-700">
                    Cancelled at {new Date(report.cancelledAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Reporting Student Contact & Loss Context */}
        <div className="space-y-6">
          {/* Student Contact Info */}
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base">Reporting Student Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {report.studentContact ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-500 block">Full Name</span>
                      <span className="font-semibold text-slate-900">
                        {report.studentContact.fullName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <span className="text-xs text-slate-500 block">University Email</span>
                      <span className="text-slate-800">{report.studentContact.email}</span>
                    </div>
                  </div>

                  {report.studentContact.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="text-xs text-slate-500 block">Contact Phone</span>
                        <span className="text-slate-800">{report.studentContact.phoneNumber}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500">No contact info attached.</p>
              )}
            </CardContent>
          </Card>

          {/* Loss Circumstances */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Loss Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Tag className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Category</span>
                  <span className="font-medium text-slate-900">{report.category.name}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Presumed Location</span>
                  <span className="font-medium text-slate-900">{report.location.name}</span>
                  {report.specificLocation && (
                    <span className="text-slate-600 text-xs block">{report.specificLocation}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Date & Time Lost</span>
                  <span className="font-medium text-slate-900">
                    {new Date(report.lostAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Security Office Jurisdiction</span>
                  <span className="font-medium text-slate-900">
                    {report.designatedSecurityOffice.name}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Modal */}
      <ResolveLostReportOfficerModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        report={report}
        onConfirm={async (id, request) => {
          const updated = await officerService.resolveLostReport(id, request);
          setReport(updated);
          setActionSuccessMessage(`Report marked as RESOLVED.`);
        }}
      />

      {/* Cancel Modal */}
      <CancelLostReportOfficerModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        report={report}
        onConfirm={async (id, request) => {
          const updated = await officerService.cancelLostReport(id, request);
          setReport(updated);
          setActionSuccessMessage(`Report has been CANCELLED.`);
        }}
      />

      {/* Audit Modal */}
      <LostReportAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        reportId={report.id}
        reportTitle={report.title}
      />
    </PageContainer>
  );
};

export default OfficerLostReportDetailPage;
