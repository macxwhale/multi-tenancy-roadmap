import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-500">
      <div className="rounded-full bg-accent/10 p-6 mb-6 ring-1 ring-accent/20">
        <Icon className="h-12 w-12 text-accent" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="shadow-sm hover:shadow-md transition-shadow">
          {action.label}
        </Button>
      )}
    </div>
  );
}
