# LIMITLINE

Quests for amateur triathletes that reward effort beyond your **own** limit. Paste a Strava activity link; the founder checks it; completing a quest earns embers, and beating your limit earns double. Spend embers in the shop, and see the weekly Run, Bike and Swim boards ranked by % beyond each athlete's own limit.

- Product and decisions: [`docs/designs/limitline-mvp.md`](docs/designs/limitline-mvp.md)
- Look and feel: [`DESIGN.md`](DESIGN.md)
- Going live (Supabase, Resend, Vercel): [`SETUP.md`](SETUP.md)

## How it's put together

| Part | Where | What it does |
|---|---|---|
| Rules engine | `lib/rules/` | Every fairness rule as plain, tested functions: limits, % beyond limit, embers, weeks, boards |
| Database | `supabase/migrations/` | Tables and access rules: athletes see only their own data, boards show only %, founder-only admin |
| Data and emails | `lib/data/`, `lib/email.ts` | Reads and writes for pages; corrections applied all-or-nothing; emails sent after saving |
| Pages | `app/` | Athlete pages (My quests, Submit, Board, Shop, Profile) and the founder's admin |

Built with Next.js 16, Supabase and Resend.

## Checks

```bash
npm test
```

```bash
npm run test:db
```

```bash
npm run lint
```
