import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

// Belt-and-braces: the proxy already blocks non-admins, but guard here too so a
// direct render can never leak admin screens.
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user || !isAdmin(user.role)) redirect("/");
  return <>{children}</>;
}
