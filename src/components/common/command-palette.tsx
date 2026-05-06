"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FolderOpen,
  Users,
  Plus,
  BarChart3,
  Settings,
  Loader2,
  PieChart,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/lib/hooks/use-search";

/**
 * CommandPalette - Global search dialog (Cmd+K / Ctrl+K)
 *
 * Features:
 * - Opens with Cmd+K (Mac) / Ctrl+K (Windows)
 * - Debounced search (300ms via useDeferredValue)
 * - Results grouped by category (Tasks, Projects, People)
 * - Quick actions when empty (create intention, dashboard, etc.)
 * - Keyboard navigation (built-in from cmdk)
 * - Click navigates to the relevant page
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const deferredQuery = useDeferredValue(inputValue);
  const router = useRouter();

  const { data, isLoading, isFetching } = useSearch(deferredQuery);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset input when dialog closes
  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (callback: () => void) => {
      setOpen(false);
      callback();
    },
    [],
  );

  const hasQuery = deferredQuery.length >= 2;
  const hasResults = data && data.counts.total > 0;
  const showLoading = hasQuery && (isLoading || isFetching);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar intencoes, projetos, pessoas..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        {/* Loading state */}
        {showLoading && !hasResults && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando...
          </div>
        )}

        {/* Empty state when searching */}
        {hasQuery && !showLoading && !hasResults && (
          <CommandEmpty>
            Nenhum resultado para &quot;{deferredQuery}&quot;
          </CommandEmpty>
        )}

        {/* Search results */}
        {hasQuery && hasResults && (
          <>
            {/* Tasks */}
            {data.results.tasks.length > 0 && (
              <CommandGroup heading="Intencoes">
                {data.results.tasks.map((task) => (
                  <CommandItem
                    key={`task-${task.id}`}
                    value={`task-${task.id}-${task.name}`}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(`/intentions/${task.project.id}`),
                      )
                    }
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="truncate">{task.name}</span>
                      <StatusBadge code={task.status.code} name={task.status.name} />
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {task.project.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Projects */}
            {data.results.projects.length > 0 && (
              <CommandGroup heading="Projetos">
                {data.results.projects.map((project) => (
                  <CommandItem
                    key={`project-${project.id}`}
                    value={`project-${project.id}-${project.name}`}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(`/intentions/${project.id}`),
                      )
                    }
                  >
                    <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {project.taskCount} intencoes
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* People */}
            {data.results.people.length > 0 && (
              <CommandGroup heading="Pessoas">
                {data.results.people.map((person) => (
                  <CommandItem
                    key={`person-${person.id}`}
                    value={`person-${person.id}-${person.name}`}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push("/settings/workspace/members"),
                      )
                    }
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="truncate">{person.name}</span>
                      {person.role && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {person.role.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    {person.email && (
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {person.email}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search time footer */}
            {data.searchTimeMs !== undefined && (
              <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
                {data.counts.total} resultados em {data.searchTimeMs}ms
              </div>
            )}
          </>
        )}

        {/* Quick actions (shown when no query) */}
        {!hasQuery && (
          <>
            <CommandGroup heading="Acoes Rapidas">
              <CommandItem
                onSelect={() =>
                  handleSelect(() => router.push("/intentions/new"))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar intencao
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() => router.push("/intentions/inbox"))
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Inbox
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navegacao">
              <CommandItem
                onSelect={() =>
                  handleSelect(() => router.push("/projects"))
                }
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Projetos
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() =>
                    router.push("/settings/workspace/members"),
                  )
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Members
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() => router.push("/settings"))
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Small status badge with color coding based on status code */
function StatusBadge({ code, name }: { code: string; name: string }) {
  const colorMap: Record<string, string> = {
    inbox: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    ready: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    executing: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    validating: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    validated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    discarded: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  const colorClass = colorMap[code.toLowerCase()] ?? colorMap.inbox;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      {name}
    </span>
  );
}
