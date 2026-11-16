import React, { useState, useMemo } from 'react';
import { MapPin, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useLocations } from '../hooks/useLocations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';

interface LocationsListProps {
  className?: string;
  onSelectLocation?: (locationId: string) => void;
}

export const LocationsList: React.FC<LocationsListProps> = ({ className, onSelectLocation }) => {
  const { locations, isLoading, error, refetch } = useLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  // Extract unique campus zones if provided by backend
  const campusZones = useMemo(() => {
    const zones = new Set<string>();
    locations.forEach((l) => {
      if (l.campusZone) zones.add(l.campusZone);
    });
    return Array.from(zones).sort();
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.campusZone && loc.campusZone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesZone = selectedZone === 'ALL' || loc.campusZone === selectedZone;

      return matchesSearch && matchesZone;
    });
  }, [locations, searchQuery, selectedZone]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Campus Locations</CardTitle>
              <p className="text-xs text-slate-500">
                Official University of Moratuwa buildings, facilities, and custody zones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Input
                placeholder="Search locations..."
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
              title="Refresh locations"
              className="p-2"
              aria-label="Refresh locations"
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {campusZones.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Zone:</span>
            <button
              type="button"
              onClick={() => setSelectedZone('ALL')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                selectedZone === 'ALL'
                  ? 'bg-campus-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Zones ({locations.length})
            </button>
            {campusZones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedZone === zone
                    ? 'bg-campus-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-lg space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="danger" title="Unable to load campus locations" className="my-2">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Try Again
            </Button>
          </Alert>
        )}

        {!isLoading && !error && locations.length === 0 && (
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-slate-400" />}
            title="No Campus Locations Available"
            description="Active campus locations have not yet been provisioned by the campus administrator."
          />
        )}

        {!isLoading && !error && locations.length > 0 && filteredLocations.length === 0 && (
          <EmptyState
            icon={<Search className="h-8 w-8 text-slate-400" />}
            title="No Matching Locations"
            description={`No campus locations matched your search criteria.`}
          />
        )}

        {!isLoading && !error && filteredLocations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => onSelectLocation?.(location.id)}
                className={`p-3 rounded-lg border border-slate-200 bg-white hover:border-campus-300 hover:bg-slate-50 transition-all ${
                  onSelectLocation ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-900 leading-snug">
                    {location.name}
                  </span>
                  {location.campusZone && (
                    <Badge variant="default" size="sm" className="shrink-0 text-[10px]">
                      {location.campusZone}
                    </Badge>
                  )}
                </div>
                {location.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2">{location.description}</p>
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
