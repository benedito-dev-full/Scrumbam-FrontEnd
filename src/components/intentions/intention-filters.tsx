"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import type { IntentionFilters } from "@/types/intention";
import { useProjects } from "@/lib/hooks/use-projects";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);

  // Count active filters (excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.priority && filters.priority !== "all") count++;
    if (filters.type && filters.type !== "all") count++;
    if (filters.canal && filters.canal !== "all") count++;
    if (filters.projectSlug && filters.projectSlug !== "all") count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-2">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar intencoes..."
            value={filters.searchTerm ?? ""}
            onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
            className="pl-9 w-full sm:w-[200px] h-9"
          />
        </div>

        {/* Mobile: filter toggle button */}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Mostrar filtros"
          >
            <Filter className="h-4 w-4" />
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        )}

        {/* Desktop: inline selects */}
        {!isMobile && <FilterSelects filters={filters} onChange={onChange} projects={projects} />}
      </div>

      {/* Mobile: expandable filter grid */}
      {isMobile && showFilters && (
        <div className="grid grid-cols-2 gap-2">
          <FilterSelects filters={filters} onChange={onChange} projects={projects} isMobileGrid />
        </div>
      )}
    </div>
  );
}

// Extracted filter selects to avoid duplication
function FilterSelects({
  filters,
  onChange,
  projects,
  isMobileGrid,
}: {
  filters: IntentionFilters;
  onChange: (filters: IntentionFilters) => void;
  projects: Array<{ chave: string; nome: string }> | undefined;
  isMobileGrid?: boolean;
}) {
  const triggerClass = isMobileGrid ? "w-full" : "";

  return (
    <>
      {/* Status V3 */}
      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as IntentionFilters["status"] })
        }
      >
        <SelectTrigger size="sm" className={isMobileGrid ? triggerClass : "w-[140px]"}>
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
        <SelectTrigger size="sm" className={isMobileGrid ? triggerClass : "w-[130px]"}>
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
        <SelectTrigger size="sm" className={isMobileGrid ? triggerClass : "w-[130px]"}>
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
        <SelectTrigger size="sm" className={isMobileGrid ? triggerClass : "w-[140px]"}>
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
        <SelectTrigger size="sm" className={isMobileGrid ? triggerClass : "w-[160px]"}>
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
    </>
  );
}
