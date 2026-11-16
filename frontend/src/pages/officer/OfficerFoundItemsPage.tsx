import React from 'react';
import { Layers } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const OfficerFoundItemsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Officer Found Items Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage physical custody items, barcode/IDs, and status updates.
        </p>
      </div>
      <EmptyState
        icon={<Layers className="h-6 w-6" />}
        title="Officer Inventory Module"
        description="Filter by handover status, search item details, and record physical returns in FRONTEND-06 (#104)."
      />
    </PageContainer>
  );
};
export default OfficerFoundItemsPage;
