import React from 'react';
import { MapPin, Calendar, PackageSearch, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { resolveImageUrl } from '../services/foundItemService';
import type { FoundItemSummaryResponse } from '../types';

export interface FoundItemCardProps {
  item: FoundItemSummaryResponse;
  onViewDetails?: (id: string) => void;
  className?: string;
}

export const FoundItemCard: React.FC<FoundItemCardProps> = ({
  item,
  onViewDetails,
  className = '',
}) => {
  const primaryImage = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;

  const formattedDate = (() => {
    try {
      return new Date(item.foundAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return item.foundAt;
    }
  })();

  return (
    <Card className={`group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 ${className}`}>
      {/* Image Thumbnail or Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {primaryImage ? (
          <img
            src={resolveImageUrl(primaryImage)}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <PackageSearch className="h-10 w-10 stroke-[1.5]" />
            <span className="mt-1 text-[11px] font-medium text-slate-500">No photos attached</span>
          </div>
        )}

        {/* Category Badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="default" size="sm" className="bg-white/95 backdrop-blur-xs font-semibold shadow-xs">
            {item.categoryName}
          </Badge>
        </div>

        {/* Verified Security Custody badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          <Badge variant="success" size="sm" className="bg-white/95 backdrop-blur-xs shadow-xs flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Verified</span>
          </Badge>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold text-slate-900 group-hover:text-campus-900 transition-colors line-clamp-1 text-base">
          {item.title}
        </h4>

        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed flex-1">
          {item.description}
        </p>

        {/* Location & Date Metadata */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {item.locationName}
              {item.specificLocation ? ` • ${item.specificLocation}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Found {formattedDate}</span>
          </div>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(item.id)}
              className="w-full justify-between group/btn"
              rightIcon={<ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />}
            >
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
