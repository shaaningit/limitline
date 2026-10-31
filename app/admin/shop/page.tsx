import { requireFounder } from "@/lib/data/session";
import { saveItem, setRedemptionStatus } from "../actions";

// Shop items the founder stocks, and requests to hand over (D15).
export default async function AdminShopPage({ searchParams }: PageProps<"/admin/shop">) {
  const { supabase } = await requireFounder();
  const { error } = await searchParams;
  const [itemsRes, requestsRes] = await Promise.all([
    supabase.from("shop_items").select("id, name, price, stock, active").order("price"),
    supabase
      .from("redemptions")
      .select("id, price, status, created_at, shop_items(name), profiles(display_name)")
      .eq("status", "requested")
      .order("created_at"),
  ]);
  const items = itemsRes.data ?? [];
  const requests = (requestsRes.data ?? []) as unknown as {
    id: string;
    price: number;
    created_at: string;
    shop_items: { name: string } | null;
    profiles: { display_name: string } | null;
  }[];

  return (
    <div className="admin-panes">
      <section aria-labelledby="requests">
        <h1 id="requests">To hand over ({requests.length})</h1>
        {requests.length === 0 ? (
          <p className="muted">No requests waiting.</p>
        ) : (
          <ul className="rows">
            {requests.map((r) => (
              <li key={r.id}>
                <span>
                  {r.profiles?.display_name} · {r.shop_items?.name}
                </span>
                <span style={{ display: "flex", gap: "var(--space-1)" }}>
                  <form action={setRedemptionStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="handed_over" />
                    <button className="button button-primary" type="submit">
                      Handed over
                    </button>
                  </form>
                  <form action={setRedemptionStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="button" type="submit">
                      Cancel
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="items">
        <h2 id="items" style={{ marginTop: 0 }}>
          Items
        </h2>
        {typeof error === "string" && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {[...items, { id: "", name: "", price: 0, stock: 0, active: true }].map((item) => (
          <form
            key={item.id || "new"}
            action={saveItem}
            className="field"
            style={{ borderBottom: "1px solid var(--line)", paddingBottom: "var(--space-2)" }}
          >
            <input type="hidden" name="id" value={item.id} />
            <p style={{ fontWeight: 600, margin: "0 0 var(--space-1)" }}>{item.id ? item.name : "New item"}</p>
            <div className="time-inputs">
              <div>
                <label htmlFor={`name-${item.id || "new"}`}>Name</label>
                <input id={`name-${item.id || "new"}`} name="name" defaultValue={item.name} required maxLength={80} />
              </div>
              <div>
                <label htmlFor={`price-${item.id || "new"}`}>Price (embers)</label>
                <input id={`price-${item.id || "new"}`} name="price" type="number" min={1} defaultValue={item.price || ""} required />
              </div>
              <div>
                <label htmlFor={`stock-${item.id || "new"}`}>Stock</label>
                <input id={`stock-${item.id || "new"}`} name="stock" type="number" min={0} defaultValue={item.stock} required />
              </div>
            </div>
            <p style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginTop: "var(--space-1)" }}>
              <label style={{ display: "flex", gap: "var(--space-1)", alignItems: "center", margin: 0 }}>
                <input name="active" type="checkbox" defaultChecked={item.active} style={{ width: 22, minHeight: 22 }} />
                Show in shop
              </label>
              <button className="button button-primary" type="submit">
                {item.id ? "Save" : "Add item"}
              </button>
            </p>
          </form>
        ))}
      </section>
    </div>
  );
}
