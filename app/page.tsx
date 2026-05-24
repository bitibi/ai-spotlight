import VoterApp from "@/components/VoterApp";
import { QUESTIONS } from "@/lib/questions";
import { getOrCreateParticipantId } from "@/lib/participant";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Ensures a participant cookie is set before the EventSource connects.
  await getOrCreateParticipantId();
  return <VoterApp questions={QUESTIONS} />;
}
