"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChannelId, ChannelConfigMap } from "@/types/channel";

// ============================================================
// localStorage persistence for channel configuration
// V1: local-only, no backend. Real integrations are V2 scope.
// ============================================================

const STORAGE_KEY = "scrumban:channel-config";

function getDefaultConfig(): ChannelConfigMap {
  return {
    web: { enabled: true, fields: {} }, // WEB is always enabled (default channel)
    whatsapp: { enabled: false, fields: {} },
    email: { enabled: false, fields: {} },
    slack: { enabled: false, fields: {} },
    api: { enabled: false, fields: {} },
    telegram: { enabled: true, fields: {} }, // sempre ativo no nivel da org;
    // o vinculo individual e feito por usuario em Perfil > Canais conectados
  };
}

function loadConfig(): ChannelConfigMap {
  if (typeof window === "undefined") return getDefaultConfig();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultConfig();
    const parsed = JSON.parse(stored) as Partial<ChannelConfigMap>;
    // Merge com defaults para entradas novas (ex.: telegram adicionado depois)
    const merged = { ...getDefaultConfig(), ...parsed } as ChannelConfigMap;
    // Garante que canais default estejam sempre ativos
    merged.web = { ...merged.web, enabled: true };
    merged.telegram = { ...merged.telegram, enabled: true };
    return merged;
  } catch {
    return getDefaultConfig();
  }
}

function persistConfig(config: ChannelConfigMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage full or unavailable -- silent fallback to ephemeral state
  }
}

export function useChannelConfig() {
  const [config, setConfig] = useState<ChannelConfigMap>(loadConfig);

  // Persist every time config changes
  useEffect(() => {
    persistConfig(config);
  }, [config]);

  const toggleChannel = useCallback((id: ChannelId) => {
    // Canais "default" (web, telegram) nao podem ser desligados aqui
    if (id === "web" || id === "telegram") return;
    setConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }, []);

  const updateField = useCallback(
    (id: ChannelId, key: string, value: string) => {
      setConfig((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          fields: { ...prev[id].fields, [key]: value },
        },
      }));
    },
    [],
  );

  const resetChannel = useCallback((id: ChannelId) => {
    setConfig((prev) => ({
      ...prev,
      [id]: { enabled: id === "web" || id === "telegram", fields: {} },
    }));
  }, []);

  const getChannelStatus = useCallback(
    (id: ChannelId): "active" | "inactive" => {
      return config[id].enabled ? "active" : "inactive";
    },
    [config],
  );

  return {
    config,
    toggleChannel,
    updateField,
    resetChannel,
    getChannelStatus,
  };
}
