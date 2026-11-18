import React, { useState } from 'react';
import {
  Award,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  useAdminReputationRules,
  UpdateReputationRuleModal,
} from '@/features/admin';
import type { ReputationRuleResponse } from '@/features/admin';
import { formatDate } from '@/lib/utils/formatters';

export const AdminReputationRulesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuleForEdit, setSelectedRuleForEdit] =
    useState<ReputationRuleResponse | null>(null);

  const { data: rules, isLoading, isError, error } = useAdminReputationRules();

  const filteredRules: ReputationRuleResponse[] = (rules || []).filter(
    (rule: ReputationRuleResponse) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (rule.categoryName && rule.categoryName.toLowerCase().includes(term)) ||
      rule.transactionType.toLowerCase().includes(term)
    );
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reputation Points Rules
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Calibrate community incentive points awarded to finders upon verified physical handover and owner collection.
          </p>
        </div>
      </div>

      <Alert variant="info" title="Reputation Calibration Policy" className="mb-6">
        Points are minted strictly via the backend append-only reputation ledger.
        Each verified event awards points based on the active category rule calibrated below,
        falling back to system defaults (Handover: 10 pts, Collection: 0 pts) if unconfigured.
      </Alert>

      {/* Search Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by category or transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredRules.length} of {rules?.length || 0} rules
        </span>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Reputation Rules" className="mb-6">
          {error || 'Failed to retrieve reputation rules.'}
        </Alert>
      )}

      {/* Rules Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Category</th>
                <th scope="col" className="px-4 py-3 text-left">Transaction Lifecycle Event</th>
                <th scope="col" className="px-4 py-3 text-left">Points Awarded</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Last Calibrated</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  const isHandover = rule.transactionType === 'FOUND_ITEM_HANDOVER';
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {rule.categoryName || 'Global Rule'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            isHandover
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isHandover
                            ? 'Physical Handover to Office'
                            : 'Owner Collection Confirmed'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-sm text-slate-900">
                        +{rule.points} pts
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={rule.active ? 'success' : 'default'}>
                          {rule.active ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(rule.updatedAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Calibrate Points"
                          onClick={() => setSelectedRuleForEdit(rule)}
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-600 mr-1" />
                          Calibrate
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <HelpCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No category reputation rules configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <UpdateReputationRuleModal
        isOpen={!!selectedRuleForEdit}
        onClose={() => setSelectedRuleForEdit(null)}
        rule={selectedRuleForEdit}
      />
    </PageContainer>
  );
};

export default AdminReputationRulesPage;
