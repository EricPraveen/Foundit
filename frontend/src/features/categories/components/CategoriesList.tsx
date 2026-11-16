import React, { useState, useMemo } from 'react';
import { Tag, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';

interface CategoriesListProps {
  className?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({ className, onSelectCategory }) => {
  const { categories, isLoading, error, refetch } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-campus-100 text-campus-800">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Lost & Found Categories</CardTitle>
              <p className="text-xs text-slate-500">
                Official item classifications verified by the Central Security Office
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                className="py-1.5 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh categories"
              className="p-2"
              aria-label="Refresh categories"
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-lg space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="danger" title="Unable to load categories" className="my-2">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Try Again
            </Button>
          </Alert>
        )}

        {!isLoading && !error && categories.length === 0 && (
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-slate-400" />}
            title="No Categories Available"
            description="Active categories have not yet been provisioned by the campus administrator."
          />
        )}

        {!isLoading && !error && categories.length > 0 && filteredCategories.length === 0 && (
          <EmptyState
            icon={<Search className="h-8 w-8 text-slate-400" />}
            title="No Matching Categories"
            description={`No active categories matched "${searchQuery}".`}
          />
        )}

        {!isLoading && !error && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => onSelectCategory?.(category.id)}
                className={`p-3 rounded-lg border border-slate-200 bg-white hover:border-campus-300 hover:bg-slate-50 transition-all ${
                  onSelectCategory ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-900">{category.name}</span>
                </div>
                {category.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2">{category.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No description provided</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
