import React, { useState, useEffect } from 'react';
import { FileText, Download, ShieldAlert, Eye, Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { officerService } from '../services/officerService';
import type { ClaimEvidenceResponse } from '../types';

export interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  evidenceList: ClaimEvidenceResponse[];
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  onClose,
  claimId,
  evidenceList,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewType, setActivePreviewType] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up any generated blob URLs when closing or unmounting
  useEffect(() => {
    return () => {
      if (activePreviewUrl) {
        URL.revokeObjectURL(activePreviewUrl);
      }
    };
  }, [activePreviewUrl]);

  const handleClose = () => {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      setActivePreviewUrl(null);
      setActivePreviewType(null);
      setActiveFilename(null);
    }
    setError(null);
    onClose();
  };

  const handleDownload = async (evidence: ClaimEvidenceResponse) => {
    setDownloadingId(evidence.id);
    setError(null);
    try {
      const blob = await officerService.downloadEvidence(claimId, evidence.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to download evidence file. Please verify officer authorization.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (evidence: ClaimEvidenceResponse) => {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      setActivePreviewUrl(null);
    }

    setDownloadingId(evidence.id);
    setError(null);
    try {
      const blob = await officerService.downloadEvidence(claimId, evidence.id);
      const url = URL.createObjectURL(blob);
      setActivePreviewUrl(url);
      setActivePreviewType(evidence.contentType);
      setActiveFilename(evidence.originalFilename);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load evidence preview.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getEvidenceTypeLabel = (type: string) => {
    switch (type) {
      case 'STUDENT_ID_CARD':
        return { label: 'University Student ID Card', variant: 'warning' as const };
      case 'OWNERSHIP_PROOF':
        return { label: 'Primary Ownership Proof', variant: 'info' as const };
      case 'ADDITIONAL_PROOF':
        return { label: 'Additional Supporting Proof', variant: 'default' as const };
      default:
        return { label: type, variant: 'outline' as const };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600" />
          <span>Confidential Ownership Evidence</span>
        </div>
      }
      description="Authorized Security Officer Inspection. All evidence is strictly protected under university data privacy policy."
      size="xl"
    >
      <div className="space-y-4">
        <Alert variant="warning" title="Strict Confidentiality Requirement">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Claim evidence contains sensitive university identity documents. These records must never be saved locally, shared, or exposed outside authorized officer review.
            </span>
          </div>
        </Alert>

        {error && (
          <Alert variant="danger" title="Evidence Access Error">
            {error}
          </Alert>
        )}

        {/* Evidence List */}
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {evidenceList.map((item) => {
            const typeInfo = getEvidenceTypeLabel(item.evidenceType);
            const isImage = item.contentType.startsWith('image/');
            const isPdf = item.contentType === 'application/pdf';
            const isDownloading = downloadingId === item.id;

            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatFileSize(item.fileSize)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {item.originalFilename}
                  </p>
                  <p className="text-xs text-slate-400">
                    Type: {item.contentType} &bull; Uploaded {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(isImage || isPdf) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(item)}
                      disabled={isDownloading}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Preview
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(item)}
                    isLoading={isDownloading}
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* In-Modal Preview Panel */}
        {activePreviewUrl && (
          <div className="mt-4 rounded-lg border border-slate-300 p-4 bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Preview: {activeFilename}
              </span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(activePreviewUrl);
                  setActivePreviewUrl(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Preview
              </button>
            </div>
            <div className="flex justify-center max-h-96 overflow-auto bg-black/40 rounded p-2">
              {activePreviewType?.startsWith('image/') ? (
                <img
                  src={activePreviewUrl}
                  alt={activeFilename || 'Evidence Preview'}
                  className="max-h-80 object-contain rounded"
                />
              ) : (
                <iframe
                  src={activePreviewUrl}
                  title="PDF Preview"
                  className="w-full h-80 rounded bg-white"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
