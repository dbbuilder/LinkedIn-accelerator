'use client'

import { motion } from 'framer-motion'
import { Check, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface SuggestionCardProps {
  title: string
  value: string
  confidence?: number
  rationale?: string
  icon?: React.ReactNode
  onAccept: () => void
  onCustomize?: () => void
  onSkip?: () => void
  accepted?: boolean
  delay?: number
}

export function SuggestionCard({
  title,
  value,
  confidence,
  rationale,
  icon,
  onAccept,
  onCustomize,
  onSkip,
  accepted = false,
  delay = 0,
}: SuggestionCardProps) {
  const [isAccepted, setIsAccepted] = useState(accepted)
  const [isHovered, setIsHovered] = useState(false)

  const handleAccept = () => {
    setIsAccepted(true)
    onAccept()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 ${
          isAccepted
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : isHovered
            ? 'shadow-lg border-primary/50'
            : 'shadow-sm'
        }`}
      >
        {/* Gradient Border Effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 opacity-0 transition-opacity duration-300 ${
            isHovered && !isAccepted ? 'opacity-100' : ''
          }`}
        />

        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {icon && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {title}
                </h3>
              </div>
            </div>

            {/* Confidence Badge */}
            {confidence !== undefined && !isAccepted && (
              <Badge variant="secondary" className="text-xs">
                {confidence}% match
              </Badge>
            )}

            {/* Accepted Checkmark */}
            {isAccepted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex-shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Value Display */}
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-snug">{value}</p>
          </div>

          {/* Rationale */}
          {rationale && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isHovered || isAccepted ? 'auto' : 0,
                opacity: isHovered || isAccepted ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                {rationale}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          {!isAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="flex items-center gap-2 pt-2"
            >
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1"
                variant="default"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>

              {onCustomize && (
                <Button
                  onClick={onCustomize}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Customize
                </Button>
              )}

              {onSkip && (
                <Button
                  onClick={onSkip}
                  size="sm"
                  variant="ghost"
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Accepted State Message */}
          {isAccepted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 dark:text-green-400 font-medium"
            >
              Suggestion accepted!
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
