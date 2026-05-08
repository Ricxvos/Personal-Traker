import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { MobileNav } from "@/components/MobileNav";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen pb-20">
      <RegisterServiceWorker />
      <main className="mx-auto w-full max-w-md px-4 py-6">{children}</main>
      <MobileNav />
    </div>
  );
}
