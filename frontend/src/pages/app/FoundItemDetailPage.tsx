import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Building2, ShieldCheck, PackageSearch } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Card, CardContent } from '@/components/ui/Card';
import { useFoundItemDetails } from '@/features/found-items/hooks/useFoundItemDetails';
import { resolveImageUrl } from '@/features/found-items/services/foundItemService';
import { SubmitClaimModal } from '@/features/claims';
import { ROUTES } from '@/routes/paths';

export const FoundItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, isLoading, error, isOwner } = useFoundItemDetails(id);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number>(0);
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState<boolean>(false);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <LoadingIndicator size="lg" message="Loading found item..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !item) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-12">
          <Alert variant="danger">
            <p className="font-medium text-sm">Failed to load item</p>
            <p className="mt-1 text-xs">{error || 'Found item was not found or is not accessible.'}</p>
          </Alert>
          <div className="mt-4">
            <Link to={ROUTES.APP.FOUND_ITEMS}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Found Items
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const activeImage = item.images && item.images.length > 0 ? item.images[selectedImageIndex] : null;

  return (
    <PageContainer>
      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.APP.FOUND_ITEMS)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Found Items
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={item.availabilityStatus === 'AVAILABLE' ? 'success' : 'warning'}>
                    {item.availabilityStatus === 'AVAILABLE' ? 'Verified in Security Custody' : item.availabilityStatus}
                  </Badge>
                  <Badge variant="default">{item.categoryName}</Badge>
                  {isOwner && <Badge variant="info">Your Submission</Badge>}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{item.title}</h1>
              </div>
              <span className="text-xs text-slate-400">
                Item #{item.id.slice(0, 8)}
              </span>
            </div>

            {/* Photo Gallery */}
            <div className="space-y-3">
              <div className="aspect-video max-h-96 w-full rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {activeImage ? (
                  <img
                    src={resolveImageUrl(activeImage.publicUrl)}
                    alt={item.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-8">
                    <PackageSearch className="h-16 w-16 stroke-[1.5]" />
                    <p className="mt-2 text-xs font-medium text-slate-500">No photos uploaded</p>
                  </div>
                )}
              </div>

              {item.images && item.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? 'border-campus-700 ring-2 ring-campus-200' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img.publicUrl)}
                        alt={`Photo ${idx + 1}`}
                        className="h-16 w-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
              <div>
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-campus-700" /> Discovery Location
                </span>
                <p className="mt-1 text-slate-900 font-medium pl-5.5">{item.locationName}</p>
                {item.specificLocation && (
                  <p className="text-slate-600 pl-5.5 text-[11px]">{item.specificLocation}</p>
                )}
              </div>

              <div>
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-campus-700" /> Found Date
                </span>
                <p className="mt-1 text-slate-900 font-medium pl-5.5">
                  {new Date(item.foundAt).toLocaleString()}
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-campus-700" /> Designated Security Office
                </span>
                <p className="mt-1 text-slate-900 font-medium pl-5.5">
                  {item.designatedSecurityOfficeName}
                </p>
                {item.handoverConfirmedAt && (
                  <p className="text-emerald-700 pl-5.5 text-[11px] flex items-center gap-1 mt-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified by officer on {new Date(item.handoverConfirmedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Item Description
              </h3>
              <div className="rounded-lg bg-white border border-slate-200 p-4 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {item.description}
              </div>
            </div>

            {/* Guidance for Student Claimant */}
            {!isOwner && (
              <div className="rounded-lg border border-campus-200 bg-campus-50/70 p-4 text-xs text-slate-700">
                <h4 className="font-bold text-campus-950 mb-1">Claiming this property</h4>
                <p className="text-slate-600 leading-relaxed">
                  To claim this item, please submit an online ownership claim with your Student ID card and proof
                  of ownership, or visit the {item.designatedSecurityOfficeName}. Officers will verify your ownership
                  before releasing the property.
                </p>
                {item.availabilityStatus === 'AVAILABLE' && (
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsClaimModalOpen(true)}
                    >
                      Claim This Item
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {item && (
        <SubmitClaimModal
          itemId={item.id}
          itemTitle={item.title}
          securityOfficeName={item.designatedSecurityOfficeName}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          onSuccess={() => {
            setIsClaimModalOpen(false);
            navigate(ROUTES.APP.CLAIMS);
          }}
        />
      )}
    </PageContainer>
  );
};
export default FoundItemDetailPage;
