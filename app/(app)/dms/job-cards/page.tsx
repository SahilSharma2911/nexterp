import { JobCardsView } from "@/modules/dms/job-cards/job-cards-view";

export const metadata = { title: "Job Cards · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function JobCardsPage() {
  return <JobCardsView />;
}
