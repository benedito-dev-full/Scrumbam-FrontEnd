"use client";

import { motion } from "framer-motion";
import {
  Inbox,
  ClipboardCheck,
  Play,
  CheckCircle2,
  ArrowRight,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnderstandFlowStepProps {
  onComplete: () => void;
  onSkip: () => void;
  isCompleting: boolean;
}

const flowSteps = [
  {
    icon: Inbox,
    label: "INBOX",
    description: "Intencao registrada",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: ClipboardCheck,
    label: "READY",
    description: "Refinada e pronta",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Play,
    label: "EXECUTING",
    description: "Em andamento",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: CheckCircle2,
    label: "DONE",
    description: "Concluida",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function UnderstandFlowStep({
  onComplete,
  onSkip,
  isCompleting,
}: UnderstandFlowStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center px-2"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        className="mb-6 rounded-full bg-emerald-500/10 p-5"
      >
        <Rocket className="h-10 w-10 text-emerald-500" />
      </motion.div>

      <h2 className="text-xl font-bold tracking-tight">
        Entenda o fluxo
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Suas intencoes passam por 4 etapas. Voce decide quando mover cada uma.
      </p>

      {/* Flow diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 w-full max-w-sm"
      >
        <div className="flex flex-col gap-2">
          {flowSteps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div className={`rounded-full p-2 ${step.bg}`}>
                  <step.icon className={`h-4 w-4 ${step.color}`} />
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="w-px h-4 bg-border" />
                )}
              </div>

              {/* Step info */}
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Arrow for flow */}
              {index < flowSteps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 hidden sm:block" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key takeaway */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-5 text-xs text-muted-foreground max-w-xs italic"
      >
        O Scrumban nao faz nada sozinho — voce decide o ritmo.
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 flex flex-col gap-3 w-full max-w-xs"
      >
        <Button
          onClick={onComplete}
          disabled={isCompleting}
          size="lg"
          className="w-full gap-2"
        >
          {isCompleting ? (
            "Finalizando..."
          ) : (
            <>
              Entendi, vamos comecar!
              <Rocket className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={isCompleting}
        >
          Pular tutorial
        </Button>
      </motion.div>
    </motion.div>
  );
}
