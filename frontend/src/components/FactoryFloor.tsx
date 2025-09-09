import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../services/api';

interface FactoryStation {
  id: string;
  name: string;
  icon: string;
  status: 'operational' | 'warning' | 'error' | 'idle';
  currentItems: number;
  description: string;
}

interface FactoryFloorProps {}

export const FactoryFloor: React.FC<FactoryFloorProps> = () => {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Fetch meetings data for factory floor visualization
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: contentApi.getMeetings,
    refetchInterval: 5000, // Update every 5 seconds for real-time feel
  });

  // Fetch content queue data
  const { data: contentQueue } = useQuery({
    queryKey: ['content-queue'],
    queryFn: contentApi.getQueue,
    refetchInterval: 5000,
  });

  // Calculate factory station status based on real data
  const factoryStations: FactoryStation[] = [
    {
      id: 'input',
      name: 'Input Station',
      icon: '📥',
      status: meetings?.length > 0 ? 'operational' : 'idle',
      currentItems: meetings?.filter(m => m.processedStatus === 'PENDING').length || 0,
      description: 'Meeting intake and webhook processing'
    },
    {
      id: 'processing',
      name: 'AI Processing',
      icon: '🤖',
      status: meetings?.some(m => m.processedStatus === 'PROCESSING') ? 'operational' : 'idle',
      currentItems: meetings?.filter(m => m.processedStatus === 'PROCESSING').length || 0,
      description: 'Content hook generation and AI processing'
    },
    {
      id: 'quality',
      name: 'Quality Control',
      icon: '✅',
      status: contentQueue?.length > 0 ? 'operational' : 'idle',
      currentItems: contentQueue?.filter(p => p.status === 'PENDING').length || 0,
      description: 'Content review and approval queue'
    },
    {
      id: 'output',
      name: 'Output Gallery',
      icon: '📤',
      status: contentQueue?.some(p => p.status === 'APPROVED') ? 'operational' : 'idle',
      currentItems: contentQueue?.filter(p => p.status === 'APPROVED').length || 0,
      description: 'Published content and performance metrics'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      status: 'operational',
      currentItems: meetings?.length || 0,
      description: 'Performance monitoring and insights'
    }
  ];

  const getStatusColor = (status: FactoryStation['status']) => {
    switch (status) {
      case 'operational': return 'bg-green-100 border-green-500 text-green-800';
      case 'warning': return 'bg-amber-100 border-amber-500 text-amber-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'idle': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getStatusLight = (status: FactoryStation['status']) => {
    switch (status) {
      case 'operational': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      case 'idle': return '⚫';
      default: return '⚫';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading factory floor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Factory Floor Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏭 Marketing Machine Factory Floor</h1>
        <p className="text-gray-600">
          Monitor your content processing pipeline in real-time
        </p>
      </div>

      {/* Factory Line Overview */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Production Line Status</h2>
        
        {/* Horizontal Factory Line */}
        <div className="flex items-center justify-between relative">
          {/* Conveyor Belt Background */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-2 bg-gray-300 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse opacity-30"></div>
            </div>
          </div>

          {/* Factory Stations */}
          {factoryStations.map((station, index) => (
            <div key={station.id} className="relative z-10">
              <div
                onClick={() => setSelectedStation(selectedStation === station.id ? null : station.id)}
                className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                  selectedStation === station.id ? 'scale-110' : ''
                }`}
              >
                {/* Station Card */}
                <div className={`relative bg-white rounded-lg border-2 p-4 shadow-lg min-w-[160px] ${
                  getStatusColor(station.status)
                }`}>
                  {/* Status Light */}
                  <div className="absolute -top-2 -right-2 text-xl">
                    {getStatusLight(station.status)}
                  </div>

                  {/* Station Icon and Name */}
                  <div className="text-center">
                    <div className="text-3xl mb-2">{station.icon}</div>
                    <h3 className="font-semibold text-sm">{station.name}</h3>
                  </div>

                  {/* Current Items Counter */}
                  <div className="mt-3 text-center">
                    <div className="text-2xl font-bold">{station.currentItems}</div>
                    <div className="text-xs opacity-75">items</div>
                  </div>
                </div>
              </div>

              {/* Arrow between stations */}
              {index < factoryStations.length - 1 && (
                <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-400 text-xl z-0">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Station Detail Panel */}
      {selectedStation && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
          {(() => {
            const station = factoryStations.find(s => s.id === selectedStation);
            if (!station) return null;

            return (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{station.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{station.name}</h3>
                      <p className="text-gray-600">{station.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status Overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Status</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusLight(station.status)}</span>
                      <span className="capitalize font-medium">{station.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {station.currentItems} items currently processing
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Recent Activity</h4>
                    <div className="text-sm text-gray-600">
                      Last update: {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Actions</h4>
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Factory Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {meetings?.filter(m => m.processedStatus === 'COMPLETED').length || 0}
              </div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚡</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {meetings?.filter(m => m.processedStatus === 'PROCESSING').length || 0}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {contentQueue?.filter(p => p.status === 'APPROVED').length || 0}
              </div>
              <div className="text-sm text-gray-600">Ready to Publish</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🎯</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};