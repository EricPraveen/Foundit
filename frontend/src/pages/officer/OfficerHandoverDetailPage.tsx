import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Tag,
  User,
  History,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import {
  officerService,
  ConfirmHandoverModal,
  HandoverHistoryModal,
  type FoundItemResponse,
} from '@/features/officer';
import { ROUTES } from '@/routes/paths';

export const OfficerHandoverDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();

  const [item, setItem] = useState<FoundItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getFoundItemById(itemId)
      .then((data) => {
        if (isMounted) setItem(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load found item details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const handleConfirmReceipt = async (id: string, request?: { officerNotes?: string }) => {
    const updated = await officerService.confirmHandover(id, request);
    setItem(updated);
    setSuccessMessage(`Physical receipt confirmed for "${updated.title}". Item status updated to AVAILABLE.`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-20 flex justify-center">
          <LoadingIndicator size="lg" message="Loading handover report..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !item) {
    return (
      <PageContainer>
        <Alert variant="danger" title="Item Not Found" className="mb-4">
          {error || 'Unable to load the requested item.'}
        </Alert>
        <Link to={ROUTES.OFFICER.HANDOVERS}>
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Pending Handovers
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const isPending = item.handoverStatus === 'PENDING';

  return (
    <PageContainer>
      {/* Navigation Breadcrumb */}
      <div className="mb-4">
        <Link
          to={ROUTES.OFFICER.HANDOVERS}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Pending Handovers</span>
        </Link>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <Alert variant="success" title="Success" className="mb-6">
          {successMessage}
        </Alert>
      )}

      {/* Main Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{item.title}</h1>
            <Badge variant={isPending ? 'warning' : 'success'}>
              {item.handoverStatus}
            </Badge>
            <Badge variant={item.availabilityStatus === 'AVAILABLE' ? 'success' : 'default'}>
              {item.availabilityStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">Item ID: {item.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            leftIcon={<History className="h-4 w-4" />}
          >
            Custody History
          </Button>
          {isPending && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Confirm Physical Handover
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Found Item Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>

              {/* Photos Gallery */}
              {item.images && item.images.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Item Photos ({item.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {item.images.map((img) => (
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

          {/* Business Rule Banner */}
          <Alert variant="info" title="Central Security Office Protocol">
            Items remain in <strong>PENDING_HANDOVER</strong> until the student physically hands over the item at the Central Security Office. Upon officer confirmation, the item is published as <strong>AVAILABLE</strong> in the catalog and finder reputation points are recorded.
          </Alert>
        </div>

        {/* Right Column: Custody and Finder Meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custody & Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Tag className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Category</span>
                  <span className="font-medium text-slate-900">{item.categoryName}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Location Found</span>
                  <span className="font-medium text-slate-900">{item.locationName}</span>
                  {item.specificLocation && (
                    <span className="text-slate-600 text-xs block">{item.specificLocation}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Found Date & Time</span>
                  <span className="font-medium text-slate-900">
                    {new Date(item.foundAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 text-xs block">Assigned Custody Office</span>
                  <span className="font-medium text-slate-900">
                    {item.designatedSecurityOfficeName}
                  </span>
                </div>
              </div>

              {item.finderName && (
                <div className="flex items-start gap-2.5 pt-3 border-t border-slate-100">
                  <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-xs block">Finder Details</span>
                    <span className="font-medium text-slate-900">{item.finderName}</span>
                  </div>
                </div>
              )}

              {item.receivingOfficerName && (
                <div className="flex items-start gap-2.5 pt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-xs block">Received By Officer</span>
                    <span className="font-medium text-slate-900">{item.receivingOfficerName}</span>
                    {item.handoverConfirmedAt && (
                      <span className="text-xs text-slate-500 block">
                        {new Date(item.handoverConfirmedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmHandoverModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        item={item}
        onConfirm={handleConfirmReceipt}
      />

      {/* History Modal */}
      <HandoverHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        itemId={item.id}
        itemTitle={item.title}
      />
    </PageContainer>
  );
};

export default OfficerHandoverDetailPage;
