"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Check, Loader2, ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tasksApi } from "@/lib/api/tasks";
import { toast } from "sonner";

interface CreateIntentionStepProps {
  onNext: () => void;
  onSkip: () => void;
  onIntentionCreated: (id: string) => void;
  createdProjectId: string | null;
  createdIntentionId: string | null;
}

export function CreateIntentionStep({
  onNext,
  onSkip,
  onIntentionCreated,
  createdProjectId,
  createdIntentionId,
}: CreateIntentionStepProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const alreadyCreated = !!createdIntentionId;

  const handleCreate = async () => {
    if (!title.trim() || !createdProjectId) return;
    setIsCreating(true);
    try {
      const task = await tasksApi.create({
        titulo: title.trim(),
        descricao: description.trim() || undefined,
        idProject: createdProjectId,
      });
      onIntentionCreated(task.chave);
      toast.success("Intencao criada no INBOX!");
      setTimeout(() => onNext(), 800);
    } catch {
      toast.error("Erro ao criar intencao. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

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
        className="mb-6 rounded-full bg-violet-500/10 p-5"
      >
        {alreadyCreated ? (
          <Check className="h-10 w-10 text-emerald-500" />
        ) : (
          <MessageSquarePlus className="h-10 w-10 text-violet-500" />
        )}
      </motion.div>

      <h2 className="text-xl font-bold tracking-tight">
        {alreadyCreated
          ? "Intencao registrada!"
          : "Registre sua primeira intencao"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {alreadyCreated
          ? "Sua intencao esta no INBOX, pronta para ser refinada quando voce quiser."
          : "Diga o que precisa ser feito. Nao precisa de detalhes agora — voce refina depois."}
      </p>

      {!alreadyCreated ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 w-full max-w-xs space-y-3"
        >
          <div className="text-left">
            <Label htmlFor="intention-title" className="text-sm font-medium">
              O que precisa ser feito?
            </Label>
            <Input
              id="intention-title"
              placeholder="Ex: Melhorar pagina de login"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <div className="text-left">
            <Label
              htmlFor="intention-description"
              className="text-sm font-medium"
            >
              Algum contexto? <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="intention-description"
              placeholder="Ex: Usuarios reclamam que o login e confuso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[72px] resize-none"
              disabled={isCreating}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="w-full gap-2"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                Registrar intencao
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full"
          >
            Pular tutorial
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 space-y-4"
        >
          {/* Visual INBOX indicator */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-left max-w-xs">
            <Inbox className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Status: <strong className="text-foreground">INBOX</strong> — voce
              decide quando mover para READY.
            </p>
          </div>
          <Button onClick={onNext} size="lg" className="gap-2">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
