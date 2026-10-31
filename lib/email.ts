import { formatPercent, formatValue } from "@/lib/format";
import { EMBERS, QUESTS, REJECT_REASONS, type QuestId, type RejectReason } from "@/lib/rules/config";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface ResultFacts {
  questId: QuestId;
  status: "verified" | "rejected";
  value: number | null;
  percent: number | null;
  beatLimit: boolean | null;
  embers: number | null;
  rejectReason: RejectReason | null;
}

const appLink = () => `${process.env.APP_URL ?? ""}/quests`;

// The full result is in the email body, so athletes don't need to tap through (re-review #6).
export function resultEmail(to: string, r: ResultFacts): EmailMessage {
  const quest = QUESTS[r.questId].label;
  const time = r.value === null ? "" : formatValue(r.questId, r.value);
  if (r.beatLimit && r.percent !== null) {
    const doubled = Number(r.embers) > EMBERS.base;
    return {
      to,
      subject: `You beat your ${quest} limit: ${formatPercent(r.percent)}`,
      text: [
        `You beat your ${quest} limit: ${time}, ${formatPercent(r.percent)}${doubled ? ", double embers" : ""}.`,
        `+${r.embers} embers.`,
        "",
        `See it on LIMITLINE: ${appLink()}`,
      ].join("\n"),
    };
  }
  return {
    to,
    subject: `Quest done: ${quest}`,
    text: [`Quest done: ${quest}${time ? ` in ${time}` : ""}. +${r.embers} embers.`, "", `LIMITLINE: ${appLink()}`].join("\n"),
  };
}

// Corrections are explained, including when embers go down (re-review D3).
export function correctionEmail(to: string, r: ResultFacts, embersBefore: number | null): EmailMessage {
  const quest = QUESTS[r.questId].label;
  const lines =
    r.status === "rejected"
      ? [`The founder corrected your ${quest} result: it no longer counts (${REJECT_REASONS[r.rejectReason!]}).`]
      : [
          `The founder corrected your ${quest} result${r.value === null ? "" : ` to ${formatValue(r.questId, r.value)}`}.`,
          r.beatLimit && r.percent !== null ? `It's now ${formatPercent(r.percent)} beyond your limit.` : "",
        ];
  const after = r.status === "rejected" ? 0 : Number(r.embers);
  if (embersBefore !== null && embersBefore !== after) lines.push(`Embers: ${embersBefore} → ${after}.`);
  return {
    to,
    subject: `Result corrected: ${quest}`,
    text: [...lines.filter(Boolean), "", `LIMITLINE: ${appLink()}`].join("\n"),
  };
}

// Sends through Resend's web API. Returns false instead of throwing so a failed email
// never undoes a saved result; the caller records the failure for a retry (re-review #3).
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
