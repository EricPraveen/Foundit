import React from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  AlertTriangle,
  Clock,
  Mail,
  Award,
  HardDrive,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAdminSystemConfig } from '@/features/admin';
import { ROUTES } from '@/routes/paths';

export const AdminSystemConfigPage: React.FC = () => {
  const { data: config, isLoading, isError, error } = useAdminSystemConfig();

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Configuration & Policies
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Inspect active operational policy parameters, unclaimed escalation thresholds, and notification settings.
          </p>
        </div>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Configuration" className="mb-6">
          {error || 'Failed to retrieve system operational configuration.'}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : config ? (
        <div className="space-y-6">
          {/* Policy Governance Banner */}
          <Alert variant="info" title="Operational Policy Governance" className="border-blue-200 bg-blue-50/50">
            <p className="text-xs text-blue-900">
              {config.notice}
            </p>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unclaimed Items Escalation Policy */}
            <Card className="border-rose-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <CardTitle className="text-base">Unclaimed Item Policy</CardTitle>
                </div>
                <Badge variant={config.unclaimedEscalationEnabled ? 'success' : 'default'}>
                  {config.unclaimedEscalationEnabled ? 'Escalation Active' : 'Automated Escalation Inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Escalation Threshold</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {config.unclaimedThresholdDays} Days
                  </span>
                </div>

                <div className="rounded-lg bg-rose-50/50 p-3 border border-rose-100 text-xs text-rose-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-700" />
                    University Property & Custody Regulation:
                  </div>
                  <p>
                    Found items unclaimed past the configured threshold ({config.unclaimedThresholdDays} days)
                    transition to UNCLAIMED status for administrative review. Items are never
                    automatically disposed of or deleted. Final handling follows university property policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Handover & Reminder Schedule */}
            <Card className="border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Handover Reminders</CardTitle>
                </div>
                <Badge variant="info">Automated</Badge>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Reminder Interval</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Every {config.handoverReminderIntervalHours} Hours
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Students who submit a found report receive automated reminders every {config.handoverReminderIntervalHours} hours
                  to physically hand over the item to the Central Security Office. Items remain PENDING_HANDOVER until verified.
                </p>
              </CardContent>
            </Card>

            {/* Email Dispatch & Notification Parameters */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-campus-700" />
                  <CardTitle className="text-base">Notification Delivery</CardTitle>
                </div>
                <Badge variant={config.emailNotificationsEnabled ? 'success' : 'default'}>
                  {config.emailNotificationsEnabled ? 'Email Active' : 'Email Disabled'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Max Delivery Retries</span>
                  <span className="font-semibold text-slate-900">{config.maxEmailRetries} attempts</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Retry Delay</span>
                  <span className="font-semibold text-slate-900">{config.emailRetryDelaySeconds} seconds</span>
                </div>

                <p className="text-slate-500 pt-1">
                  Email delivery logs track transient dispatch errors without rolling back transactional business events.
                </p>
              </CardContent>
            </Card>

            {/* Reputation Points Defaults */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Reputation Baseline</CardTitle>
                </div>
                <Link
                  to={ROUTES.ADMIN.REPUTATION_RULES}
                  className="text-xs font-semibold text-campus-700 hover:text-campus-900 flex items-center gap-1"
                >
                  Configure Rules <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Default Handover Reward</span>
                  <span className="font-bold text-slate-900">+{config.defaultHandoverPoints} pts</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Default Collection Reward</span>
                  <span className="font-bold text-slate-900">+{config.defaultCollectionPoints} pts</span>
                </div>

                <p className="text-slate-500 pt-1">
                  Category-specific rules override these defaults when configured in the Reputation Rules module.
                </p>
              </CardContent>
            </Card>

            {/* Infrastructure & Application Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-slate-600" />
                  Infrastructure & Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Attachment Storage Provider
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {config.storageProvider.toUpperCase()}
                  </span>
                  <p className="mt-1 text-slate-500">
                    Manages found item photos and confidential claim proof files.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Frontend Base URL
                  </span>
                  <span className="font-mono text-xs text-slate-900 block truncate">
                    {config.appBaseUrl}
                  </span>
                  <p className="mt-1 text-slate-500">
                    Used for generating verification links and notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};

export default AdminSystemConfigPage;
