import { QUESTS, type QuestId } from "@/lib/rules/config";

// "25:58", "1:02:03" for time quests; "250 W" for the bike quest.
export function formatValue(questId: QuestId, value: number): string {
  if (QUESTS[questId].measure === "power") return `${Math.round(value)} W`;
  const total = Math.round(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

// "+3.3%" / "-1.2%" for display.
export function formatPercent(percent: number): string {
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

// Full words for screen readers (13A): "3.3 percent beyond your limit, double embers".
export function describeResult(percent: number | null, beatLimit: boolean, doubled: boolean): string {
  if (percent === null) return "Quest done, this sets your first limit";
  const amount = `${Math.abs(percent).toFixed(1)} percent`;
  if (beatLimit) return `${amount} beyond your limit${doubled ? ", double embers" : ""}`;
  return `${amount} short of your limit`;
}
