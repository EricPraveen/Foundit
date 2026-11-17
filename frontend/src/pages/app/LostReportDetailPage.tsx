import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  PackageSearch,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/paths';
import {
  useLostReportDetails,
  EditLostReportModal,
  ResolveLostReportModal,
  CancelLostReportModal,
  type LostReportStatus,
  type LostReportImageResponse,
} from '@/features/lost-reports';

export const LostReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { report, isLoading, error, refetch } = useLostReportDetails(id);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

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

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <LoadingIndicator size="lg" message="Loading lost report..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !report) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Link
            to={ROUTES.APP.LOST_REPORTS}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to My Lost Reports
          </Link>
        </div>
        <EmptyState
          icon={<ShieldAlert className="h-10 w-10 text-rose-500" />}
          title="Report Not Found or Access Restricted"
          description="This private lost report does not exist or you do not have permission to view it. To protect student privacy, lost reports are strictly restricted to their original submitters."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.APP.LOST_REPORTS)}
            >
              Return to My Lost Reports
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const isEditable = report.status === 'ACTIVE';
  const activeImage = report.images && report.images.length > 0 ? report.images[selectedImageIndex] : null;

  return (
    <PageContainer>
      {/* Navigation Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={ROUTES.APP.LOST_REPORTS}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Lost Reports
        </Link>

        {isEditable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResolveOpen(true)}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark Resolved
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelOpen(true)}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Cancel Report
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Title & Metadata Strip */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {renderStatusBadge(report.status)}
              <Badge variant="default">{report.category?.name}</Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-campus-700 border-campus-200">
                <Lock className="h-3 w-3" />
                <span>Private to Owner & Officers</span>
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Report Ref: <code className="font-mono text-slate-700">{report.id}</code>
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {report.title}
          </h1>

          {/* Photo Gallery */}
          <div className="mt-6">
            <div className="relative aspect-video max-h-96 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
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

            {report.images && report.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {report.images.map((img: LostReportImageResponse, idx: number) => (
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
                      className="h-16 w-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-campus-700" />
                Lost Location
              </span>
              <p className="text-slate-900 font-medium pl-5.5">{report.location?.name}</p>
              {report.specificLocation && (
                <p className="text-slate-600 pl-5.5 text-[11px]">{report.specificLocation}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-campus-700" />
                Time When Lost
              </span>
              <p className="text-slate-900 font-medium pl-5.5">
                {new Date(report.lostAt).toLocaleString()}
              </p>
              <p className="text-slate-500 pl-5.5 text-[11px]">
                Reported: {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-campus-700" />
                Designated Security Office
              </span>
              <p className="text-slate-900 font-medium pl-5.5">
                {report.designatedSecurityOffice?.name}
              </p>
              {report.designatedSecurityOffice?.contactPhone && (
                <p className="text-slate-500 pl-5.5 text-[11px]">
                  Contact: {report.designatedSecurityOffice.contactPhone}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Item Description
            </h3>
            <div className="rounded-lg bg-white border border-slate-200 p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {report.description}
            </div>
          </div>

          {/* Distinctive Features */}
          {report.distinctiveFeatures && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Distinctive Features / Confidential Proof
              </h3>
              <div className="rounded-lg bg-amber-50/50 border border-amber-200 p-4 text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                {report.distinctiveFeatures}
              </div>
            </div>
          )}

          {/* Status Resolutions */}
          {report.status === 'RESOLVED' && (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Report Resolved</span>
              </div>
              {report.resolvedAt && (
                <p className="text-emerald-700 text-[11px]">
                  Resolved on {new Date(report.resolvedAt).toLocaleString()}
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
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50/60 p-4 text-xs">
              <div className="flex items-center gap-2 text-rose-800 font-semibold mb-1">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Report Cancelled / Withdrawn</span>
              </div>
              {report.cancelledAt && (
                <p className="text-rose-700 text-[11px]">
                  Cancelled on {new Date(report.cancelledAt).toLocaleString()}
                </p>
              )}
              {report.cancellationReason && (
                <p className="mt-2 text-slate-700 bg-white/70 p-2.5 rounded-md border border-rose-100">
                  Reason: {report.cancellationReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditLostReportModal
        report={report}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => refetch()}
      />

      <ResolveLostReportModal
        report={report}
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onSuccess={() => refetch()}
      />

      <CancelLostReportModal
        report={report}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  );
};

export default LostReportDetailPage;
