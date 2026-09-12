import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
