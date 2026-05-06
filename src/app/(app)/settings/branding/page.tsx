"use client";

import { useState, useEffect, useCallback } from "react";
import { Palette, Save, Eye } from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useAuth } from "@/lib/hooks/use-auth";
import { brandingApi } from "@/lib/api/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Branding } from "@/types";

export default function BrandingPage() {
  usePageTitle("Branding");
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [secondaryColor, setSecondaryColor] = useState("#818CF8");
  const [appName, setAppName] = useState("");

  const loadBranding = useCallback(async () => {
    if (!user?.orgId) return;
    try {
      const data = await brandingApi.get(user.orgId);
      setBranding(data);
      setLogoUrl(data.logoUrl || "");
      setPrimaryColor(data.primaryColor || "#6366F1");
      setSecondaryColor(data.secondaryColor || "#818CF8");
      setAppName(data.appName || "");
    } catch {
      // First time - no branding yet
    } finally {
      setLoading(false);
    }
  }, [user?.orgId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleSave = async () => {
    if (!user?.orgId) return;
    setSaving(true);
    try {
      const updated = await brandingApi.update(user.orgId, {
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        appName: appName || undefined,
      });
      setBranding(updated);
      toast.success("Branding atualizado com sucesso");
    } catch {
      toast.error("Erro ao salvar branding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition className="space-y-6 px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Branding (White Label)
        </h1>
        <p className="text-sm text-muted-foreground">
          Personalize a aparencia da plataforma para sua organizacao
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form */}
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configuracoes
          </h2>

          <div className="space-y-2">
            <Label htmlFor="appName">Nome do App</Label>
            <Input
              id="appName"
              placeholder="Ex: Minha Empresa"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL do Logo</Label>
            <Input
              id="logoUrl"
              placeholder="https://cdn.exemplo.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Primaria</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#6366F1"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor Secundaria</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#818CF8"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Branding"}
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </h2>

          <div
            className="rounded-lg border overflow-hidden"
            style={{ minHeight: 300 }}
          >
            {/* Simulated header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-8 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {(appName || "S")[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-white">
                {appName || "Scrumban"}
              </span>
            </div>

            {/* Simulated sidebar */}
            <div className="flex">
              <div
                className="w-40 p-3 space-y-2"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  borderRight: "1px solid var(--border)",
                }}
              >
                {["Intencoes", "Dashboard", "Projetos", "Templates"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded px-3 py-1.5 text-xs font-medium"
                      style={{
                        color: primaryColor,
                      }}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>

              {/* Simulated content */}
              <div className="flex-1 p-4 space-y-2">
                <div
                  className="h-3 w-32 rounded"
                  style={{ backgroundColor: `${primaryColor}30` }}
                />
                <div className="h-2 w-48 rounded bg-muted" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded border"
                      style={{
                        borderTopColor: i === 1 ? primaryColor : undefined,
                        borderTopWidth: i === 1 ? 2 : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {branding && (
            <p className="text-xs text-muted-foreground">
              Ultima atualizacao salva para org {branding.orgId}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
