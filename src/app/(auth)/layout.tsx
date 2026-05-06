import Link from "next/link";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Decorative cyan glows — pure CSS */}

      {/* Glow 1: top-center, large, primary */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(103, 232, 249, 0.55) 0%, rgba(8, 145, 178, 0.18) 40%, transparent 70%)",
        }}
      />

      {/* Glow 2: bottom-right, accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[600px] w-[600px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.45) 0%, transparent 70%)",
        }}
      />

      {/* Glow 3: bottom-left, deeper teal — balance */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-[450px] w-[450px] rounded-full opacity-45 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(14, 116, 144, 0.55) 0%, transparent 70%)",
        }}
      />

      {/* Glow 4: center halo behind the form, subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(103, 232, 249, 0.45) 0%, transparent 60%)",
        }}
      />

      {/* Top hairline cyan gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(103, 232, 249, 0.6) 50%, transparent 100%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top bar with logo */}
      <header className="relative flex h-14 shrink-0 items-center px-6">
        <Link href="/login">
          <ScrumbanLogo size="md" />
        </Link>
      </header>

      {/* Main content */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative flex flex-col items-center justify-center gap-2 px-6 py-6 text-[12px] text-muted-foreground sm:flex-row sm:gap-6">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          Built for teams that ship
        </span>
        <span className="hidden sm:inline">·</span>
        <span>© Scrumban {new Date().getFullYear()}</span>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <a
            href="mailto:contato@scrumban.com.br"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
