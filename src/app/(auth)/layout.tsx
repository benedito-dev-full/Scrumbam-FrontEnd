import { Columns3, BarChart3, Bot, Zap } from "lucide-react";

const features = [
  {
    icon: Columns3,
    title: "Repositorio de Intencoes",
    description: "Capture e refine demandas de qualquer canal em um so lugar",
  },
  {
    icon: BarChart3,
    title: "Metricas de fluxo reais",
    description: "Cycle time, throughput e Monte Carlo em tempo real",
  },
  {
    icon: Bot,
    title: "Projetos autonomos",
    description: "Cada projeto puxa intencoes e reporta resultados via API",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Branding Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--scrumban-brand)] via-[var(--ai-gradient-from)] to-[var(--scrumban-brand)]">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm">
              <Columns3 className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Scrumban
            </span>
          </div>

          {/* Tagline */}
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
            Gestao agil inteligente.
          </h1>
          <p className="text-lg xl:text-xl text-white/80 mb-12">
            Para times que querem entregar.
          </p>

          {/* Feature highlights */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm shrink-0 mt-0.5">
                  <feature.icon className="h-5 w-5 text-white/90" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-sm text-white/60 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative element */}
          <div className="mt-16 flex items-center gap-2 text-white/40 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Powered by Devari Core</span>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
