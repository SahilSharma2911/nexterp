import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/features/users/user-form";

export const metadata = { title: "Edit User · Seeka Motor" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit User" subtitle="Update access and role" />
      <UserForm userId={id} />
    </>
  );
}
