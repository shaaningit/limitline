import { describe, expect, it } from "vitest";
import { avatarFromClaims } from "./avatar";

describe("avatarFromClaims", () => {
  it("uses the Google photo when there is one", () => {
    expect(avatarFromClaims({ user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/x" } })).toBe(
      "https://lh3.googleusercontent.com/a/x",
    );
    expect(avatarFromClaims({ user_metadata: { picture: "https://lh3.googleusercontent.com/a/y" } })).toBe(
      "https://lh3.googleusercontent.com/a/y",
    );
  });
  it("falls back to the silhouette for no photo, or anything that isn't https", () => {
    expect(avatarFromClaims({})).toBeNull();
    expect(avatarFromClaims(null)).toBeNull();
    expect(avatarFromClaims({ user_metadata: { avatar_url: "javascript:alert(1)" } })).toBeNull();
    expect(avatarFromClaims({ user_metadata: { avatar_url: "http://example.com/a.png" } })).toBeNull();
    expect(avatarFromClaims({ user_metadata: { avatar_url: 42 } })).toBeNull();
  });
});
