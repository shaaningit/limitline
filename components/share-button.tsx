"use client";

import { useState } from "react";

// Share via the phone's share sheet with the image file; fall back to a download (re-review #8).
export function ShareButton({ entryId, title }: { entryId: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function share() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/share-card/${entryId}`);
      if (!res.ok) throw new Error("image");
      const blob = await res.blob();
      const file = new File([blob], "limitline.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "limitline.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // Closing the share sheet isn't an error.
      if (!(e instanceof DOMException && e.name === "AbortError")) setError("Couldn't make the image, try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="button button-primary" type="button" onClick={share} disabled={busy}>
        {busy ? "Making image…" : "Share"}
      </button>
      {error && (
        <span className="error small" role="alert">
          {" "}
          {error}
        </span>
      )}
    </>
  );
}
