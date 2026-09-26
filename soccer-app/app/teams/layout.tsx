import type { ReactNode } from "react";
import { ApplicationShell } from "../../components/application-shell";

export default function TeamsLayout({ children }: { children: ReactNode }) {
  return <ApplicationShell>{children}</ApplicationShell>;
}
