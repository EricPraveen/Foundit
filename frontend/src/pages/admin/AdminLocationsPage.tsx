import React, { useState } from 'react';
import {
  MapPin,
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
  useAdminLocations,
  CreateLocationModal,
  EditLocationModal,
} from '@/features/admin';
import type { LocationResponse } from '@/features/admin';

export const AdminLocationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLocationForEdit, setSelectedLocationForEdit] =
    useState<LocationResponse | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: locations, isLoading, isError, error, setLocationStatus } =
    useAdminLocations();

  const handleToggleStatus = async (loc: LocationResponse) => {
    setIsUpdatingStatus(true);
    try {
      await setLocationStatus(loc.id, !loc.active);
    } catch {
      // Handled via error state
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Extract unique campus zones
  const zones = Array.from(
    new Set((locations || []).map((l: LocationResponse) => l.campusZone).filter(Boolean))
  ) as string[];

  const filteredLocations: LocationResponse[] = (locations || []).filter(
    (loc: LocationResponse) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      loc.name.toLowerCase().includes(term) ||
      (loc.campusZone && loc.campusZone.toLowerCase().includes(term)) ||
      (loc.description && loc.description.toLowerCase().includes(term));

    const matchesZone = !selectedZone || loc.campusZone === selectedZone;

    return matchesSearch && matchesZone;
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-teal-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Location Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Define verified university buildings, faculty zones, and custody drop points across campus.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Location
        </Button>
      </div>

      <Alert variant="info" title="Location Governance" className="mb-6">
        Campus locations are referenced across student lost & found reports and custody handovers.
        Locations use safe soft-deactivation so historical reports remain intact.
      </Alert>

      {/* Search Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {zones.length > 0 && (
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-campus-600"
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          )}
        </div>

        <span className="text-xs text-slate-500 self-end sm:self-auto">
          Showing {filteredLocations.length} of {locations?.length || 0} locations
        </span>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Locations" className="mb-6">
          {error || 'Failed to retrieve locations list.'}
        </Alert>
      )}

      {/* Locations Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Location Name</th>
                <th scope="col" className="px-4 py-3 text-left">Campus Zone</th>
                <th scope="col" className="px-4 py-3 text-left">Description</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {loc.name}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                      {loc.campusZone ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          {loc.campusZone}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Campus</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-md truncate text-xs">
                      {loc.description || (
                        <span className="italic text-slate-400">No description provided</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={loc.active ? 'success' : 'default'}>
                        {loc.active ? (
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
                        title="Edit Location Details"
                        onClick={() => setSelectedLocationForEdit(loc)}
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title={loc.active ? 'Deactivate Location' : 'Activate Location'}
                        onClick={() => handleToggleStatus(loc)}
                        disabled={isUpdatingStatus}
                        className={loc.active ? 'text-amber-600' : 'text-emerald-600'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No campus locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditLocationModal
        isOpen={!!selectedLocationForEdit}
        onClose={() => setSelectedLocationForEdit(null)}
        location={selectedLocationForEdit}
      />
    </PageContainer>
  );
};

export default AdminLocationsPage;
