import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { adminService } from '../services/adminService';
import type { ReputationRuleResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

interface UpdateReputationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: ReputationRuleResponse | null;
  onSuccess?: () => void;
}

export const UpdateReputationRuleModal: React.FC<UpdateReputationRuleModalProps> = ({
  isOpen,
  onClose,
  rule,
  onSuccess,
}) => {
  const [points, setPoints] = useState<number>(10);
  const [active, setActive] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (rule) {
      setPoints(rule.points);
      setActive(rule.active);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [rule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule) return;

    if (points < 0) {
      setErrorMessage('Points value cannot be negative.');
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await adminService.updateReputationRule(rule.id, {
        points,
        active,
      });

      setSuccessMessage('Reputation points rule updated successfully.');
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to update reputation rule.'));
    } finally {
      setIsPending(false);
    }
  };

  if (!rule) return null;

  const transactionLabel =
    rule.transactionType === 'FOUND_ITEM_HANDOVER'
      ? 'Physical Handover to Security Office'
      : 'Item Collection by Owner';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) {
          setErrorMessage(null);
          setSuccessMessage(null);
          onClose();
        }
      }}
      title="Calibrate Reputation Points Rule"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="danger" title="Error">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Target Category
            </span>
            <span className="font-semibold text-slate-900">
              {rule.categoryName || 'Global Rule'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lifecycle Event
            </span>
            <span className="text-xs font-medium text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
              {transactionLabel}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Points Awarded <span className="text-rose-500">*</span>
          </label>
          <Input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
            disabled={isPending}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Points awarded into the append-only reputation ledger upon successful event
            verification. Must be non-negative.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rule-active-toggle"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-slate-300 text-campus-600 focus:ring-campus-500"
          />
          <label htmlFor="rule-active-toggle" className="text-sm font-medium text-slate-700">
            Rule is active and currently awarding points
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Save Points Calibration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
