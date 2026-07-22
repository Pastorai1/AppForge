import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getUsage, type UsageState } from "@/lib/usage";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  let email: string | null = null;
  let usage: UsageState | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      email = user.email ?? null;
      usage = await getUsage(user.id);
    }
  }

  return (
    <div className="md:flex">
      <Sidebar email={email} usage={usage} />
      <main className="min-h-screen w-full min-w-0 flex-1 px-5 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
