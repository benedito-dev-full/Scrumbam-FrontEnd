"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectsApi } from "@/lib/api/projects";
import { toast } from "sonner";

interface CreateProjectStepProps {
  onNext: () => void;
  onSkip: () => void;
  onProjectCreated: (id: string, name: string) => void;
  createdProjectId: string | null;
  createdProjectName: string | null;
}

export function CreateProjectStep({
  onNext,
  onSkip,
  onProjectCreated,
  createdProjectId,
  createdProjectName,
}: CreateProjectStepProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const alreadyCreated = !!createdProjectId;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const project = await projectsApi.create({ nome: name.trim() });
      onProjectCreated(project.chave, project.nome);
      toast.success("Projeto criado!");
      // Auto-advance after brief delay to show success
      setTimeout(() => onNext(), 800);
    } catch {
      toast.error("Erro ao criar projeto. Tente novamente.");
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
        className="mb-6 rounded-full bg-blue-500/10 p-5"
      >
        {alreadyCreated ? (
          <Check className="h-10 w-10 text-emerald-500" />
        ) : (
          <FolderPlus className="h-10 w-10 text-blue-500" />
        )}
      </motion.div>

      <h2 className="text-xl font-bold tracking-tight">
        {alreadyCreated ? "Projeto criado!" : "Crie seu primeiro projeto"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {alreadyCreated
          ? `"${createdProjectName}" esta pronto. Vamos criar sua primeira intencao.`
          : "Um projeto agrupa suas intencoes. Pode ser o nome da sua empresa, equipe ou produto."}
      </p>

      {!alreadyCreated ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 w-full max-w-xs space-y-3"
        >
          <div className="text-left">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Nome do projeto
            </Label>
            <Input
              id="project-name"
              placeholder="Ex: Minha Empresa, App Mobile..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleCreate();
              }}
              className="mt-1.5"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
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
                Criar projeto
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
          className="mt-6"
        >
          <Button onClick={onNext} size="lg" className="gap-2">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
