import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSession } from "@/lib/data/session";
import { formatPercent } from "@/lib/format";
import { QUESTS, type QuestId } from "@/lib/rules/config";

const font = readFile(join(process.cwd(), "assets/fonts/BarlowCondensed-SemiBold.ttf"));

// Story-sized share image for a result that beat the limit (6A). Only the athlete's own
// result (re-review #8); first name only if they opted in (15A). No embers, no raw time.
export async function GET(_request: Request, ctx: RouteContext<"/api/share-card/[id]">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session?.profile) return new Response("Not found", { status: 404 });

  const { data: entry } = await session.supabase
    .from("entries")
    .select("quest_id, percent, beat_limit, status")
    .eq("id", id)
    .eq("athlete_id", session.userId)
    .maybeSingle();
  if (!entry || entry.status !== "verified" || !entry.beat_limit || entry.percent === null) {
    return new Response("Not found", { status: 404 });
  }

  const name = session.profile.show_name_on_share ? session.profile.display_name.split(" ")[0] : null;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 96,
          background: "#000000",
          color: "#F2F5F0",
          fontFamily: "Barlow Condensed",
        }}
      >
        <div style={{ display: "flex", fontSize: 56, letterSpacing: 4, color: "#39FF14" }}>LIMITLINE</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 320, lineHeight: 1, color: "#39FF14", textShadow: "0 0 40px rgba(57, 255, 20, 0.5)" }}>
            {formatPercent(Number(entry.percent))}
          </div>
          <div style={{ display: "flex", fontSize: 80, marginTop: 24 }}>beyond my limit</div>
          <div style={{ display: "flex", fontSize: 64, marginTop: 16, color: "#A3ABA0" }}>
            {QUESTS[entry.quest_id as QuestId].label}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 56, color: "#A3ABA0" }}>{name ?? " "}</div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [{ name: "Barlow Condensed", data: await font, weight: 600, style: "normal" }],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
