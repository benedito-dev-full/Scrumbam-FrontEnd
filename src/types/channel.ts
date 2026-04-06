// Channel configuration types -- V1: localStorage only
// Integracoes reais sao escopo V2 do produto (PRD V3, P7)

// ============================================================
// Core Types
// ============================================================

export type ChannelId = "web" | "whatsapp" | "email" | "slack" | "api";

export type ChannelStatus = "active" | "inactive";

export interface ChannelFieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "password" | "readonly";
  colSpan?: 2;
}

export interface ChannelDefinition {
  id: ChannelId;
  name: string;
  icon: string; // Lucide icon name (resolved at component level)
  iconColor: string; // Tailwind class
  description: string;
  fields: ChannelFieldDef[];
  classeId: string; // DClasse ID from seed (-451 to -455)
  isDefault?: boolean; // true for WEB (always active, no toggle)
}

export interface ChannelState {
  enabled: boolean;
  fields: Record<string, string>;
}

// Map of all channels to their state
export type ChannelConfigMap = Record<ChannelId, ChannelState>;
