"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { authApi } from "@/lib/api/auth";

export function useOnboarding() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const store = useOnboardingStore();

  const shouldShowOnboarding = !!user && user.onboardingCompleted !== true;

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    store.setIsCompleting(true);
    try {
      await authApi.updateMe({ onboardingCompleted: true });
      setUser({ ...user, onboardingCompleted: true });
      store.close();
      store.reset();
    } catch {
      // Silently fail — next reload will re-check
    } finally {
      store.setIsCompleting(false);
    }
  }, [user, setUser, store]);

  const skipOnboarding = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  return {
    shouldShowOnboarding,
    currentStep: store.currentStep,
    isOpen: store.isOpen,
    isCompleting: store.isCompleting,
    createdProjectId: store.createdProjectId,
    createdProjectName: store.createdProjectName,
    createdIntentionId: store.createdIntentionId,
    open: store.open,
    close: store.close,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    setStep: store.setStep,
    setCreatedProject: store.setCreatedProject,
    setCreatedIntention: store.setCreatedIntention,
    completeOnboarding,
    skipOnboarding,
  };
}
