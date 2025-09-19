"use client"

import React from 'react'
import { Check, Brain, Sparkles, PenTool, Image, Clock } from 'lucide-react'

type ProcessingStep = 
  | 'RECEIVED' 
  | 'ANALYZING_BRAND_VOICE' 
  | 'GENERATING_HOOKS' 
  | 'WRITING_POSTS' 
  | 'CREATING_IMAGES' 
  | 'COMPLETED'

type ProcessedStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

interface ProcessingStepVisualizerProps {
  currentStep?: ProcessingStep
  processedStatus: ProcessedStatus
  showLabels?: boolean
  compact?: boolean
}

interface StepConfig {
  key: ProcessingStep
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: {
    active: string
    completed: string
    pending: string
  }
}

const PROCESSING_STEPS: StepConfig[] = [
  {
    key: 'RECEIVED',
    label: 'Received',
    icon: Clock,
    color: {
      active: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  },
  {
    key: 'ANALYZING_BRAND_VOICE',
    label: 'Analyzing Brand Voice',
    icon: Brain,
    color: {
      active: 'text-purple-600 bg-purple-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  },
  {
    key: 'GENERATING_HOOKS',
    label: 'Generating Hooks',
    icon: Sparkles,
    color: {
      active: 'text-yellow-600 bg-yellow-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  },
  {
    key: 'WRITING_POSTS',
    label: 'Writing Posts',
    icon: PenTool,
    color: {
      active: 'text-orange-600 bg-orange-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  },
  {
    key: 'CREATING_IMAGES',
    label: 'Creating Images',
    icon: Image,
    color: {
      active: 'text-pink-600 bg-pink-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    icon: Check,
    color: {
      active: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-gray-400 bg-gray-100'
    }
  }
]

export function ProcessingStepVisualizer({ 
  currentStep, 
  processedStatus, 
  showLabels = true, 
  compact = false 
}: ProcessingStepVisualizerProps) {
  
  const getStepStatus = (step: StepConfig): 'completed' | 'active' | 'pending' => {
    if (processedStatus === 'FAILED') {
      return 'pending'
    }
    
    if (processedStatus === 'COMPLETED') {
      return 'completed'
    }

    if (!currentStep) {
      return step.key === 'RECEIVED' ? 'active' : 'pending'
    }

    const currentStepIndex = PROCESSING_STEPS.findIndex(s => s.key === currentStep)
    const stepIndex = PROCESSING_STEPS.findIndex(s => s.key === step.key)

    if (stepIndex < currentStepIndex) {
      return 'completed'
    } else if (stepIndex === currentStepIndex) {
      return 'active'
    } else {
      return 'pending'
    }
  }

  const getStepColor = (step: StepConfig, status: 'completed' | 'active' | 'pending') => {
    if (processedStatus === 'FAILED') {
      return 'text-red-600 bg-red-100'
    }
    return step.color[status]
  }

  const getConnectorStatus = (index: number): 'completed' | 'active' | 'pending' => {
    if (processedStatus === 'FAILED') {
      return 'pending'
    }
    
    if (processedStatus === 'COMPLETED') {
      return 'completed'
    }

    if (!currentStep) {
      return 'pending'
    }

    const currentStepIndex = PROCESSING_STEPS.findIndex(s => s.key === currentStep)
    
    if (index < currentStepIndex) {
      return 'completed'
    } else if (index === currentStepIndex) {
      return 'active'
    } else {
      return 'pending'
    }
  }

  const getConnectorColor = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed': return 'bg-green-300'
      case 'active': return 'bg-blue-300'
      case 'pending': return 'bg-gray-200'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {PROCESSING_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step)
          const Icon = step.icon
          const isLast = index === PROCESSING_STEPS.length - 1

          return (
            <React.Fragment key={step.key}>
              <div 
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center 
                  ${getStepColor(step, stepStatus)}
                  ${stepStatus === 'active' ? 'animate-pulse' : ''}
                  transition-all duration-300 relative group cursor-help
                `}
                title={step.label}
              >
                <Icon className="w-3 h-3" />
                {/* Tooltip */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {step.label}
                </div>
              </div>
              {!isLast && (
                <div 
                  className={`
                    w-3 h-0.5 
                    ${getConnectorColor(getConnectorStatus(index))}
                    transition-all duration-500
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200"></div>
        
        {/* Active progress line */}
        {currentStep && processedStatus === 'PROCESSING' && (
          <div 
            className="absolute top-6 left-6 h-0.5 bg-blue-400 transition-all duration-1000 ease-in-out"
            style={{
              width: `${(PROCESSING_STEPS.findIndex(s => s.key === currentStep) / (PROCESSING_STEPS.length - 1)) * 100}%`
            }}
          />
        )}
        
        {processedStatus === 'COMPLETED' && (
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-green-400"></div>
        )}

        {PROCESSING_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step)
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm
                  ${getStepColor(step, stepStatus)}
                  ${stepStatus === 'active' ? 'animate-pulse scale-110' : ''}
                  transition-all duration-300 relative group cursor-help
                `}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip for full-size version */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {step.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              {showLabels && (
                <div className="mt-2 text-xs text-center max-w-20">
                  <div className={`
                    font-medium
                    ${stepStatus === 'active' ? 'text-gray-900' : 'text-gray-600'}
                  `}>
                    {step.label}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status message */}
      {processedStatus === 'FAILED' && (
        <div className="mt-4 text-center">
          <div className="text-sm text-red-600 font-medium">Processing Failed</div>
          <div className="text-xs text-red-500">Please try reprocessing</div>
        </div>
      )}
      
      {processedStatus === 'COMPLETED' && (
        <div className="mt-4 text-center">
          <div className="text-sm text-green-600 font-medium">✅ Processing Complete</div>
        </div>
      )}
      
      {processedStatus === 'PROCESSING' && currentStep && (
        <div className="mt-4 text-center">
          <div className="text-sm text-blue-600 font-medium">
            {PROCESSING_STEPS.find(s => s.key === currentStep)?.label}...
          </div>
        </div>
      )}
    </div>
  )
}