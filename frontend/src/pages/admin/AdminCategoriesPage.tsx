import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Power,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  useAdminCategories,
  CreateCategoryModal,
  EditCategoryModal,
} from '@/features/admin';
import type { CategoryResponse } from '@/features/admin';

export const AdminCategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] =
    useState<CategoryResponse | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: categories, isLoading, isError, error, setCategoryStatus } =
    useAdminCategories();

  const handleToggleStatus = async (cat: CategoryResponse) => {
    setIsUpdatingStatus(true);
    try {
      await setCategoryStatus(cat.id, !cat.active);
    } catch {
      // Handled via error state
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredCategories: CategoryResponse[] = (categories || []).filter(
    (cat: CategoryResponse) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      cat.name.toLowerCase().includes(term) ||
      (cat.description && cat.description.toLowerCase().includes(term))
    );
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Item Category Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Define item taxonomy classifications for student reports, custody filters, and reputation point rules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Category
        </Button>
      </div>

      <Alert variant="info" title="Taxonomy Lifecycle Note" className="mb-6">
        Categories follow a soft active/inactive lifecycle. Deactivated categories are
        hidden from reporting forms while preserving data integrity for existing items and audit history.
      </Alert>

      {/* Search Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredCategories.length} of {categories?.length || 0} categories
        </span>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Categories" className="mb-6">
          {error || 'Failed to retrieve categories list.'}
        </Alert>
      )}

      {/* Categories Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Category Name</th>
                <th scope="col" className="px-4 py-3 text-left">Description</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {cat.name}
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-md truncate text-xs">
                      {cat.description || (
                        <span className="italic text-slate-400">No description provided</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={cat.active ? 'success' : 'default'}>
                        {cat.active ? (
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

                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit Category Details"
                        onClick={() => setSelectedCategoryForEdit(cat)}
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title={cat.active ? 'Deactivate Category' : 'Activate Category'}
                        onClick={() => handleToggleStatus(cat)}
                        disabled={isUpdatingStatus}
                        className={cat.active ? 'text-amber-600' : 'text-emerald-600'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditCategoryModal
        isOpen={!!selectedCategoryForEdit}
        onClose={() => setSelectedCategoryForEdit(null)}
        category={selectedCategoryForEdit}
      />
    </PageContainer>
  );
};

export default AdminCategoriesPage;
