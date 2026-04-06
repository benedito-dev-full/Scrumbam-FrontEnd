"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useCreateIntention } from "@/lib/hooks/use-intentions";
import { useProjects } from "@/lib/hooks/use-projects";
import type { IntentionType, IntentionPriority } from "@/types/intention";
import { TYPE_IDS, PRIORITY_IDS } from "@/types/intention";

/**
 * @deprecated Mantido apenas para compatibilidade com wizard-step-*.tsx
 * que nao foram deletados. Nao usar em codigo novo.
 */
export interface WizardFormData {
  title: string;
  problema: string;
  contexto: string;
  solucaoProposta: string;
  criteriosAceite: string[];
  naoObjetivos: string[];
  riscos: string[];
  type: IntentionType;
  priority: IntentionPriority;
  apetiteDias: number;
}

const TASK_TYPES = [
  { id: TYPE_IDS.FEATURE, label: "Feature" },
  { id: TYPE_IDS.BUG, label: "Bug" },
  { id: TYPE_IDS.IMPROVEMENT, label: "Melhoria" },
] as const;

const PRIORITIES = [
  { id: PRIORITY_IDS.URGENT, label: "Urgente" },
  { id: PRIORITY_IDS.HIGH, label: "Alta" },
  { id: PRIORITY_IDS.MEDIUM, label: "Media" },
  { id: PRIORITY_IDS.LOW, label: "Baixa" },
] as const;

const MIN_DESCRIPTION_LENGTH = 20;

export function IntentionWizard() {
  usePageTitle("Nova Intencao");
  const router = useRouter();
  const createIntention = useCreateIntention();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskTypeId, setTaskTypeId] = useState<string>(TYPE_IDS.FEATURE);
  const [priorityId, setPriorityId] = useState<string>(PRIORITY_IDS.MEDIUM);
  const [projectId, setProjectId] = useState<string>("");

  // Pre-selecionar o primeiro projeto quando carregar
  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].chave);
    }
  }, [projects, projectId]);

  const descriptionTooShort =
    description.trim().length > 0 &&
    description.trim().length < MIN_DESCRIPTION_LENGTH;

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    projectId.length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;

    await createIntention.mutate({
      title: title.trim(),
      description: description.trim(),
      taskTypeId,
      priorityId,
      projectId,
    });

    router.push("/intentions");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      canSubmit &&
      !createIntention.isPending
    ) {
      e.preventDefault();
      handleCreate();
    }
  };

  const isSaving = createIntention.isPending;

  return (
    <PageTransition className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/intentions")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Nova Intencao</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descreva rapidamente o que precisa ser feito.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5" onKeyDown={handleKeyDown}>
        {/* Titulo */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Titulo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Ex: Corrigir bug no login"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Descricao */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Descricao <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Descreva o problema ou o que precisa ser feito (minimo 20 caracteres)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          {descriptionTooShort && (
            <p className="text-xs text-destructive">
              Minimo {MIN_DESCRIPTION_LENGTH} caracteres (
              {description.trim().length}/{MIN_DESCRIPTION_LENGTH})
            </p>
          )}
        </div>

        {/* Tipo + Prioridade side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={taskTypeId} onValueChange={setTaskTypeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priorityId} onValueChange={setPriorityId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projeto */}
        <div className="space-y-2">
          <Label>
            Projeto <span className="text-destructive">*</span>
          </Label>
          <Select
            value={projectId}
            onValueChange={setProjectId}
            disabled={isLoadingProjects}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  isLoadingProjects ? "Carregando..." : "Selecione o projeto"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(projects ?? []).map((p) => (
                <SelectItem key={p.chave} value={p.chave}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleCreate} disabled={!canSubmit || isSaving}>
          <Plus className="h-4 w-4 mr-1" />
          {isSaving ? "Criando..." : "Criar Intencao"}
        </Button>
      </div>
    </PageTransition>
  );
}
