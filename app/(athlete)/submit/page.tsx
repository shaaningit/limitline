import { requireAthlete } from "@/lib/data/session";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage() {
  await requireAthlete();
  return (
    <>
      <h1>Paste a Strava link</h1>
      <p className="muted">Only outdoor runs and rides, and pool swims, recorded after you signed up.</p>
      <SubmitForm />
    </>
  );
}
