"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronRight } from "lucide-react";

import { PageTransition } from "@/components/common/page-transition";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { usePreference } from "@/lib/hooks/use-preference";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
  usePageTitle("Preferences");

  // Theme via next-themes
  const { theme, setTheme } = useTheme();

  // Persisted preferences (localStorage; cross-device sync = gap #21)
  const [defaultHomeView, setDefaultHomeView] = usePreference(
    "defaultHomeView",
    "active",
  );
  const [displayNames, setDisplayNames] = usePreference(
    "displayNames",
    "fullName",
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = usePreference(
    "firstDayOfWeek",
    "sunday",
  );
  const [convertEmoticons, setConvertEmoticons] = usePreference(
    "convertEmoticons",
    true,
  );
  const [sendCommentOn, setSendCommentOn] = usePreference(
    "sendCommentOn",
    "enter",
  );
  const [fontSize, setFontSize] = usePreference("fontSize", "default");
  const [pointerCursors, setPointerCursors] = usePreference(
    "pointerCursors",
    false,
  );
  const [autoAssignToSelf, setAutoAssignToSelf] = usePreference(
    "autoAssignToSelf",
    false,
  );
  const [onMoveStartedAssignSelf, setOnMoveStartedAssignSelf] = usePreference(
    "onMoveStartedAssignSelf",
    false,
  );

  return (
    <PageTransition>
      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>

          {/* ============ GENERAL ============ */}
          <Section title="General">
            <Card>
              <Row
                label="Default home view"
                description="Select which view to display when launching Scrumban"
                control={
                  <SelectControl
                    value={defaultHomeView}
                    onChange={setDefaultHomeView}
                    options={[
                      { value: "active", label: "Active issues" },
                      { value: "inbox", label: "Inbox" },
                      { value: "myIssues", label: "My issues" },
                      { value: "projects", label: "Projects" },
                    ]}
                  />
                }
              />
              <Row
                label="Display names"
                description="Select how names are displayed in the interface"
                control={
                  <SelectControl
                    value={displayNames}
                    onChange={setDisplayNames}
                    options={[
                      { value: "fullName", label: "Full name" },
                      { value: "username", label: "Username" },
                      { value: "firstName", label: "First name" },
                    ]}
                  />
                }
              />
              <Row
                label="First day of the week"
                description="Used for date pickers"
                control={
                  <SelectControl
                    value={firstDayOfWeek}
                    onChange={setFirstDayOfWeek}
                    options={[
                      { value: "sunday", label: "Sunday" },
                      { value: "monday", label: "Monday" },
                    ]}
                  />
                }
              />
              <Row
                label="Convert text emoticons into emojis"
                description="Strings like :) will be converted to 🙂"
                control={
                  <Switch
                    checked={convertEmoticons}
                    onCheckedChange={setConvertEmoticons}
                  />
                }
              />
              <Row
                label="Send comment on..."
                description="Choose which key press is used to submit a comment"
                control={
                  <SelectControl
                    value={sendCommentOn}
                    onChange={setSendCommentOn}
                    options={[
                      { value: "enter", label: "Enter" },
                      { value: "cmdEnter", label: "Cmd/Ctrl+Enter" },
                    ]}
                  />
                }
                noBorder
              />
            </Card>
          </Section>

          {/* ============ INTERFACE & THEME ============ */}
          <Section title="Interface and theme">
            <Card>
              <Row
                label="App sidebar"
                description="Customize sidebar item visibility, ordering, and badge style"
                control={
                  <button
                    type="button"
                    disabled
                    title="Em breve"
                    className="text-[12px] text-muted-foreground cursor-not-allowed"
                  >
                    Customize
                  </button>
                }
              />
              <Row
                label="Font size"
                description="Adjust the size of text across the app"
                control={
                  <SelectControl
                    value={fontSize}
                    onChange={setFontSize}
                    options={[
                      { value: "small", label: "Small" },
                      { value: "default", label: "Default" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                }
              />
              <Row
                label="Use pointer cursors"
                description="Change the cursor to a pointer when hovering over interactive elements"
                control={
                  <Switch
                    checked={pointerCursors}
                    onCheckedChange={setPointerCursors}
                  />
                }
                noBorder
              />
            </Card>

            <Card>
              <Row
                label="Interface theme"
                description="Select or customize your interface color scheme"
                control={
                  <SelectControl
                    value={theme ?? "system"}
                    onChange={setTheme}
                    options={[
                      { value: "system", label: "System preference" },
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ]}
                  />
                }
              />
              <Row
                label="Light"
                description="Theme to use for light system appearance"
                control={
                  <SelectControl
                    value="light"
                    onChange={() => {}}
                    options={[{ value: "light", label: "Light" }]}
                    disabled
                  />
                }
              />
              <Row
                label="Dark"
                description="Theme to use for dark system appearance"
                control={
                  <SelectControl
                    value="dark"
                    onChange={() => {}}
                    options={[{ value: "dark", label: "Dark" }]}
                    disabled
                  />
                }
                noBorder
              />
            </Card>

            <Card>
              <Row
                label="Code theme"
                description="Syntax highlighting em diffs e code viewers"
                stub
                title="Em breve — depende de termos diff/code blocks na UI"
                control={
                  <SelectControl
                    value="linear-dark"
                    onChange={() => {}}
                    options={[{ value: "linear-dark", label: "Linear Dark" }]}
                    disabled
                  />
                }
                noBorder
              />
            </Card>
          </Section>

          {/* ============ DESKTOP APPLICATION ============ */}
          <Section title="Desktop application">
            <Card>
              <Row
                label="Open in desktop app"
                description="Automatically open links in desktop app when possible"
                stub
                title="Gap #22 — sem app desktop"
                control={<Switch checked={false} disabled />}
                noBorder
              />
            </Card>
          </Section>

          {/* ============ CODING TOOLS ============ */}
          <Section title="Coding tools">
            <Card>
              <Link
                href="/integrations"
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent/40 transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium">
                    Configure coding tools
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Configure tools which can be opened from Scrumban (MCP, etc.)
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Card>
          </Section>

          {/* ============ AUTOMATIONS & WORKFLOWS ============ */}
          <Section title="Automations and workflows">
            <Card>
              <Row
                label="Auto-assign to self"
                description="When creating new issues, always assign them to yourself by default"
                control={
                  <Switch
                    checked={autoAssignToSelf}
                    onCheckedChange={setAutoAssignToSelf}
                  />
                }
              />
              <Row
                label="Git attachment format"
                description="The format of GitHub/GitLab attachments on issues"
                stub
                title="Gap #23 — sem integracao Git"
                control={
                  <SelectControl
                    value="title"
                    onChange={() => {}}
                    options={[{ value: "title", label: "Title" }]}
                    disabled
                  />
                }
              />
              <Row
                label="On git branch copy, move issue to started status"
                description="After copying the git branch name, issue status is moved to first started workflow status"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
              />
              <Row
                label="On open in coding tool, move issue to started status"
                description="After opening an issue in a coding tool, status is moved to first started"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
              />
              <Row
                label="On move to started status, assign to yourself"
                description="When you move an unassigned issue to started, it will be automatically assigned to you"
                control={
                  <Switch
                    checked={onMoveStartedAssignSelf}
                    onCheckedChange={setOnMoveStartedAssignSelf}
                  />
                }
              />
              <Row
                label="Auto-convert draft pull requests"
                description="Mark draft PRs as ready for review when a review is requested or PR is approved"
                stub
                title="Gap #23 — sem integracao Git"
                control={<Switch checked={false} disabled />}
                noBorder
              />
            </Card>
          </Section>
        </div>
      </div>
    </PageTransition>
  );
}

// ============================================================
// Layout primitives
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {children}
    </div>
  );
}

function Row({
  label,
  description,
  control,
  noBorder,
  stub,
  title,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  noBorder?: boolean;
  stub?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={cn(
        "flex items-center justify-between gap-6 px-4 py-3",
        !noBorder && "border-b border-border",
        stub && "opacity-70",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// ============================================================
// SelectControl wrapper (Linear-like compact)
// ============================================================

interface Option {
  value: string;
  label: string;
}

function SelectControl({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 min-w-[160px] text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-[12px]"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
