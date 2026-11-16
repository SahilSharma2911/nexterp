import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/features/users/user-form";

export const metadata = { title: "New User · nexterp" };

export default function NewUserPage() {
  return (
    <>
      <PageHeader title="New User" subtitle="Invite someone to the workspace" />
      <UserForm />
    </>
  );
}
