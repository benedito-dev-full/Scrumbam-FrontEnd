"use client";

import { ViewsList } from "@/components/views/views-list";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function ViewsProjectsPage() {
  usePageTitle("Views — Projects");
  return <ViewsList type="projects" />;
}
