import React, { useState, useEffect } from 'react';
import { PackageCheck, Award, User, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { officerService } from '../services/officerService';
import type { CollectionConfirmationResponse } from '../types';

export interface CollectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId?: string | null;
  foundItemId?: string | null;
  title?: string;
}

export const CollectionDetailsModal: React.FC<CollectionDetailsModalProps> = ({
  isOpen,
  onClose,
  claimId,
  foundItemId,
  title,
}) => {
  const [collection, setCollection] = useState<CollectionConfirmationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || (!claimId && !foundItemId)) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const promise = claimId
      ? officerService.getCollectionByClaimId(claimId)
      : officerService.getCollectionByFoundItemId(foundItemId!);

    promise
      .then((data) => {
        if (isMounted) setCollection(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load collection confirmation details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, claimId, foundItemId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          <span>Physical Collection Confirmation Log</span>
        </div>
      }
      description={title || 'Verified collection receipt and chain-of-custody transfer.'}
      size="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingIndicator size="md" message="Loading collection details..." />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : !collection ? (
          <p className="text-sm text-slate-500">No collection record found.</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Collection Completed & Returned
                </span>
                <Badge variant="success">RETURNED</Badge>
              </div>
              <p className="text-xs text-emerald-800">
                Claim Status: <strong>{collection.claimStatus}</strong> &bull; Item: <strong>{collection.itemAvailabilityStatus}</strong>
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  Claimant:
                </span>
                <span className="font-medium text-slate-900">
                  {collection.claimantName} ({collection.claimantEmail})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  Confirming Officer:
                </span>
                <span className="font-medium text-slate-900">
                  {collection.confirmingOfficerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Collected At:
                </span>
                <span className="text-slate-800">
                  {new Date(collection.collectedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Reputation Awarded:
                </span>
                <span className="font-semibold text-amber-800">
                  +{collection.pointsAwarded} points
                </span>
              </div>
              {collection.linkedLostReportId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Linked Lost Report:</span>
                  <span className="font-mono text-xs text-slate-700">
                    {collection.linkedLostReportId} ({collection.lostReportStatus})
                  </span>
                </div>
              )}
            </div>

            {collection.officerNotes && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">Officer Notes:</span>
                <p>"{collection.officerNotes}"</p>
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono">
              Receipt ID: {collection.collectionId}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
