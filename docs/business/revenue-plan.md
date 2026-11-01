# How LIMITLINE makes money: brand deals, coaching, subscriptions

Founder's idea (Nov 1): brand deals, coaching, subscriptions. This is the plan for each, and the order to do them in.

## The short version

1. **During the pilot (Nov 16 to Dec 20): charge nobody.** The pilot exists to prove one thing: athletes come back (at least 5 of 10 active in both week 3 and week 4, decision D20). A paywall or a sponsor's rules would muddy that answer.
2. **Brand deals first.** Brands pay for attention, and the Instagram content race is what creates it. They're also the reason the shop has rewards, which the whole embers loop depends on.
3. **Coaching second.** Once athletes have a few weeks of verified limits, coaches have something real to work with, and athletes who stop improving have a reason to pay one.
4. **Subscriptions last.** People pay for a habit, not an idea. The streak and boards have to keep people for months before a paid tier makes sense.

Each step depends on the one before it: followers lead to brands, engaged athletes lead to coaches, and a lasting habit leads to subscribers.

## 1. Brand deals

**What a brand gets:**
- **Sponsored quests.** A quest with the brand's name and a prize, e.g. "Run 10 km this week. Best % beyond their own limit wins a <brand> pack." The % ranking means beginners can win, which makes the sponsor look generous rather than elitist.
- **Content challenges (in the Shop).** The brand posts a brief, a deadline and a prize ("Make a 15-second clip for <brand>"). Athletes post it and submit the link; the brand picks a winner, who gets the prize or an affiliate deal. The brand ends up with a pile of real athlete content it can reuse.
- **Shop rewards.** Products or discount codes athletes redeem with embers. For a small brand this is cheap customer acquisition: people who earned the reward through effort.
- **Affiliate codes.** A personal code per athlete, with LIMITLINE taking a share of the sales.

**Why a brand would say yes:** effort that's verified (not vanity followers), a community of amateur triathletes who buy kit, and content made by real athletes. The share card already turns every result into an Instagram story with LIMITLINE's look.

**How to charge:**
- **First deal:** expect a barter. The brand gives product for the shop and prizes; you give it features in your content. That's normal for a first deal and still valuable.
- **After that:** charge a fixed fee per campaign, priced from your own numbers: active athletes, entries in the sponsored quest, and the reach of the posts it produced. Keep those numbers from day one.

**What to build, and when** (after the pilot passes):

| Piece | What it adds to the app | Size [estimated] |
|---|---|---|
| Sponsored quests | Sponsor name and logo on a quest card, prize text, an end date, a "sponsored" badge | Small: about a week |
| Shop codes | Shop items that reveal a discount code when redeemed, plus a per-brand count of redemptions | Small |
| Content challenges | A challenge list in the Shop, link submissions, and "pick a winner" in admin | Medium: 1-2 weeks |

**Rules to keep:**
- Never show a brand's name or logo without its written agreement.
- Every challenge states who owns the content and how the brand may use it.
- Winning posts carry "#ad" or the platform's paid-partnership label.
- Brands get totals and athletes' own posts, never anyone's Strava data. Strava's terms limit sharing that data with other people.

## 2. Coaching

**The model is a marketplace.** Coaches offer training plans or 1:1 coaching inside LIMITLINE. Athletes book and pay; LIMITLINE takes a commission on each booking, or coaches pay a monthly fee to be listed. Which one is better depends on how many coaches want in, so test both by hand first.

**The hook is "coach quests".** A coach sets a 4-week block ("Get your 5 km under 25:00"). Athletes join, and their verified limits show the progress every week. That's proof for the coach, and a goal for the athlete.

**Who it's for:** athletes whose limit stops moving. The app can spot this ("no improvement in 4 efforts") and suggest a coach at exactly that moment.

**Watch out for:**
- **Strava data.** Showing a coach an athlete's Strava-based numbers means showing them to another person. Get the athlete's explicit consent, and Strava's answer (it's the same question as the boards; SETUP.md step 5).
- **Payments.** Taking money for coaches means Stripe Connect, coach payouts, terms of service and tax. That's a bigger build (2-4 weeks [estimated]). For the first 1-2 coaches, take payments by hand outside the app.

## 3. Subscriptions ("LIMITLINE Pro")

Follow Duolingo's paid-tier idea: **sell convenience and insight, never an advantage.** Fairness is the product. If anyone can pay to climb the board, nobody believes the board.

**Never for sale:** embers, ember multipliers, anything that changes a result, a %, or a board position.

**Possible Pro perks:**
- **Streak freeze.** One missed week a month doesn't break your streak, for illness or travel.
- **Deeper progress.** Charts of each limit over time, your best weeks, and how far you've improved since you joined.
- **Custom quests.** Any distance or duration you choose, for personal goals. These stay off the shared boards.
- **Early access** to brand drops and challenges.
- **A discount** on partner coaches' plans.

**When to build it:** once the streak keeps most active athletes going for 2-3 months, and there are at least 3 perks people actually ask for. Stripe Billing handles the payments (about a week to add [estimated]).

## What happens now

- **This month:** keep the pilot free. Start the Instagram content race. Talk to one small brand about stocking the shop (a barter is fine).
- **During the pilot:** track the numbers a brand will ask about: active athletes per week, entries per quest, and posts made from share cards.
- **After the pilot passes (late Dec):** build sponsored quests and shop codes, then run the first paid campaign.
- **Q1 2027:** content challenges, and a coaching beta with 1-2 coaches paid by hand.
- **Later:** Pro, once retention earns it.

Nothing paid is built yet, on purpose. Payments need a Stripe account, terms of service and tax setup, and they would change what the pilot measures.
