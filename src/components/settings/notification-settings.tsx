"use client";

import { useState } from "react";
import { Bell, Send, Hash, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useConfigureNotification,
  useTestNotification,
} from "@/lib/hooks/use-notifications";
import type { NotificationType } from "@/types";

const CHANNEL_CONFIG: Record<
  NotificationType,
  {
    label: string;
    icon: typeof Hash;
    placeholder: string;
    fieldLabel: string;
    fieldKey: "webhookUrl" | "apiKey";
  }
> = {
  slack: {
    label: "Slack",
    icon: Hash,
    placeholder: "https://hooks.slack.com/services/...",
    fieldLabel: "Webhook URL",
    fieldKey: "webhookUrl",
  },
  discord: {
    label: "Discord",
    icon: MessageCircle,
    placeholder: "https://discord.com/api/webhooks/...",
    fieldLabel: "Webhook URL",
    fieldKey: "webhookUrl",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: Send,
    placeholder: "whatsapp-api-key-xxx",
    fieldLabel: "API Key",
    fieldKey: "apiKey",
  },
};

function NotificationChannelCard({ type }: { type: NotificationType }) {
  const config = CHANNEL_CONFIG[type];
  const IconComponent = config.icon;
  const configure = useConfigureNotification();
  const testNotification = useTestNotification();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!value.trim()) return;
    const dto =
      config.fieldKey === "webhookUrl"
        ? { type, webhookUrl: value.trim() }
        : { type, apiKey: value.trim() };
    configure.mutate(dto, {
      onSuccess: () => setSaved(true),
    });
  };

  const handleTest = () => {
    testNotification.mutate({ type });
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-primary/10 p-2">
            <IconComponent className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{config.label}</p>
          </div>
          {saved && (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
            >
              Configurado
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{config.fieldLabel}</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-sm"
              type={config.fieldKey === "apiKey" ? "password" : "text"}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={handleSave}
              disabled={!value.trim() || configure.isPending}
            >
              {configure.isPending ? "..." : "Salvar"}
            </Button>
          </div>
          {saved && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleTest}
              disabled={testNotification.isPending}
            >
              <Send className="h-3 w-3 mr-1" />
              {testNotification.isPending ? "Enviando..." : "Testar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificacoes
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure webhooks para receber alertas em tempo real
        </p>
      </div>
      <div className="space-y-3">
        {(Object.keys(CHANNEL_CONFIG) as NotificationType[]).map((type) => (
          <NotificationChannelCard key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
