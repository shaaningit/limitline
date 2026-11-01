import "server-only";
import { connection } from "next/server";
import { buildBoard, limitBefore, weekStart, type Seed, type VerifiedEntry } from "@/lib/rules";
import { EMBERS, PILOT_TIME_ZONE, QUEST_IDS, type QuestId, type RejectReason, type Sport } from "@/lib/rules/config";
import type { requireAthlete } from "./session";

type Session = Awaited<ReturnType<typeof requireAthlete>>;

export interface MyEntry {
  id: string;
  quest_id: QuestId;
  link: string;
  status: "waiting" | "verified" | "rejected";
  reject_reason: RejectReason | null;
  activity_at: string | null;
  value: number | null;
  percent: number | null;
  beat_limit: boolean | null;
  embers: number | null;
  submitted_at: string;
  seen_at: string | null;
}

export interface QuestLimit {
  questId: QuestId;
  limit: number | null;
  effortCount: number;
}

export async function getMyQuests(session: Session) {
  const { supabase, userId } = session;
  const [entriesRes, seedsRes, balanceRes] = await Promise.all([
    supabase.from("entries").select("*").eq("athlete_id", userId).order("submitted_at", { ascending: false }),
    supabase.from("seed_limits").select("quest_id, value, effort_count").eq("athlete_id", userId),
    supabase.rpc("embers_balance", { p_athlete: userId }),
  ]);
  if (entriesRes.error || seedsRes.error || balanceRes.error) throw new Error("Couldn't load your quests");

  const entries = (entriesRes.data ?? []) as MyEntry[];
  const seeds: Seed[] = (seedsRes.data ?? []).map((s) => ({
    questId: s.quest_id as QuestId,
    value: Number(s.value),
    effortCount: s.effort_count,
  }));
  const verified: VerifiedEntry[] = entries
    .filter((e) => e.status === "verified")
    .map((e) => ({ id: e.id, questId: e.quest_id, value: Number(e.value), activityAt: new Date(e.activity_at!) }));

  // Current limit per quest = the limit as it stands after every verified activity.
  const farFuture = new Date(8.64e15);
  const limits: QuestLimit[] = QUEST_IDS.map((questId) => {
    const state = limitBefore(questId, seeds.find((s) => s.questId === questId), verified, farFuture);
    return { questId, limit: state.limit, effortCount: state.effortCount };
  });

  return {
    entries,
    limits,
    balance: Number(balanceRes.data ?? 0),
    unseen: entries.filter((e) => e.status === "verified" && !e.seen_at),
    minEfforts: EMBERS.minEffortsToDouble,
  };
}

// "This week" depends on when the request happens, so it must never be prerendered.
export async function currentWeek(): Promise<string> {
  await connection();
  return weekStart(new Date(), PILOT_TIME_ZONE);
}

// Board rows come from the members-only board_entries function (no raw values);
// ranking happens here with the same rules engine as everything else.
export async function getBoard(session: Session, sport: Sport, week: string) {
  const { data, error } = await session.supabase.rpc("board_entries", {
    p_week_start: week,
    p_time_zone: PILOT_TIME_ZONE,
  });
  if (error) throw new Error("Couldn't load the board");
  const rows = (data ?? []) as {
    athlete_id: string;
    display_name: string;
    quest_id: QuestId;
    percent: number | null;
    beat_limit: boolean;
    activity_at: string;
    is_me: boolean;
  }[];
  const board = buildBoard(
    rows.map((r) => ({
      athleteId: r.athlete_id,
      displayName: r.display_name,
      questId: r.quest_id,
      percent: r.percent === null ? null : Number(r.percent),
      beatLimit: r.beat_limit,
      activityAt: new Date(r.activity_at),
      showOnBoards: true, // board_entries already leaves hidden athletes out
    })),
    sport,
    week,
    PILOT_TIME_ZONE,
  );
  return { ...board, rows: board.rows.map((row) => ({ ...row, isMe: row.athleteId === session.userId })) };
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export async function getShop(session: Session) {
  const { supabase, userId } = session;
  const [itemsRes, redemptionsRes, balanceRes] = await Promise.all([
    supabase.from("shop_items").select("id, name, price, stock").eq("active", true).order("price"),
    supabase
      .from("redemptions")
      .select("id, price, status, created_at, shop_items(name)")
      .eq("athlete_id", userId)
      .order("created_at", { ascending: false }),
    supabase.rpc("embers_balance", { p_athlete: userId }),
  ]);
  if (itemsRes.error || redemptionsRes.error || balanceRes.error) throw new Error("Couldn't load the shop");
  return {
    items: (itemsRes.data ?? []) as ShopItem[],
    redemptions: (redemptionsRes.data ?? []) as unknown as {
      id: string;
      price: number;
      status: "requested" | "handed_over" | "cancelled";
      shop_items: { name: string } | null;
    }[],
    balance: Number(balanceRes.data ?? 0),
  };
}

// The athlete's own Strava connection (never the tokens), or null.
export async function getMyStrava(session: Session): Promise<{ name: string | null; connectedAt: string } | null> {
  const { data, error } = await session.supabase.rpc("my_strava");
  if (error) return null;
  const row = (data as { strava_name: string | null; connected_at: string }[] | null)?.[0];
  return row ? { name: row.strava_name, connectedAt: row.connected_at } : null;
}
