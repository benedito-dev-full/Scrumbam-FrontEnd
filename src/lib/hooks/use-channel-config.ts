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
  };
}

function loadConfig(): ChannelConfigMap {
  if (typeof window === "undefined") return getDefaultConfig();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultConfig();
    const parsed = JSON.parse(stored) as ChannelConfigMap;
    // Ensure WEB is always enabled (guard against tampered localStorage)
    parsed.web = { ...parsed.web, enabled: true };
    return parsed;
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
    // WEB cannot be toggled off
    if (id === "web") return;
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
      [id]: { enabled: id === "web", fields: {} },
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
