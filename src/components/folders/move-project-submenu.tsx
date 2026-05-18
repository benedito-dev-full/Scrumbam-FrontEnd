"use client";

import { Folder, FolderMinus, FolderInput } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useFolders,
  useMoveProjectToFolder,
  useRemoveProjectFromFolder,
} from "@/lib/hooks/use-folders";

interface MoveProjectSubmenuProps {
  projectId: string;
  projectName: string;
  /**
   * ID da pasta atual do projeto, ou `null` se o projeto está no "limbo"
   * (Sem pasta). Usado para (a) filtrar a pasta atual da lista (não faz
   * sentido mover para a mesma) e (b) saber qual vínculo soft-deletar
   * quando o destino é "Sem pasta".
   */
  currentFolderId: string | null;
}

/**
 * Submenu "Mover para…" exibido dentro do dropdown de ações de um projeto.
 *
 * Lista todas as pastas da org (exceto a atual) + "Sem pasta" no fim
 * quando o projeto pertence a alguma pasta.
 *
 * Comportamento:
 * - Destino = pasta real → POST /entidades/folders/:dst/projects/:projectId
 *   (rota é atômica: soft-deleta vínculo anterior se houver e cria o novo).
 * - Destino = "Sem pasta" → DELETE /entidades/folders/:currentFolderId/projects/:projectId
 *   (soft-deleta o vínculo atual; projeto cai no limbo).
 *
 * Quando não há outras pastas disponíveis (org com apenas a pasta atual e
 * projeto fora do limbo é impossível, mas o caso "projeto no limbo + zero
 * pastas reais" exibe estado neutro pedindo pra criar pasta primeiro).
 */
export function MoveProjectSubmenu({
  projectId,
  projectName,
  currentFolderId,
}: MoveProjectSubmenuProps) {
  const { data: folders, isLoading } = useFolders();
  const { mutate: moveTo, isPending: isMoving } = useMoveProjectToFolder();
  const { mutate: removeFrom, isPending: isRemoving } =
    useRemoveProjectFromFolder();

  const isPending = isMoving || isRemoving;

  // Lista de pastas reais que podem ser destino (exclui a pasta atual).
  const targets = (folders ?? []).filter((f) => f.id !== currentFolderId);

  const handleMove = (folderId: string, targetName: string) => {
    if (isPending) return;
    moveTo({ folderId, projectId, projectName, targetName });
  };

  const handleRemove = () => {
    if (isPending || !currentFolderId) return;
    removeFrom({ folderId: currentFolderId, projectId, projectName });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={isPending}>
        <FolderInput className="mr-2 h-3.5 w-3.5" />
        Mover para…
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        {isLoading ? (
          <DropdownMenuItem disabled>Carregando pastas…</DropdownMenuItem>
        ) : targets.length === 0 && !currentFolderId ? (
          <DropdownMenuItem disabled>Crie uma pasta primeiro</DropdownMenuItem>
        ) : (
          <>
            {targets.map((f) => (
              <DropdownMenuItem
                key={f.id}
                disabled={isPending}
                onSelect={(e) => {
                  e.preventDefault();
                  handleMove(f.id, f.nome);
                }}
              >
                <Folder className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{f.nome}</span>
              </DropdownMenuItem>
            ))}
            {currentFolderId && (
              <>
                {targets.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleRemove();
                  }}
                >
                  <FolderMinus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Sem pasta
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
