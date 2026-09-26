import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

/** Shared chrome + client-side admin guard for every `/admin/*` page. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
