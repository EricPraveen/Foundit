import React from 'react';
import { Shield, Clock, Building2, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SecurityOfficeResponse } from '../types';

export interface HandoverGuidanceNoticeProps {
  office?: SecurityOfficeResponse | null;
  compact?: boolean;
  className?: string;
}

export const HandoverGuidanceNotice: React.FC<HandoverGuidanceNoticeProps> = ({
  office,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <Card className={`border-amber-200 bg-amber-50/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-700 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">
                Physical Handover Required for Catalog Listing
              </p>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Found reports start in <Badge variant="warning" size="sm">PENDING</Badge> status and are{' '}
                <strong>hidden from public search</strong>. Please hand over the item to an authorized officer
                at the {office?.name || 'Central Security Office'}{' '}
                {office?.campusLocation ? `(${office.campusLocation})` : ''} to verify and publish it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-campus-200 bg-gradient-to-br from-campus-50/60 to-white shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-campus-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-campus-800 p-2 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-campus-950">
                Official Handover & Custody Policy
              </h3>
              <p className="text-xs text-campus-800">
                University of Moratuwa Lost & Found Security Protocol
              </p>
            </div>
          </div>
          <Badge variant="default" size="sm">
            Strict Physical Verification
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                1
              </span>
              <span>Pending Handover</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              When you submit a report, the item is registered in{' '}
              <strong className="text-slate-800">PENDING_HANDOVER</strong>. It is strictly private to you and{' '}
              <span className="font-medium text-rose-700">excluded from the public catalog</span>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-campus-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-campus-100 text-xs font-bold text-campus-900">
                2
              </span>
              <span>Physical Handover</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Bring the found item to the Central Security Office. An officer will inspect the item, check
              serial numbers or identifiers, and confirm physical custody.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
                3
              </span>
              <span>Published & Points Awarded</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Once verified by an officer, the item transitions to{' '}
              <strong className="text-emerald-800">AVAILABLE</strong> in the catalog, and your reputation points
              are awarded!
            </p>
          </div>
        </div>

        {/* Security Office Details Card */}
        {office && (
          <div className="mt-4 rounded-lg border border-campus-200 bg-campus-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-campus-900">
              <Building2 className="h-4 w-4 text-campus-700" />
              <span>Custody Desk: {office.name}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-900">Campus Location:</span>
                  <p className="text-slate-600">{office.campusLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-900">Operating Hours:</span>
                  <p className="text-slate-600">{office.operatingHours || 'Mon - Fri 08:00 - 18:00'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-campus-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-900">Direct Contact:</span>
                  <p className="text-slate-600">{office.contactPhone || 'Security Ext. 1999'}</p>
                  {office.contactEmail && (
                    <p className="text-slate-500 text-[11px] truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />
                      {office.contactEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 italic">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>
            Students cannot self-verify handovers. If you cannot deliver the item, you can cancel your pending
            report at any time.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
