'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface Step {
  label: string
  description?: string
}

interface ProgressStepperProps {
  steps: Step[] | string[]
  currentStep: number
  completedSteps?: number[]
  onStepClick?: (step: number) => void
}

export function ProgressStepper({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
}: ProgressStepperProps) {
  // Normalize steps to Step objects
  const normalizedSteps: Step[] = steps.map((step) =>
    typeof step === 'string' ? { label: step } : step
  )

  const isStepCompleted = (index: number) => completedSteps.includes(index)
  const isStepCurrent = (index: number) => index === currentStep
  const isStepClickable = (index: number) =>
    onStepClick && (isStepCompleted(index) || isStepCurrent(index))

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {normalizedSteps.map((step, index) => {
            const completed = isStepCompleted(index)
            const current = isStepCurrent(index)
            const clickable = isStepClickable(index)

            return (
              <div key={index} className="flex items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`flex flex-col items-center ${
                    clickable ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => clickable && onStepClick?.(index)}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: current ? 1.1 : 1,
                    }}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      completed
                        ? 'bg-primary border-primary'
                        : current
                        ? 'bg-background border-primary'
                        : 'bg-background border-muted'
                    }`}
                  >
                    {completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 25,
                        }}
                      >
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </motion.div>
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          current ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}

                    {/* Current Step Pulse Ring */}
                    {current && !completed && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <div className="mt-2 text-center max-w-[120px]">
                    <p
                      className={`text-xs font-medium ${
                        current || completed
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < normalizedSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-muted mx-4 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={{ width: '0%' }}
                      animate={{
                        width: isStepCompleted(index) ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile View - Dots Only */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2">
          {normalizedSteps.map((step, index) => {
            const completed = isStepCompleted(index)
            const current = isStepCurrent(index)

            return (
              <div key={index} className="flex items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: current ? 1.2 : 1,
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    completed
                      ? 'bg-primary'
                      : current
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
                {index < normalizedSteps.length - 1 && (
                  <div className="w-8 h-0.5 bg-muted relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={{ width: '0%' }}
                      animate={{
                        width: isStepCompleted(index) ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current Step Label (Mobile) */}
        <div className="text-center mt-4">
          <p className="text-sm font-medium text-foreground">
            {normalizedSteps[currentStep].label}
          </p>
          {normalizedSteps[currentStep].description && (
            <p className="text-xs text-muted-foreground mt-1">
              {normalizedSteps[currentStep].description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {normalizedSteps.length}
          </p>
        </div>
      </div>
    </div>
  )
}
