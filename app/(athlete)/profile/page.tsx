import Link from "next/link";
import { Reveal } from "@/components/motion";
import { StravaConnectButton, StravaReturnMessage } from "@/components/strava-connect";
import { LOGIN_OPTIONS } from "@/lib/auth-options";
import { getMyStrava } from "@/lib/data/athlete";
import { stravaEnabled } from "@/lib/strava/config";
import { requireAthlete } from "@/lib/data/session";
import { disconnectStrava, logOut, saveSettings } from "./actions";
import { PhoneLinkForm } from "./phone-link-form";

const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL ?? "";

// Profile sheet (15A): name, board and share-card privacy, data deletion, log out.
export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const session = await requireAthlete();
  const { profile, phone } = session;
  const { saved, strava: stravaReturn, strava_off: stravaOff } = await searchParams;
  const strava = stravaEnabled() ? await getMyStrava(session) : null;
  const deletion = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent("Delete my LIMITLINE data")}&body=${encodeURIComponent(
    `Please delete my account and data. Name on LIMITLINE: ${profile.display_name}`,
  )}`;

  return (
    <>
      <Reveal />
      <h1 className="ltitle">{profile.display_name}</h1>
      {saved === "1" && <p role="status">Saved.</p>}
      <form action={saveSettings}>
        <ul className="rows">
          <li>
            <label htmlFor="show_on_boards" style={{ margin: 0, flex: 1 }}>
              Show me on boards
            </label>
            <input
              id="show_on_boards"
              name="show_on_boards"
              type="checkbox"
              defaultChecked={profile.show_on_boards}
              style={{ width: 24, minHeight: 24 }}
            />
          </li>
          <li>
            <label htmlFor="show_name_on_share" style={{ margin: 0, flex: 1 }}>
              Show my name on share cards
            </label>
            <input
              id="show_name_on_share"
              name="show_name_on_share"
              type="checkbox"
              defaultChecked={profile.show_name_on_share}
              style={{ width: 24, minHeight: 24 }}
            />
          </li>
        </ul>
        <p style={{ marginTop: "var(--space-2)" }}>
          <button className="button button-primary" type="submit">
            Save
          </button>
        </p>
      </form>

      {stravaEnabled() && (
        <>
          <h2>Strava</h2>
          <StravaReturnMessage status={stravaReturn} />
          {stravaOff === "1" && <p role="status">Strava disconnected. Your links now wait for the founder&apos;s check.</p>}
          {strava ? (
            <form action={disconnectStrava}>
              <p>
                <span className="ok">✓</span> Connected{strava.name ? ` as ${strava.name}` : ""}. Links you paste are checked in seconds.
              </p>
              <p className="muted small">
                LIMITLINE reads only the activities you paste, and only what the quest needs. Powered by Strava.
              </p>
              <button className="button" type="submit">
                Disconnect Strava
              </button>
            </form>
          ) : (
            <>
              <p className="muted">Connect once and every link you paste is checked in seconds, instead of waiting for the founder.</p>
              <StravaConnectButton next="/profile" />
            </>
          )}
        </>
      )}

      {LOGIN_OPTIONS.phone && (
        <>
          <h2>Log in with your phone</h2>
          <PhoneLinkForm current={phone} />
        </>
      )}

      <h2>Your data</h2>
      <p>
        <a href={deletion}>Request data deletion</a>
        <br />
        <span className="muted small">The founder deletes your account and all stored numbers within 7 days.</span>
      </p>

      {profile.is_founder && (
        <p>
          <Link className="button" href="/admin">
            Admin
          </Link>
        </p>
      )}

      <form action={logOut}>
        <button className="button" type="submit">
          Log out
        </button>
      </form>
    </>
  );
}
