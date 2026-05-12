"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IssueDetailBody } from "./issue-detail-body";
import { IssueDetailHeader } from "./issue-detail-header";

interface IssueModalProps {
  projectId: string;
  issueId: string;
}

export function IssueModal({ projectId, issueId }: IssueModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    // Da tempo do fade-out do Radix rodar antes do router.back() desmontar
    // o slot. Sem o delay o modal some abruptamente.
    setTimeout(() => router.back(), 150);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[90vw] max-w-[1200px] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-[1200px]"
      >
        {/* Visually hidden title/description for a11y (the visible title lives
            inside IssueDetailHeader). */}
        <DialogTitle className="sr-only">{`Issue INT-${issueId}`}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhe da issue exibido em modal
        </DialogDescription>

        <IssueDetailHeader
          variant="modal"
          projectId={projectId}
          intentionId={issueId}
          onClose={handleClose}
          onAfterDelete={() => {
            setOpen(false);
            setTimeout(() => router.back(), 150);
          }}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          <IssueDetailBody
            key={issueId}
            variant="modal"
            projectId={projectId}
            intentionId={issueId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
