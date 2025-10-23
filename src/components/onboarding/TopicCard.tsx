'use client'

import { motion } from 'framer-motion'
import { Flame, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface TopicCardProps {
  topic: string
  matchScore: number
  engagementPotential: 'low' | 'medium' | 'high'
  suggestedTone?: string
  rationale?: string
  onGenerate: () => void | Promise<void>
  delay?: number
}

const engagementConfig = {
  low: {
    label: 'Medium Reach',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  medium: {
    label: 'High Reach',
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  high: {
    label: 'Hot Topic',
    icon: Flame,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
}

export function TopicCard({
  topic,
  matchScore,
  engagementPotential,
  suggestedTone,
  rationale,
  onGenerate,
  delay = 0,
}: TopicCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const config = engagementConfig[engagementPotential]
  const EngagementIcon = config.icon

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await onGenerate()
      setIsGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 ${
          isGenerated
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : isHovered
            ? 'shadow-xl -translate-y-1 border-primary/50'
            : 'shadow-md'
        }`}
      >
        {/* Animated Gradient Border */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br from-primary via-primary/50 to-transparent opacity-0`}
          animate={{
            opacity: isHovered && !isGenerated ? [0, 0.1, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: isHovered ? Infinity : 0,
            ease: 'linear',
          }}
        />

        {/* Hot Topic Badge */}
        {engagementPotential === 'high' && (
          <div className="absolute top-3 right-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
                delay: delay + 0.2,
              }}
            >
              <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
                <Flame className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </motion.div>
          </div>
        )}

        <CardHeader className="relative pb-3">
          <div className="space-y-3">
            {/* Topic Title */}
            <h3 className="text-lg font-semibold leading-snug pr-24">
              {topic}
            </h3>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-sm">
              {/* Match Score */}
              <div className="flex items-center gap-1">
                <div className="w-full max-w-[80px] h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${matchScore}%` }}
                    transition={{ duration: 0.8, delay: delay + 0.3 }}
                  />
                </div>
                <span className="text-muted-foreground font-medium">
                  {matchScore}%
                </span>
              </div>

              <div className="h-4 w-px bg-border" />

              {/* Engagement Potential */}
              <div className={`flex items-center gap-1 ${config.color}`}>
                <EngagementIcon className="w-4 h-4" />
                <span className="font-medium text-xs">{config.label}</span>
              </div>

              {/* Suggested Tone */}
              {suggestedTone && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Badge variant="outline" className="text-xs">
                    {suggestedTone}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Rationale */}
          {rationale && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isHovered || isGenerated ? 'auto' : 0,
                opacity: isHovered || isGenerated ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                {rationale}
              </p>
            </motion.div>
          )}

          {/* Generate Button */}
          {!isGenerated && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full group"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          )}

          {/* Generated State */}
          {isGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-medium py-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              Content Generated!
            </motion.div>
          )}

          {/* Pulsing Border for Generating State */}
          {isGenerating && (
            <motion.div
              className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
