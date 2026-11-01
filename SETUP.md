# Taking LIMITLINE live

The app is built. These steps connect it to the services it runs on. Do them in order; each takes a few minutes. Nothing here needs code.

You'll end with: a Supabase project (the database and logins), a verified email domain in Resend (login and result emails), and the app on Vercel at your domain.

## 1. Supabase: database and logins (~10 min)

1. Sign up at [supabase.com](https://supabase.com) and create a project. Pick the region closest to your athletes. Save the database password somewhere safe.
2. **Create the tables.** Open **SQL Editor**, then paste and run each file in `supabase/migrations/`, oldest first:
   1. `20261031000000_init.sql`
   2. `20261031000100_founder_save.sql`
   3. `20261031000200_profile_email.sql`

   Never run anything from `supabase/tests/`. Those files are only for local tests.
3. **Copy the keys.** In **Project Settings → API**, note the **Project URL** and the **publishable key**. You'll paste them into Vercel in step 3. The app needs no secret "service role" key.
4. **Make logins invite-only.** In **Authentication → Sign In / Providers**, keep **Email** on and turn off **Allow new users to sign up**. Only people you add can log in, so boards stay members-only.
5. **Make the login link work in any browser** (this prevents the stuck-in-the-mail-app problem from D23). In **Authentication → Email Templates**, change the link in both **Magic Link** and **Confirm signup** to:

   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Log in to LIMITLINE</a>
   ```
6. **Allow your web address.** In **Authentication → URL Configuration**, set **Site URL** to `https://YOUR-DOMAIN` and add `https://YOUR-DOMAIN/auth/confirm` and `https://YOUR-DOMAIN/auth/callback` under **Redirect URLs**.
7. **Add yourself first.** In **Authentication → Users → Add user → Create new user**, enter your email and tick **Auto confirm**. Log in to the app once (after step 3), complete the welcome step, then in **SQL Editor** run, with your email:

   ```sql
   update public.profiles set is_founder = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   This is the only way to become the founder. Nobody can do it from the app.
8. **Add each pilot athlete** the same way (**Add user**, Auto confirm). They log in with their email and pick their board name.

### Google login (optional, ~15 min, free)

Athletes tap **Continue with Google** instead of waiting for an email. It still only lets in people you added: their Google account's email must match the email you added in step 8.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project called LIMITLINE.
2. **APIs & Services → OAuth consent screen:** choose **External**, app name LIMITLINE, your support email, and add your domain under authorized domains. Publish the app (no Google review is needed for basic email login).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID:** type **Web application**. Under **Authorized redirect URIs**, paste the **Callback URL** shown in Supabase at **Authentication → Sign In / Providers → Google** (it looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
4. Copy the **Client ID** and **Client secret** into that Supabase Google page and turn Google on. The client secret is secret: paste it only into Supabase.
5. In Vercel, set `NEXT_PUBLIC_LOGIN_GOOGLE=on` and redeploy. The Google button appears on the landing screen.

### Phone login (optional, ~20 min, costs per text)

Athletes get a 6-digit code by text. Each text costs a few cents, depending on the country, paid to the SMS company.

1. Sign up with an SMS company Supabase supports (Twilio is the most common) and get its account ID, auth token and a sending number or Messaging Service.
2. In Supabase **Authentication → Sign In / Providers → Phone**, turn it on, pick the SMS company and paste its details. The auth token is secret: paste it only into Supabase.
3. In Vercel, set `NEXT_PUBLIC_LOGIN_PHONE=on` and redeploy. The phone button appears on the landing screen, and **Profile** gets a "Log in with your phone" section.
4. Athletes log in once with email or Google, then add their number in **Profile** (they confirm it with a texted code). After that, the phone button works for them. Phone login never creates new accounts.

## 2. Resend: email from your domain (~30 min, D1)

1. Buy your domain (for example `limitline.app`) from any registrar.
2. Sign up at [resend.com](https://resend.com). In **Domains**, add your domain and add the DNS records it shows at your registrar. Wait until it says **Verified**.
3. Create an **API key** with sending access. This one is secret.
4. Connect it to Supabase so login emails come from your domain: in Supabase **Authentication → Emails → SMTP Settings**, turn on custom SMTP with host `smtp.resend.com`, port `465`, username `resend`, and your Resend API key as the password. Set the sender to `hello@YOUR-DOMAIN`. Supabase's built-in email only sends about 2 an hour, which isn't enough for the pilot.

Free plan limits: 100 emails a day, 3,000 a month. That's plenty for 10 athletes.

## 3. Vercel: put the app online (~10 min)

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account, then **Add New → Project** and import `shaaningit/limitline`.
2. Under **Environment Variables**, add every name from `.env.example` with your real values. `RESEND_API_KEY` is secret; the rest are settings. Leave `NEXT_PUBLIC_LOGIN_GOOGLE` and `NEXT_PUBLIC_LOGIN_PHONE` empty until you've done their optional steps above. Set `PILOT_TIME_ZONE` to your city's zone, for example `Europe/London` or `Asia/Kolkata`.
3. Deploy. Then, in **Settings → Domains**, add your domain and follow the DNS steps.
4. From now on, every push to `main` redeploys automatically.

## 4. Before the pilot (by Fri Nov 13, the launch check)

- [ ] Log in on an iPhone (Mail app), with Gmail, and on Android, by tapping the email link (D23 test).
- [ ] If they're on: log in with Google and with your phone, and check that a Google account or phone number you didn't add is turned away.
- [ ] Add a test athlete. Paste a link, check it in **Admin**, and confirm the result email arrives and the board updates. This is the Nov 13 go/no-go check.
- [ ] Enter seed limits for each athlete in **Admin → Athletes & seeds** (their best from the last 8 weeks, plus how many efforts you saw).
- [ ] Set the embers amount in `lib/rules/config.ts` (`EMBERS.base`, currently a placeholder of 10) if you want a different number, and add shop items in **Admin → Shop**.

## Running it on your own computer (optional)

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local`, then:

```bash
npm run dev
```

Checks:

```bash
npm test
```

```bash
npm run test:db
```

`npm run test:db` needs PostgreSQL 16 installed locally.
