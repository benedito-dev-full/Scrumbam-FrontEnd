"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTeam, useUpdateTeam } from "@/lib/hooks/use-teams";
import type { Team } from "@/types/team";
import {
  TEAM_ICON_NAMES,
  TEAM_PRESETS,
  resolveTeamIcon,
  type TeamIconName,
} from "@/lib/team-icons";
import { cn } from "@/lib/utils";

const COLOR_PALETTE = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
];

interface TeamFormDialogProps {
  /** Se presente, abre em modo edicao. Senao, modo criacao. */
  team?: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (team: Team) => void;
}

/**
 * Dialog de criar/editar time.
 *
 * Validacao:
 *  - name: 2-50 chars
 *  - key: 2-6 chars maiusculos (ex: "DEV", "OPS", "QA")
 *  - color: opcional, paleta fixa
 */
export function TeamFormDialog({
  team,
  open,
  onOpenChange,
  onSuccess,
}: TeamFormDialogProps) {
  const isEdit = !!team;
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<TeamIconName | null>(null);

  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset / hidrata ao abrir
  useEffect(() => {
    if (!open) return;
    if (team) {
      setName(team.name);
      setKey(team.key);
      setColor(team.color);
      setIcon((team.icon as TeamIconName | null) ?? null);
    } else {
      setName("");
      setKey("");
      setColor(COLOR_PALETTE[0]);
      setIcon(null);
    }
  }, [open, team]);

  const applyPreset = (preset: (typeof TEAM_PRESETS)[number]) => {
    setName(preset.name);
    setKey(preset.key);
    setColor(preset.color);
    setIcon(preset.icon);
  };

  const trimmedName = name.trim();
  const trimmedKey = key.trim().toUpperCase();
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 50;
  const keyValid = /^[A-Z]{2,6}$/.test(trimmedKey);
  const canSubmit = nameValid && keyValid && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const dto = {
      name: trimmedName,
      key: trimmedKey,
      color: color ?? null,
      icon: icon ?? null,
    };

    if (isEdit && team) {
      updateMutation.mutate(
        { id: team.id, dto },
        {
          onSuccess: (updated) => {
            onOpenChange(false);
            onSuccess?.(updated);
          },
        },
      );
    } else {
      createMutation.mutate(dto, {
        onSuccess: (created) => {
          onOpenChange(false);
          onSuccess?.(created);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar time" : "Novo time de funcao"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Atualize nome, sigla, cor ou icone do time."
                : "Times representam funcoes da equipe — Dev, Design, Marketing, Copy, etc."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isEdit && (
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Sugestoes
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEAM_PRESETS.map((preset) => {
                    const PresetIcon = resolveTeamIcon(preset.icon);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        <span
                          aria-hidden
                          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px]"
                          style={{ backgroundColor: preset.color }}
                        >
                          <PresetIcon className="h-2.5 w-2.5 text-white" />
                        </span>
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Clique pra preencher. Voce pode personalizar tudo depois.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="team-name">Nome</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Desenvolvimento, Marketing, Copy"
                maxLength={50}
                autoFocus
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-key">Sigla</Label>
              <Input
                id="team-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="DEV"
                maxLength={6}
                disabled={isPending}
                className="font-mono uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                2 a 6 letras maiusculas. Prefixo das issues (ex: DEV-1, MKT-1).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    disabled={isPending}
                    aria-label={`Cor ${c}`}
                    className={cn(
                      "h-7 w-7 rounded-md border-2 transition-all",
                      color === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icone</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEAM_ICON_NAMES.map((iconName) => {
                  const IconComp = resolveTeamIcon(iconName);
                  const selected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(selected ? null : iconName)}
                      disabled={isPending}
                      aria-label={`Icone ${iconName}`}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border transition-all",
                        selected
                          ? "border-foreground bg-accent"
                          : "border-border hover:bg-accent/50",
                      )}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Opcional. Clique de novo para remover.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alteracoes"
                  : "Criar time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
