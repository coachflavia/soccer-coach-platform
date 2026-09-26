import type { ReactNode } from "react";
import { ApplicationShell } from "./application-shell";

export function TrainingShell({ children }: { children: ReactNode }) {
  return <ApplicationShell>{children}</ApplicationShell>;
}
