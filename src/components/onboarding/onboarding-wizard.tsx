"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { useAuthStore } from "@/lib/stores/auth-store";
import { WelcomeStep } from "./steps/welcome-step";
import { CreateProjectStep } from "./steps/create-project-step";
import { CreateIntentionStep } from "./steps/create-intention-step";
import { UnderstandFlowStep } from "./steps/understand-flow-step";

const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const user = useAuthStore((s) => s.user);
  const {
    shouldShowOnboarding,
    currentStep,
    isOpen,
    isCompleting,
    createdProjectId,
    createdProjectName,
    createdIntentionId,
    open,
    nextStep,
    setCreatedProject,
    setCreatedIntention,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  // Auto-open when user needs onboarding
  useEffect(() => {
    if (shouldShowOnboarding && !isOpen) {
      // Small delay to avoid flash during page load
      const timer = setTimeout(() => open(), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isOpen, open]);

  if (!shouldShowOnboarding) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[calc(100%-2rem)] sm:max-w-md p-6 sm:p-8 gap-0 max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Accessible title (visually hidden) */}
        <DialogTitle className="sr-only">Tutorial de onboarding</DialogTitle>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              Passo {currentStep + 1} de {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step content with animations */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <WelcomeStep
              key="welcome"
              onNext={nextStep}
              onSkip={skipOnboarding}
              userName={user?.nome}
            />
          )}
          {currentStep === 1 && (
            <CreateProjectStep
              key="create-project"
              onNext={nextStep}
              onSkip={skipOnboarding}
              onProjectCreated={setCreatedProject}
              createdProjectId={createdProjectId}
              createdProjectName={createdProjectName}
            />
          )}
          {currentStep === 2 && (
            <CreateIntentionStep
              key="create-intention"
              onNext={nextStep}
              onSkip={skipOnboarding}
              onIntentionCreated={setCreatedIntention}
              createdProjectId={createdProjectId}
              createdIntentionId={createdIntentionId}
            />
          )}
          {currentStep === 3 && (
            <UnderstandFlowStep
              key="understand-flow"
              onComplete={completeOnboarding}
              onSkip={skipOnboarding}
              isCompleting={isCompleting}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
