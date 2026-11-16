import React from 'react';
import { PackageSearch } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const FoundItemsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Found Items Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search items verified and held at the Central Security Office.
        </p>
      </div>
      <EmptyState
        icon={<PackageSearch className="h-6 w-6" />}
        title="Found Items Catalog Ready for Integration"
        description="Public browsing, filtering by category and location, and reporting found items will be implemented in FRONTEND-03 (#101)."
      />
    </PageContainer>
  );
};
export default FoundItemsPage;
