"use client";

import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

/**
 * Estado "Em breve" para paginas ainda nao implementadas.
 * Card centralizado com icone, titulo e descricao.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Construction,
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 px-6">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {description}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60">
            <Construction className="h-3.5 w-3.5" />
            <span>Em desenvolvimento</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
