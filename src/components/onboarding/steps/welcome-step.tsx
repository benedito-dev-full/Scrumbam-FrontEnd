"use client";

import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
  userName?: string;
}

export function WelcomeStep({ onNext, onSkip, userName }: WelcomeStepProps) {
  const firstName = userName?.split(" ")[0] || "voce";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center px-2"
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 rounded-full bg-primary/10 p-5"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold tracking-tight"
      >
        Bem-vindo ao Scrumban, {firstName}!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 text-muted-foreground max-w-sm leading-relaxed"
      >
        Vamos configurar tudo em <strong>2 minutos</strong>. O Scrumban vai te
        ajudar a organizar o trabalho da sua equipe de forma simples.
      </motion.p>

      {/* Key concept */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-start gap-3 rounded-lg border bg-muted/50 p-4 text-left max-w-sm"
      >
        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">O que e uma intencao?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            No Scrumban, voce registra <strong>intencoes</strong> — o que precisa
            ser feito. Nao se preocupe com detalhes agora, voce refina depois.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex flex-col gap-3 w-full max-w-xs"
      >
        <Button onClick={onNext} size="lg" className="w-full gap-2">
          Comecar
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          Pular tutorial
        </Button>
      </motion.div>
    </motion.div>
  );
}
