import Link from "next/link";
import { ScrumbanLogo } from "@/components/common/scrumban-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar with logo */}
      <header className="flex h-14 shrink-0 items-center px-6">
        <Link href="/login">
          <ScrumbanLogo size="md" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-center gap-2 px-6 py-6 text-[12px] text-muted-foreground sm:flex-row sm:gap-6">
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
