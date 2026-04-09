import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  currentStep: number;
  isOpen: boolean;
  createdProjectId: string | null;
  createdProjectName: string | null;
  createdIntentionId: string | null;
  isCompleting: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  open: () => void;
  close: () => void;
  setCreatedProject: (id: string, name: string) => void;
  setCreatedIntention: (id: string) => void;
  setIsCompleting: (value: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      isOpen: false,
      createdProjectId: null,
      createdProjectName: null,
      createdIntentionId: null,
      isCompleting: false,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setCreatedProject: (id, name) =>
        set({ createdProjectId: id, createdProjectName: name }),
      setCreatedIntention: (id) => set({ createdIntentionId: id }),
      setIsCompleting: (value) => set({ isCompleting: value }),
      reset: () =>
        set({
          currentStep: 0,
          isOpen: false,
          createdProjectId: null,
          createdProjectName: null,
          createdIntentionId: null,
          isCompleting: false,
        }),
    }),
    {
      name: "scrumban-onboarding",
      partialize: (state) => ({
        currentStep: state.currentStep,
        createdProjectId: state.createdProjectId,
        createdProjectName: state.createdProjectName,
        createdIntentionId: state.createdIntentionId,
      }),
    },
  ),
);
