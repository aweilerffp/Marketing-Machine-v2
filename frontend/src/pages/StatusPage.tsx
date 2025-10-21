import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  status: 'operational' | 'warning' | 'down';
  message: string;
  [key: string]: any;
}

interface SystemStatus {
  timestamp: string;
  overall: 'operational' | 'degraded' | 'down';
  services: {
    database?: ServiceStatus;
    webhook?: ServiceStatus;
    ai?: ServiceStatus;
    queue?: ServiceStatus;
    meetings?: ServiceStatus;
  };
}

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'operational') {
    return <CheckCircle className="w-6 h-6 text-green-500" />;
  } else if (status === 'warning' || status === 'degraded') {
    return <AlertCircle className="w-6 h-6 text-yellow-500" />;
  } else {
    return <XCircle className="w-6 h-6 text-red-500" />;
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    warning: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors] || colors.down}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ServiceCard: React.FC<{ name: string; service: ServiceStatus }> = ({ name, service }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <StatusIndicator status={service.status} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600 mt-1">{service.message}</p>
          </div>
        </div>
        <StatusBadge status={service.status} />
      </div>

      {/* Additional details */}
      {service.activeWebhooks !== undefined && (
        <div className="mt-4 text-sm text-gray-600">
          Active webhooks: {service.activeWebhooks}
        </div>
      )}

      {service.jobs && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Waiting: <span className="font-semibold">{service.jobs.waiting}</span></div>
          <div className="text-gray-600">Active: <span className="font-semibold">{service.jobs.active}</span></div>
          <div className="text-gray-600">Completed: <span className="font-semibold">{service.jobs.completed}</span></div>
          <div className="text-gray-600">Failed: <span className="font-semibold text-red-600">{service.jobs.failed}</span></div>
        </div>
      )}

      {service.count24h !== undefined && (
        <div className="mt-4 text-sm text-gray-600">
          Last 24h: <span className="font-semibold">{service.count24h}</span>
        </div>
      )}

      {service.model && (
        <div className="mt-4 text-sm text-gray-600">
          Model: <span className="font-mono text-xs">{service.model}</span>
        </div>
      )}
    </div>
  );
};

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const serviceNames: Record<string, string> = {
    database: 'Database',
    webhook: 'Webhook Service',
    ai: 'AI Service (Claude)',
    queue: 'Processing Queue',
    meetings: 'Meeting Processing'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
                <p className="text-gray-600 mt-1">Marketing Machine Platform Health</p>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status Banner */}
      {status && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`rounded-lg p-6 ${
            status.overall === 'operational' ? 'bg-green-50 border-2 border-green-200' :
            status.overall === 'degraded' ? 'bg-yellow-50 border-2 border-yellow-200' :
            'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center gap-4">
              <StatusIndicator status={status.overall} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {status.overall === 'operational' ? 'All Systems Operational' :
                   status.overall === 'degraded' ? 'System Degraded' :
                   'System Down'}
                </h2>
                <p className="text-gray-600 mt-1">
                  Last updated: {lastUpdated?.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading && !status && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-800 font-semibold">Failed to load status</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {Object.entries(status.services).map(([key, service]) => (
              <ServiceCard
                key={key}
                name={serviceNames[key] || key}
                service={service}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
