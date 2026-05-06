import { redirect } from "next/navigation";

export default function InvitePage() {
  // Atende via tela de Members existente
  redirect("/settings/workspace/members");
}
