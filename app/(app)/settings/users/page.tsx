import { PageHeader } from "@/components/page-header";
import { UsersTable } from "@/features/users/users-table";

export const metadata = { title: "Users · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage who can sign in and what they can do"
      />
      <UsersTable />
    </>
  );
}
