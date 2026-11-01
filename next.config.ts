import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Links now start from a quest page; old /submit bookmarks land on My quests.
  async redirects() {
    return [{ source: "/submit", destination: "/quests", permanent: false }];
  },
};

export default nextConfig;
