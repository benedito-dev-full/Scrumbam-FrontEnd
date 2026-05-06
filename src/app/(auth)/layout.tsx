import Link from "next/link";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Decorative cyan glows — pure CSS, low opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(103, 232, 249, 0.35) 0%, rgba(8, 145, 178, 0.10) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.30) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
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
          <span className="h-1 w-1 rounded-full bg-cyan-400" />
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
