"use client";

import { Building2, Users, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuthStore } from "@/lib/stores/auth-store";
import { OrgGeneral } from "@/components/organization/org-general";
import { OrgMembersFull } from "@/components/organization/org-members-full";
import { OrgMyProfile } from "@/components/organization/org-my-profile";

export default function OrganizationPage() {
  usePageTitle("Organizacao");
  const user = useAuthStore((s) => s.user);
  const orgId = user?.orgId;
  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";

  if (!orgId) {
    return (
      <PageTransition className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizacao</h1>
          <p className="text-sm text-muted-foreground">
            Faca login para acessar a gestao da organizacao
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Organizacao</h1>
          {isAdmin && (
            <Badge
              variant="outline"
              className="text-[10px] border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
            >
              Admin
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie sua organizacao, membros e perfil
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 bg-card border rounded-xl p-1.5">
          <TabsTrigger
            value="general"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5"
          >
            <Building2 className="h-4 w-4" />
            <div className="text-left hidden sm:block">
              <span className="block text-sm font-medium">Geral</span>
              <span className="block text-[10px] text-muted-foreground font-normal">
                Dados da org
              </span>
            </div>
            <span className="sm:hidden text-sm">Geral</span>
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5"
          >
            <Users className="h-4 w-4" />
            <div className="text-left hidden sm:block">
              <span className="block text-sm font-medium">Membros</span>
              <span className="block text-[10px] text-muted-foreground font-normal">
                Equipe e cargos
              </span>
            </div>
            <span className="sm:hidden text-sm">Membros</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5"
          >
            <User className="h-4 w-4" />
            <div className="text-left hidden sm:block">
              <span className="block text-sm font-medium">Meu Perfil</span>
              <span className="block text-[10px] text-muted-foreground font-normal">
                Seus dados
              </span>
            </div>
            <span className="sm:hidden text-sm">Perfil</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <OrgGeneral orgId={orgId} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="members">
          <OrgMembersFull
            orgId={orgId}
            currentUserId={user.entidadeId}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="profile">
          <OrgMyProfile />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
