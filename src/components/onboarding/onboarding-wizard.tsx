"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";
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

  useEffect(() => {
    if (shouldShowOnboarding && !isOpen) {
      const timer = setTimeout(() => open(), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isOpen, open]);

  if (!shouldShowOnboarding) return null;

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[calc(100%-2rem)] sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden border-border"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Tutorial de onboarding</DialogTitle>

        {/* Header: logo + step counter + progress bar */}
        <header className="space-y-3 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <ScrumbanLogo size="sm" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, rgb(34, 211, 238) 0%, rgb(8, 145, 178) 100%)",
              }}
            />
          </div>
        </header>

        {/* Step content */}
        <div className="px-6 py-6 overflow-y-auto">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
