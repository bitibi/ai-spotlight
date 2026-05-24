import VoterApp from "@/components/VoterApp";
import { QUESTIONS } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default function Home() {
  return <VoterApp questions={QUESTIONS} />;
}
