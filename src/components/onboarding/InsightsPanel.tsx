'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Insights {
  industry?: string
  targetAudience?: string[]
  brandVoice?: string
  contentThemes?: string[]
  [key: string]: any
}

interface InsightsPanelProps {
  insights: Insights
  onAcceptAll: () => void
  onCustomize?: () => void
  isLoading?: boolean
}

const insightLabels: Record<string, string> = {
  industry: 'Industry',
  targetAudience: 'Target Audience',
  brandVoice: 'Brand Voice',
  contentThemes: 'Content Themes',
}

const insightIcons: Record<string, string> = {
  industry: '🎯',
  targetAudience: '👥',
  brandVoice: '💬',
  contentThemes: '📋',
}

export function InsightsPanel({
  insights,
  onAcceptAll,
  onCustomize,
  isLoading = false,
}: InsightsPanelProps) {
  const insightEntries = Object.entries(insights).filter(
    ([key, value]) => value !== undefined && value !== null
  )

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-xl">AI Insights</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on your business information, here's what we found
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Insights List */}
        {!isLoading && (
          <div className="space-y-3">
            {insightEntries.map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.15,
                }}
                className="group"
              >
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-colors">
                  {/* Icon + Checkmark */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-2xl">
                      {insightIcons[key] || '✓'}
                    </span>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: index * 0.15 + 0.2,
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {insightLabels[key] || key}
                    </p>
                    <p className="text-base font-semibold leading-snug">
                      {formatValue(value)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && insightEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No insights available yet</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && insightEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: insightEntries.length * 0.15 + 0.3,
            }}
            className="flex items-center gap-3 pt-4"
          >
            <Button
              onClick={onAcceptAll}
              size="lg"
              className="flex-1 group"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept All Insights
              <motion.span
                className="ml-2"
                animate={{
                  x: [0, 4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                →
              </motion.span>
            </Button>

            {onCustomize && (
              <Button
                onClick={onCustomize}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Customize
              </Button>
            )}
          </motion.div>
        )}

        {/* Confidence Note */}
        {!isLoading && insightEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: insightEntries.length * 0.15 + 0.5,
            }}
            className="text-xs text-center text-muted-foreground pt-2"
          >
            These insights are AI-generated and can be customized at any time
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
