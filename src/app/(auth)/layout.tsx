import Link from "next/link";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";
import { MessageSquare, Bot, LayoutDashboard } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ─────────────────────────────────────────────
          PAINEL ESQUERDO — 40%, visível só em lg+
      ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[40%] flex-col justify-between relative overflow-hidden"
        style={{ backgroundColor: "#0a1628" }}
      >
        {/* Orb 1: cyan topo-direito */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full opacity-50 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(34, 211, 238, 0.55) 0%, transparent 70%)",
          }}
        />

        {/* Orb 2: teal bottom-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-[350px] w-[350px] rounded-full opacity-40 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, rgba(14, 116, 144, 0.6) 0%, transparent 70%)",
          }}
        />

        {/* Grade de pontos decorativa */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Conteúdo do painel esquerdo */}
        <div className="relative flex flex-col h-full px-10 py-12">
          {/* Logo */}
          <Link href="/login" className="inline-block">
            <ScrumbanLogo size="md" />
          </Link>

          {/* Tagline + features — verticalmente centrado */}
          <div className="flex-1 flex flex-col justify-center gap-10">
            <div className="space-y-3">
              <h2 className="text-[26px] font-semibold leading-snug text-white">
                Gestão ágil para times
                <br />
                que entregam.
              </h2>
              <p className="text-[13px] text-cyan-300/70 leading-relaxed max-w-[280px]">
                Do INBOX ao DONE sem burocracia — captura de intenções,
                agentes de IA e métricas em tempo real.
              </p>
            </div>

            {/* Lista de features */}
            <ul className="space-y-5">
              <FeatureItem icon={MessageSquare}>
                Capture intenções via Telegram ou diretamente na web.
              </FeatureItem>
              <FeatureItem icon={Bot}>
                Agentes de IA executam tasks direto na sua VPS.
              </FeatureItem>
              <FeatureItem icon={LayoutDashboard}>
                Fluxo V3: INBOX → READY → DONE sem burocracia.
              </FeatureItem>
            </ul>
          </div>

          {/* Rodapé do painel esquerdo */}
          <p className="text-[11px] text-white/30">
            © Scrumban {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────
          PAINEL DIREITO — 60% em lg+, 100% em mobile
      ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 lg:w-[60%] bg-background overflow-y-auto">
        {/* Em mobile: mostra logo no topo pois o painel esquerdo some */}
        <header className="lg:hidden flex h-14 shrink-0 items-center px-6 border-b border-border">
          <Link href="/login">
            <ScrumbanLogo size="md" />
          </Link>
        </header>

        {/* Formulário centralizado */}
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-center gap-2 px-6 py-5 text-[11px] text-muted-foreground sm:flex-row sm:gap-5 border-t border-border">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            Feito para times que entregam
          </span>
          <span className="hidden sm:inline">·</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">
              Termos
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <a
              href="mailto:contato@scrumban.com.br"
              className="hover:text-foreground transition-colors"
            >
              Contato
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Sub-component: item de feature no painel esquerdo
// ────────────────────────────────────────────────────────

function FeatureItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[13px] text-white/70 leading-relaxed">{children}</span>
    </li>
  );
}
