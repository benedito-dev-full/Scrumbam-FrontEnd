"use client";

import { ViewsList } from "@/components/views/views-list";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function ViewsIssuesPage() {
  usePageTitle("Views — Issues");
  return <ViewsList type="issues" />;
}
