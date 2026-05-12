import type { LucideIcon } from "lucide-react";
import {
  Code,
  Palette,
  Megaphone,
  PenTool,
  Settings,
  ShieldCheck,
  Headphones,
  Lightbulb,
  LineChart,
  Users,
  Briefcase,
  Wrench,
  HelpCircle,
} from "lucide-react";

/**
 * Registry de icones disponiveis para times de funcao.
 *
 * Backend persiste apenas o NOME do icone (string) em `DEntidade.dados.icon`.
 * Aqui mapeamos nome -> componente Lucide. Para adicionar novos: importar do
 * lucide-react, adicionar ao TEAM_ICONS, opcionalmente ao TEAM_PRESETS abaixo.
 */
export const TEAM_ICONS: Record<string, LucideIcon> = {
  Code,
  Palette,
  Megaphone,
  PenTool,
  Settings,
  ShieldCheck,
  Headphones,
  Lightbulb,
  LineChart,
  Users,
  Briefcase,
  Wrench,
};

export type TeamIconName = keyof typeof TEAM_ICONS;

/** Resolve nome -> componente. Devolve HelpCircle se o nome nao for conhecido. */
export function resolveTeamIcon(name?: string | null): LucideIcon {
  if (!name) return HelpCircle;
  return TEAM_ICONS[name] ?? HelpCircle;
}

/**
 * Presets de times comuns. Clicar num preset preenche nome+sigla+cor+icone.
 * Usuario pode customizar depois.
 */
export interface TeamPreset {
  label: string;
  name: string;
  key: string;
  color: string;
  icon: TeamIconName;
}

export const TEAM_PRESETS: TeamPreset[] = [
  { label: "Dev", name: "Desenvolvimento", key: "DEV", color: "#3b82f6", icon: "Code" },
  { label: "Design", name: "Design", key: "DSG", color: "#8b5cf6", icon: "Palette" },
  { label: "Marketing", name: "Marketing", key: "MKT", color: "#ec4899", icon: "Megaphone" },
  { label: "Copy", name: "Copy", key: "COPY", color: "#f59e0b", icon: "PenTool" },
  { label: "Ops", name: "Operacoes", key: "OPS", color: "#10b981", icon: "Settings" },
  { label: "QA", name: "QA", key: "QA", color: "#06b6d4", icon: "ShieldCheck" },
  { label: "Suporte", name: "Suporte", key: "SUP", color: "#f43f5e", icon: "Headphones" },
];

/** Lista ordenada de icones disponiveis para o picker do dialog. */
export const TEAM_ICON_NAMES: TeamIconName[] = Object.keys(TEAM_ICONS) as TeamIconName[];
