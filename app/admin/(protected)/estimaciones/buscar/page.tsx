import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function BuscarEstimacionPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  redirect(`/admin/estimaciones/${encodeURIComponent((id ?? "").trim())}`);
}
