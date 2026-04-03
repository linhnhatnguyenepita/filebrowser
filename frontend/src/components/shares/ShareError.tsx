// frontend/src/components/shares/ShareError.tsx

import { AlertCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export default function ShareError({ title, description, action }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Link
            to={action.href}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
