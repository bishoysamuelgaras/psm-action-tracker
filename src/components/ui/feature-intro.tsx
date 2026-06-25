import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureIntroProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function FeatureIntro({ title, description, actions, className }: FeatureIntroProps) {
  return (
    <Card className={cn("border-slate-200/80 bg-white", className)}>
      <CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-lg font-bold text-slate-950">{title}</div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
