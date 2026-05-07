"use client";

import {
  Inbox,
  CircleDot,
  FileText,
  Box,
  Layers,
  Users,
  Building2,
  GripVertical,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSidebarCustomization,
  type ItemVisibility,
  type SidebarItemKey,
  type BadgeStyle,
} from "@/lib/hooks/use-sidebar-customization";
import { cn } from "@/lib/utils";

interface CustomizeSidebarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SidebarItemConfig {
  key: SidebarItemKey;
  label: string;
  icon: LucideIcon;
  /** Item nao tem rota real — fica no modal pra fidelidade visual */
  decorative?: boolean;
  hint?: string;
}

const PERSONAL_ITEMS: SidebarItemConfig[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "myIssues", label: "Minhas issues", icon: CircleDot },
  {
    key: "drafts",
    label: "Rascunhos",
    icon: FileText,
    decorative: true,
    hint: "Sem rota /drafts no schema",
  },
];

const WORKSPACE_ITEMS: SidebarItemConfig[] = [
  { key: "projects", label: "Projetos", icon: Box },
  { key: "views", label: "Views", icon: Layers },
  { key: "members", label: "Membros", icon: Users },
  {
    key: "teams",
    label: "Times",
    icon: Building2,
    decorative: true,
    hint: "Gap #1 — Times nao existem",
  },
];

const VISIBILITY_OPTIONS: { value: ItemVisibility; label: string }[] = [
  { value: "always", label: "Sempre mostrar" },
  { value: "showWhenBadged", label: "Mostrar com badge" },
  { value: "hide", label: "Nao mostrar" },
];

const BADGE_OPTIONS: { value: BadgeStyle; label: string; preview: string }[] = [
  { value: "count", label: "Contagem", preview: "1" },
  { value: "dot", label: "Ponto", preview: "•" },
  { value: "none", label: "Nenhum", preview: "—" },
];

export function CustomizeSidebarModal({
  open,
  onOpenChange,
}: CustomizeSidebarModalProps) {
  const { state, setBadgeStyle, setVisibility } = useSidebarCustomization();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-medium">Personalizar sidebar</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-auto">
          {/* Default badge style */}
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[13px] font-medium">
                Estilo padrao do badge
              </span>
              <Select
                value={state.badgeStyle}
                onValueChange={(v) => setBadgeStyle(v as BadgeStyle)}
              >
                <SelectTrigger className="h-8 min-w-[110px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[12px]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-muted-foreground w-3 text-right">
                          {opt.preview}
                        </span>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal */}
          <Section title="Pessoal">
            {PERSONAL_ITEMS.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                value={state.visibility[item.key]}
                onChange={(v) => setVisibility(item.key, v)}
              />
            ))}
          </Section>

          {/* Workspace */}
          <Section title="Workspace">
            {WORKSPACE_ITEMS.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                value={state.visibility[item.key]}
                onChange={(v) => setVisibility(item.key, v)}
              />
            ))}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-[13px] font-medium text-foreground/90">{title}</h3>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function ItemRow({
  item,
  value,
  onChange,
}: {
  item: SidebarItemConfig;
  value: ItemVisibility;
  onChange: (v: ItemVisibility) => void;
}) {
  const Icon = item.icon;
  const dimmed = value === "hide";

  return (
    <div
      title={item.hint}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0",
        dimmed && "opacity-60",
      )}
    >
      <button
        type="button"
        title="Reordenar (em breve)"
        aria-label="Reordenar"
        className="flex h-5 w-3 items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <Icon className="h-3.5 w-3.5 text-foreground/80 shrink-0" />
      <span className="flex-1 text-[13px] truncate">
        {item.label}
        {item.decorative && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/70">
            (so visual)
          </span>
        )}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as ItemVisibility)}>
        <SelectTrigger className="h-7 min-w-[140px] text-[12px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-[12px]"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
