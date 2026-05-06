"use client";

import { useMemo, useState } from "react";
import { Search, Download, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useOrgMembers,
  useRemoveOrgMember,
  useUpdateMemberRole,
} from "@/lib/hooks/use-organization";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteWorkspaceModal } from "@/components/settings/invite-workspace-modal";
import { cn } from "@/lib/utils";
import type { OrgMember, OrgRole } from "@/types";

type RoleFilter = "all" | "ADMIN" | "MEMBER" | "VIEWER";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ADMIN", label: "Admins" },
  { value: "MEMBER", label: "Members" },
  { value: "VIEWER", label: "Viewers" },
];

export default function MembersPage() {
  usePageTitle("Members");
  const { user } = useAuth();
  const orgId = user?.orgId;
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const { data: members, isLoading } = useOrgMembers(orgId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = members ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((m) => {
      if (filter !== "all" && m.role !== filter) return false;
      if (q) {
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, search, filter]);

  const exportCsv = () => {
    if (!members?.length) {
      toast.warning("Sem membros para exportar");
      return;
    }
    const header = "Name,Email,Role,Joined\n";
    const rows = members
      .map(
        (m) =>
          `"${m.name.replace(/"/g, '""')}","${m.email}","${m.role}","${m.createdAt}"`,
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${user?.orgNome ?? "workspace"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="h-8 pl-8 text-[13px]"
                />
              </div>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as RoleFilter)}
              >
                <SelectTrigger className="h-8 w-[100px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTERS.map((f) => (
                    <SelectItem
                      key={f.value}
                      value={f.value}
                      className="text-[12px]"
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="text-[12px] h-8"
              >
                <Download className="mr-1.5 h-3 w-3" />
                Export CSV
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setInviteOpen(true)}
                  className="text-[12px] h-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Invite
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_100px_80px_90px_90px_28px] items-center gap-3 border-b border-border px-3 py-2 text-[11px] font-medium text-muted-foreground">
              <div>Name</div>
              <div>Email</div>
              <div>Status</div>
              <div>Teams</div>
              <div>Joined</div>
              <div>Last seen</div>
              <div></div>
            </div>

            {isLoading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <div className="px-3 py-12 text-center text-[13px] text-muted-foreground">
                Nenhum membro encontrado.
              </div>
            ) : (
              <>
                <GroupHeader label="Active" count={filtered.length} />
                {filtered.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    orgId={orgId}
                    isAdmin={isAdmin}
                    isSelf={m.id === user?.entidadeId}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <InviteWorkspaceModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </PageTransition>
  );
}

// ============================================================
// Member row
// ============================================================

function MemberRow({
  member: m,
  orgId,
  isAdmin,
  isSelf,
}: {
  member: OrgMember;
  orgId: string | undefined;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveOrgMember(orgId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const initials = m.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const usernameSlug = m.name
    .split(" ")[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const joined = new Date(m.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const handleRoleChange = (newRole: OrgRole) => {
    if (newRole === m.role) return;
    updateRole.mutate({ userId: m.id, role: newRole });
  };

  return (
    <>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_100px_80px_90px_90px_28px] items-center gap-3 border-b border-border/40 px-3 py-2 text-[13px] hover:bg-accent/30 transition-colors">
        {/* Name + initials + username */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{m.name}</p>
            <p
              className="truncate text-[11px] text-muted-foreground"
              title="Gap #25 — username derivado do nome"
            >
              {usernameSlug}
            </p>
          </div>
        </div>

        {/* Email */}
        <span className="truncate text-[12px] text-muted-foreground">
          {m.email}
        </span>

        {/* Role badge */}
        <RoleBadge role={m.role} />

        {/* Teams */}
        <span
          className="text-[12px] text-muted-foreground"
          title="Gap #1 — Teams nao existe"
        >
          1 team
        </span>

        {/* Joined */}
        <span className="text-[12px] text-muted-foreground">{joined}</span>

        {/* Last seen */}
        <span
          className="text-[12px] text-muted-foreground/70"
          title="Gap #34 — sem last seen / presence"
        >
          —
        </span>

        {/* Actions */}
        <div>
          {isAdmin && !isSelf ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Mais opcoes"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  className="text-[12px]"
                  disabled={m.role === "ADMIN" || updateRole.isPending}
                  onClick={() => handleRoleChange("ADMIN")}
                >
                  Tornar Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[12px]"
                  disabled={m.role === "MEMBER" || updateRole.isPending}
                  onClick={() => handleRoleChange("MEMBER")}
                >
                  Tornar Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[12px]"
                  disabled={m.role === "VIEWER" || updateRole.isPending}
                  onClick={() => handleRoleChange("VIEWER")}
                >
                  Tornar Viewer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[12px] text-destructive focus:text-destructive"
                  onClick={() => setConfirmRemove(true)}
                >
                  Remover do workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover do workspace?</DialogTitle>
            <DialogDescription>
              <strong>{m.name}</strong> perdera acesso ao workspace e a todos
              os projetos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(false)}
              className="text-[12px]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                removeMember.mutate(m.id, {
                  onSuccess: () => setConfirmRemove(false),
                })
              }
              disabled={removeMember.isPending}
              className="text-[12px]"
            >
              {removeMember.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Sim, remover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleBadge({ role }: { role: OrgRole }) {
  const config: Record<OrgRole, string> = {
    ADMIN: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    MEMBER: "bg-muted text-foreground/80 border-border",
    VIEWER: "bg-muted/60 text-muted-foreground border-border",
  };
  const label = role.charAt(0) + role.slice(1).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium w-fit",
        config[role],
      )}
    >
      {label}
    </span>
  );
}

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground bg-card/40 border-b border-border/40">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">{count}</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      <GroupHeader label="Active" count={0} />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_100px_80px_90px_90px_28px] items-center gap-3 border-b border-border/40 px-3 py-2 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="space-y-1 flex-1">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2 w-16 bg-muted rounded" />
            </div>
          </div>
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-4 w-14 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div />
        </div>
      ))}
    </>
  );
}

