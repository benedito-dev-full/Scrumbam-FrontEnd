"use client";

import { useState } from "react";
import {
  Globe,
  MessageSquare,
  Mail,
  Hash,
  Code2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Wifi,
  WifiOff,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useChannelConfig } from "@/lib/hooks/use-channel-config";
import type { ChannelId, ChannelFieldDef, ChannelState } from "@/types/channel";

// ============================================================
// Channel definitions (data-driven)
// ============================================================

interface ChannelDef {
  id: ChannelId;
  name: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
  fields: ChannelFieldDef[];
  classeId: string;
  isDefault?: boolean;
}

const CHANNELS: ChannelDef[] = [
  {
    id: "web",
    name: "Web",
    icon: Globe,
    iconColor: "text-blue-500",
    description:
      "Intencoes criadas diretamente pelo formulario web do Scrumban. Canal padrao, sempre ativo.",
    fields: [],
    classeId: "-451",
    isDefault: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    iconColor: "text-green-500",
    description:
      "Receba intencoes via mensagens de WhatsApp. Configure um webhook para captura automatica.",
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://api.whatsapp.com/webhook/...",
        type: "text",
      },
      {
        key: "token",
        label: "Token",
        placeholder: "whsec_...",
        type: "password",
      },
      {
        key: "phoneNumber",
        label: "Numero do telefone",
        placeholder: "+55 11 99999-9999",
        type: "text",
      },
    ],
    classeId: "-452",
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    iconColor: "text-blue-500",
    description:
      "Encaminhe emails para um endereco dedicado. Intencoes serao criadas automaticamente.",
    fields: [
      {
        key: "forwardingAddress",
        label: "Endereco de encaminhamento",
        placeholder: "inbox-a1b2c3@scrumban.devari.com",
        type: "readonly",
      },
      {
        key: "domain",
        label: "Dominio personalizado",
        placeholder: "inbox.suaempresa.com",
        type: "text",
      },
    ],
    classeId: "-453",
  },
  {
    id: "slack",
    name: "Slack",
    icon: Hash,
    iconColor: "text-purple-500",
    description:
      "Integre com um canal Slack. Mensagens marcadas serao convertidas em intencoes.",
    fields: [
      {
        key: "workspaceId",
        label: "Workspace ID",
        placeholder: "T01234567",
        type: "text",
      },
      {
        key: "channelId",
        label: "Channel",
        placeholder: "#produto",
        type: "text",
      },
      {
        key: "botToken",
        label: "Bot Token",
        placeholder: "xoxb-...",
        type: "password",
        colSpan: 2,
      },
    ],
    classeId: "-454",
  },
  {
    id: "api",
    name: "API",
    icon: Code2,
    iconColor: "text-orange-500",
    description:
      "Envie intencoes programaticamente via REST API. Ideal para automacoes e integracoes customizadas.",
    fields: [
      {
        key: "apiEndpoint",
        label: "Endpoint",
        placeholder: "POST /api/v1/tasks (canalId: -455)",
        type: "readonly",
      },
      {
        key: "authHeader",
        label: "Authorization Header",
        placeholder: "Bearer seu_token_jwt",
        type: "password",
      },
    ],
    classeId: "-455",
  },
];

// ============================================================
// ChannelsConfig -- main component
// ============================================================

export function ChannelsConfig() {
  const { config, toggleChannel, updateField } = useChannelConfig();

  return (
    <div className="space-y-4">
      {CHANNELS.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          state={config[channel.id]}
          onToggle={() => toggleChannel(channel.id)}
          onFieldChange={(key, value) => updateField(channel.id, key, value)}
        />
      ))}
    </div>
  );
}

// ============================================================
// ChannelCard -- individual channel config card
// ============================================================

interface ChannelCardProps {
  channel: ChannelDef;
  state: ChannelState;
  onToggle: () => void;
  onFieldChange: (key: string, value: string) => void;
}

function ChannelCard({
  channel,
  state,
  onToggle,
  onFieldChange,
}: ChannelCardProps) {
  const [validating, setValidating] = useState(false);
  const Icon = channel.icon;
  const isEnabled = state.enabled;

  const handleValidate = () => {
    // Basic field validation + honest feedback
    if (channel.fields.length === 0) return;

    const editableFields = channel.fields.filter((f) => f.type !== "readonly");
    const filledFields = editableFields.filter(
      (f) => (state.fields[f.key] ?? "").trim().length > 0,
    );

    if (filledFields.length === 0) {
      toast.error("Preencha pelo menos um campo antes de validar.");
      return;
    }

    setValidating(true);
    // Simulate brief validation delay for UX
    setTimeout(() => {
      setValidating(false);
      toast.info(
        "Configuracao salva localmente. Teste de conexao sera disponivel na V2.",
        { duration: 4000 },
      );
    }, 500);
  };

  return (
    <Card
      className={
        isEnabled ? "border-[var(--scrumban-brand)]/30" : "border-border"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md ${isEnabled ? "bg-[var(--scrumban-brand)]/10" : "bg-muted"}`}
            >
              <Icon
                className={`h-5 w-5 ${isEnabled ? channel.iconColor : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{channel.name}</CardTitle>
                {channel.isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-blue-500 border-blue-500/30 bg-blue-500/10"
                  >
                    Padrao
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {channel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 ${isEnabled ? "text-green-500 border-green-500/30 bg-green-500/10" : "text-muted-foreground"}`}
            >
              {isEnabled ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isEnabled ? "Ativo" : "Inativo"}
            </Badge>
            {!channel.isDefault && (
              <Switch checked={isEnabled} onCheckedChange={onToggle} />
            )}
          </div>
        </div>
      </CardHeader>

      {isEnabled && channel.fields.length > 0 && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {channel.fields.map((field) => (
              <div
                key={field.key}
                className={field.colSpan === 2 ? "sm:col-span-2" : ""}
              >
                <FieldRenderer
                  field={field}
                  value={state.fields[field.key] ?? ""}
                  onChange={(value) => onFieldChange(field.key, value)}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Integracao real disponivel na V2
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={validating}
              className="gap-1.5"
            >
              {validating ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Validar Campos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}

      {isEnabled && channel.fields.length === 0 && channel.isDefault && (
        <CardContent className="border-t pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Canal web ativo por padrao. Intencoes criadas pelo formulario do
            Scrumban usam este canal automaticamente.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================
// Field renderer (data-driven, replaces WhatsAppFields/EmailFields/SlackFields)
// ============================================================

interface FieldRendererProps {
  field: ChannelFieldDef;
  value: string;
  onChange: (value: string) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  if (field.type === "readonly") {
    return <ReadonlyField field={field} />;
  }

  if (field.type === "password") {
    return <PasswordField field={field} value={value} onChange={onChange} />;
  }

  return (
    <FieldRow label={field.label}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="text-sm h-9"
      />
    </FieldRow>
  );
}

function ReadonlyField({ field }: { field: ChannelFieldDef }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(field.placeholder);
    setCopied(true);
    toast.success("Copiado para a area de transferencia");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FieldRow label={field.label}>
      <div className="flex gap-2">
        <Input
          value={field.placeholder}
          readOnly
          className="text-sm h-9 bg-muted font-mono text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-9 w-9 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </FieldRow>
  );
}

function PasswordField({
  field,
  value,
  onChange,
}: {
  field: ChannelFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldRow label={field.label}>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="text-sm h-9 pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </FieldRow>
  );
}

// ============================================================
// Shared field wrapper
// ============================================================

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
