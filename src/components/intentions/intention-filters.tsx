"use client";

import { Search } from "lucide-react";
import type { IntentionFilters } from "@/types/intention";
import { useProjects } from "@/lib/hooks/use-projects";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  filters: IntentionFilters;
  onChange: (filters: IntentionFilters) => void;
}

export function IntentionFiltersBar({ filters, onChange }: Props) {
  const { data: projects } = useProjects();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar intencoes..."
          value={filters.searchTerm ?? ""}
          onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
          className="pl-9 w-[200px] h-9"
        />
      </div>

      {/* Status V3 */}
      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as IntentionFilters["status"] })
        }
      >
        <SelectTrigger size="sm" className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          <SelectItem value="inbox">Inbox</SelectItem>
          <SelectItem value="ready">Ready</SelectItem>
          <SelectItem value="executing">Executando</SelectItem>
          <SelectItem value="done">Concluida</SelectItem>
          <SelectItem value="failed">Falhou</SelectItem>
          <SelectItem value="validating">Validando</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority ?? "all"}
        onValueChange={(v) =>
          onChange({ ...filters, priority: v as IntentionFilters["priority"] })
        }
      >
        <SelectTrigger size="sm" className="w-[130px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="urgent">Urgente</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Media</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
        </SelectContent>
      </Select>

      {/* Type */}
      <Select
        value={filters.type ?? "all"}
        onValueChange={(v) =>
          onChange({ ...filters, type: v as IntentionFilters["type"] })
        }
      >
        <SelectTrigger size="sm" className="w-[130px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="feature">Feature</SelectItem>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="improvement">Melhoria</SelectItem>
        </SelectContent>
      </Select>

      {/* Canal V3 */}
      <Select
        value={filters.canal ?? "all"}
        onValueChange={(v) =>
          onChange({ ...filters, canal: v as IntentionFilters["canal"] })
        }
      >
        <SelectTrigger size="sm" className="w-[140px]">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Canais</SelectItem>
          <SelectItem value="web">Web</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="slack">Slack</SelectItem>
          <SelectItem value="api">API</SelectItem>
        </SelectContent>
      </Select>

      {/* Projeto V3 (real do backend) */}
      <Select
        value={filters.projectSlug ?? "all"}
        onValueChange={(v) => onChange({ ...filters, projectSlug: v })}
      >
        <SelectTrigger size="sm" className="w-[160px]">
          <SelectValue placeholder="Projeto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Projetos</SelectItem>
          {projects?.map((p) => (
            <SelectItem key={p.chave} value={p.chave}>
              {p.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
