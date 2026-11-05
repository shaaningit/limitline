import { EmberIcon } from "@/components/icons";
import { Reveal } from "@/components/motion";
import { getShop } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { canRedeem } from "@/lib/rules";
import { redeem } from "./actions";

const MESSAGES: Record<string, { text: string; error?: boolean }> = {
  requested: { text: "Requested! The founder will hand it over." },
  sold_out: { text: "Sold out", error: true },
  not_enough: { text: "Not enough embers yet", error: true },
  error: { text: "Couldn't redeem, try again", error: true },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const session = await requireAthlete();
  const { status } = await searchParams;
  const { items, redemptions, balance } = await getShop(session);
  const message = typeof status === "string" ? MESSAGES[status] : undefined;

  return (
    <>
      <Reveal />
      <div className="stat-bar" style={{ justifyContent: "space-between", marginTop: "var(--space-2)" }}>
        <h1 className="ltitle" style={{ margin: 0 }}>Shop</h1>
        <span className="stat-pill embers" aria-label={`${balance} embers to spend`}>
          <EmberIcon size={22} />
          <span className="num" aria-hidden="true">{balance}</span>
        </span>
      </div>
      {balance < 0 && (
        <p className="error">A correction took back some embers. The shop opens again once your balance is above zero.</p>
      )}
      {message && (
        <p className={message.error ? "error" : undefined} role={message.error ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <p className="muted">Rewards are coming soon. Keep earning.</p>
      ) : (
        <ul className="rows">
          {items.map((item) => {
            const affordable = canRedeem(balance, item.price);
            return (
              <li key={item.id} className="rv">
                <span>
                  {item.name}
                  <br />
                  <span className="muted small">
                    <span className="num">{item.price}</span> embers
                    {item.stock < 1
                      ? " · Sold out"
                      : !affordable && balance >= 0
                        ? ` · ${item.price - balance} embers to go`
                        : ""}
                  </span>
                </span>
                <form action={redeem}>
                  <input type="hidden" name="item" value={item.id} />
                  <button className="button button-primary" type="submit" disabled={!affordable || item.stock < 1}>
                    Redeem
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {redemptions.length > 0 && (
        <section aria-labelledby="mine">
          <h2 id="mine">Your rewards</h2>
          <ul className="rows">
            {redemptions.map((r) => (
              <li key={r.id}>
                <span>{r.shop_items?.name ?? "Item"}</span>
                <span className="small">
                  {r.status === "handed_over" ? "Handed over ✓" : r.status === "cancelled" ? "Cancelled" : "Requested"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
