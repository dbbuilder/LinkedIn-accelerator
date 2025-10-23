'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ConversationalStep } from '@/components/onboarding/ConversationalStep'
import { InsightsPanel } from '@/components/onboarding/InsightsPanel'
import { ProgressStepper } from '@/components/onboarding/ProgressStepper'
import { Skeleton } from '@/components/ui/skeleton'

type OnboardingStep = 'name' | 'analyzing' | 'insights' | 'manual' | 'creating'

interface VentureInsights {
  industry?: string
  targetAudience?: string[]
  brandVoice?: string
  contentThemes?: string[]
  [key: string]: string | string[] | undefined
}

export default function NewVenturePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('name')

  // Basic venture data
  const [ventureName, setVentureName] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  // AI insights
  const [insights, setInsights] = useState<VentureInsights>({})

  // Manual form data
  const [formData, setFormData] = useState({
    venture_name: '',
    industry: '',
    target_audience: '',
    unique_value_prop: '',
    key_offerings: '',
  })

  // Step 1: Analyze venture with AI
  async function handleAnalyze() {
    if (!ventureName.trim()) return

    setCurrentStep('analyzing')

    try {
      const response = await fetch('/api/dev-auth/ai/analyze-venture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureName: ventureName.trim(),
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
        setCurrentStep('insights')
      } else {
        console.error('Analysis failed, falling back to manual')
        setCurrentStep('manual')
        setFormData({ ...formData, venture_name: ventureName })
      }
    } catch (error) {
      console.error('Error analyzing venture:', error)
      setCurrentStep('manual')
      setFormData({ ...formData, venture_name: ventureName })
    }
  }

  // Step 2: Accept AI insights and create venture
  async function handleAcceptInsights() {
    setCurrentStep('creating')

    try {
      const ventureData = {
        venture_name: ventureName,
        industry: insights.industry || '',
        target_audience: insights.targetAudience?.join(', ') || '',
        unique_value_prop: insights.brandVoice || '',
        key_offerings: insights.contentThemes?.join(', ') || '',
      }

      const response = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventureData),
      })

      if (response.ok) {
        const venture = await response.json()
        router.push(`/ventures/${venture.id}`)
      } else {
        alert('Failed to create venture. Please try again.')
        setCurrentStep('insights')
      }
    } catch (error) {
      console.error('Error creating venture:', error)
      alert('An error occurred. Please try again.')
      setCurrentStep('insights')
    }
  }

  // Step 3: Customize insights (go to manual form)
  function handleCustomizeInsights() {
    setFormData({
      venture_name: ventureName,
      industry: insights.industry || '',
      target_audience: insights.targetAudience?.join(', ') || '',
      unique_value_prop: insights.brandVoice || '',
      key_offerings: insights.contentThemes?.join(', ') || '',
    })
    setCurrentStep('manual')
  }

  // Manual form submission
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCurrentStep('creating')

    try {
      const response = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const venture = await response.json()
        router.push(`/ventures/${venture.id}`)
      } else {
        alert('Failed to create venture. Please try again.')
        setCurrentStep('manual')
      }
    } catch (error) {
      console.error('Error creating venture:', error)
      alert('An error occurred. Please try again.')
      setCurrentStep('manual')
    }
  }

  const steps = [
    { label: 'Business Info', description: 'Tell us about your venture' },
    { label: 'AI Analysis', description: 'We analyze your business' },
    { label: 'Review', description: 'Confirm or customize' },
    { label: 'Complete', description: 'Create your venture' },
  ]

  const currentStepIndex =
    currentStep === 'name' ? 0 :
    currentStep === 'analyzing' ? 1 :
    currentStep === 'insights' || currentStep === 'manual' ? 2 : 3

  const completedSteps = Array.from({ length: currentStepIndex }, (_, i) => i)

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ventures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Create New Venture</h1>
          <p className="text-muted-foreground mt-1">
            Let AI help you set up your professional venture
          </p>
        </div>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper
        steps={steps}
        currentStep={currentStepIndex}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Business Name & Info */}
        {currentStep === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConversationalStep
              title="What's your business called?"
              aiMessage="Let's get started! Tell me your business name and I'll use AI to analyze it and suggest industry, audience, and content themes."
              showAIAssistant
            >
              <Card className="p-6">
                <div className="space-y-6">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="ventureName">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ventureName"
                      value={ventureName}
                      onChange={(e) => setVentureName(e.target.value)}
                      placeholder="e.g., TechFlow AI Solutions"
                      autoFocus
                      className="text-lg"
                    />
                  </div>

                  {/* Website (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="website">
                      Website <span className="text-muted-foreground text-sm">(optional)</span>
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Providing a website URL helps AI give better suggestions
                    </p>
                  </div>

                  {/* Description (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Brief Description <span className="text-muted-foreground text-sm">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does your business do?"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!ventureName.trim()}
                      size="lg"
                      className="flex-1 group"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                      <motion.span
                        className="ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </Button>

                    <Button
                      onClick={() => {
                        setFormData({ ...formData, venture_name: ventureName })
                        setCurrentStep('manual')
                      }}
                      variant="outline"
                      size="lg"
                      disabled={!ventureName.trim()}
                    >
                      Fill Manually Instead
                    </Button>
                  </div>
                </div>
              </Card>
            </ConversationalStep>
          </motion.div>
        )}

        {/* Step 2: AI Analyzing */}
        {currentStep === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConversationalStep
              title="Analyzing your business..."
              aiMessage="I'm using AI to analyze your business and find the best industry match, target audience, brand voice, and content themes. This will only take a few seconds!"
              isLoading
              showAIAssistant
            >
              <Card className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            </ConversationalStep>
          </motion.div>
        )}

        {/* Step 3: AI Insights Display */}
        {currentStep === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConversationalStep
              title="Here's what I found!"
              aiMessage="I've analyzed your business and found some great insights. You can accept these suggestions or customize them to your needs."
              showAIAssistant
            >
              <InsightsPanel
                insights={insights}
                onAcceptAll={handleAcceptInsights}
                onCustomize={handleCustomizeInsights}
              />
            </ConversationalStep>
          </motion.div>
        )}

        {/* Step 4: Manual Form */}
        {currentStep === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConversationalStep
              title="Customize your venture details"
              aiMessage={Object.keys(insights).length > 0
                ? "Feel free to adjust any of the AI suggestions below!"
                : "No problem! Fill in the details manually and I'll help you create great content later."
              }
              showAIAssistant
            >
              <Card className="p-6">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="venture_name">
                      Venture Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="venture_name"
                      value={formData.venture_name}
                      onChange={(e) => setFormData({ ...formData, venture_name: e.target.value })}
                      placeholder="e.g., Tech Consulting Services"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">
                      Industry <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., Technology, Healthcare, Finance"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">
                      Target Audience <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="target_audience"
                      value={formData.target_audience}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                      placeholder="Describe who you serve..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unique_value_prop">
                      Unique Value Proposition <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="unique_value_prop"
                      value={formData.unique_value_prop}
                      onChange={(e) => setFormData({ ...formData, unique_value_prop: e.target.value })}
                      placeholder="What makes you different?"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key_offerings">
                      Key Offerings <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="key_offerings"
                      value={formData.key_offerings}
                      onChange={(e) => setFormData({ ...formData, key_offerings: e.target.value })}
                      placeholder="What services or products do you offer?"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" size="lg" className="flex-1">
                      Create Venture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep('name')}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </Card>
            </ConversationalStep>
          </motion.div>
        )}

        {/* Step 5: Creating */}
        {currentStep === 'creating' && (
          <motion.div
            key="creating"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ConversationalStep
              title="Creating your venture..."
              aiMessage="Almost done! I'm setting up your venture so you can start creating amazing LinkedIn content."
              isLoading
              showAIAssistant
            >
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Setting up your venture...</p>
                  <p className="text-sm text-muted-foreground">
                    This will only take a moment
                  </p>
                </div>
              </Card>
            </ConversationalStep>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
