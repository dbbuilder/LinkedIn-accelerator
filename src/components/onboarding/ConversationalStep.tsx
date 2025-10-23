'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface ConversationalStepProps {
  title: string
  description?: string
  aiMessage?: string
  children: ReactNode
  showAIAssistant?: boolean
  isLoading?: boolean
}

export function ConversationalStep({
  title,
  description,
  aiMessage,
  children,
  showAIAssistant = true,
  isLoading = false,
}: ConversationalStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {/* AI Assistant Message */}
      {showAIAssistant && aiMessage && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative"
        >
          <div className="flex gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">AI Assistant</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiMessage}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-primary" />
          <span>AI is analyzing...</span>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
