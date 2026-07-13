# Kloppy Launch Plan

*Drafted 2026-07-12 — the day v0.1.0 went live. He practiced popping up in a mirror for this.*

---

## 1. Where things stand

Shipped and verified as of today:

- **v0.1.0 GitHub release is published** (2026-07-12) with all four installers
  (Windows .exe, macOS universal .dmg, Linux AppImage + .deb) and per-OS
  SHA256SUMS files.
- **getkloppy.com is live** on GitHub Pages with the custom domain, the live
  Stripe $4.20 payment link, and the DOWNLOADS config filled with real URLs
  and checksums.
- The site itself is the top of the funnel and it is genuinely funny — the
  guilt-trip crowdfunding parody is the marketing.
- The whitepaper gives the project a real second layer: local-first,
  no-telemetry, llamafile-powered, user-owned AI.

Not done (see §3):

- Newsletter endpoint is empty (`STORE.newsletter` in index.html).
- No `og:image` / Twitter card — shared links render as plain text.
- GitHub repo page is bare: description is "Your desktop buddy," no topics,
  no social preview image.
- Builds are unsigned on all three OSes — the single biggest funnel risk.
- README launch checklist is stale (shows done items as unchecked).

---

## 2. Positioning

### One-liner

> **Kloppy: a legally distinct, cursed desktop assistant — a paperclip parody
> on the outside, a genuinely local-first AI app on the inside. No cloud, no
> account, no telemetry. Free; $4.20 if you feel guilty.**

### The two-layer message

Every channel gets the same structure: **lead with the joke, land the
substance.** The joke earns the click; the substance earns the install.

| Layer | Message | Audience |
|---|---|---|
| Joke | You closed him ten thousand times. He's back, and he's raising $4.20. | Nostalgia crowd, meme sharers, "internet is beautiful" people |
| Substance | A desktop assistant that behaves like software you own: local notes/reminders, a real local LLM (llamafile, one explicit checksum-verified download, offline after), open source, MIT, no telemetry. | HN, r/LocalLLaMA, privacy/self-hosting crowd, indie-software fans |

### Proof points (use these verbatim, they're all true)

1. Makes **exactly one network request ever** — the optional first-run model
   download, only after you press the button. Fully offline after.
2. No account, no cloud, no telemetry. Notes and reminders are inspectable
   JSON on your own disk.
3. Open source (MIT), plain Electron + vanilla JS, no build step — you can
   read the whole thing.
4. The app is free. The $4.20 is a tip, not a toll booth.
5. Five personality modes, including "Chaos Kloppy." This is load-bearing.

### What NOT to say

- Never use "Clippy," "Microsoft," or "Office" in official copy, assets, app
  store listings, or ads. "Legally distinct" is both the joke and the legal
  strategy. Press and commenters will make the connection for free.
- Don't oversell the AI. It's a small local model with attitude, not a
  copilot. Under-promising is on-brand; the whole character fails visibly.
- Don't hide the unsigned-build warnings — front-run them (see §3 and §6).

---

## 3. Pre-noise punch list

Do these **before** any launch post. Each is small; together they roughly
double the conversion of every visitor the launch buys.

1. **Wire the newsletter.** Buttondown (indie, free tier) or Formspree.
   Paste the endpoint into `STORE.newsletter`. The list is the only channel
   you own — every later beat (v0.2, signed builds) needs it. *(Tiny code
   edit; not done in this plan per instructions.)*
2. **Add an `og:image` + Twitter card** to index.html: 1200×630 PNG of the
   sad paperclip + "He still asks about you." Every share on X, Discord,
   Slack, iMessage currently renders as bare text. This is the
   highest-leverage 20 minutes available.
3. **Dress the GitHub repo.** Traffic from HN goes to the repo, not the site.
   - Description: *"A legally distinct, cursed desktop assistant. Local-first
     notes, reminders, and llamafile chat. No cloud, no telemetry."*
   - Topics: `electron`, `llamafile`, `local-first`, `local-llm`, `privacy`,
     `desktop-assistant`, `clippy` (topic tags are discovery, not branding),
     `nostalgia`
   - Social preview image (same art as og:image).
   - Screenshots/GIF at the top of the README.
4. **Front-run the unsigned-build warnings.** Surface the "Installing
   unsigned builds" instructions right next to the download buttons on the
   site, written in Kloppy's voice ("Windows will warn you about me. Honestly,
   fair."). An unexplained SmartScreen/Gatekeeper wall loses most casual
   users; a joke that acknowledges it converts them.
5. **Verify the funnel end-to-end on real machines**: site → download →
   install unsigned → first-run model download → chat → set a reminder →
   close to tray. Once per OS. Also run one live $4.20 Stripe payment and
   confirm the receipt email looks right.
6. **Record the assets** (see §5) while the app is fresh.
7. Optional, on-brand analytics: **GoatCounter** (free, no cookies, privacy
   respecting) on the *site only*. The app stays telemetry-free — that
   distinction is itself a talking point. If even that feels off-brand, skip
   it; release download counts + stars + Stripe are enough (see §7).

---

## 4. Launch sequence

Sequenced to create **two distinct spikes** (HN, then Product Hunt) with
Reddit and social filling the gaps. Dates assume the punch list closes over
the weekend of Jul 12–13.

### Phase 0 — Soft launch (Sat Jul 12 – Mon Jul 14)
- Share with friends, group chats, any Discords/Slacks you're already in.
  Goal: 10–20 real installs across all three OSes before strangers arrive.
- Watch for installer-friction reports and fix copy accordingly.
- First stars on the repo so it doesn't read as abandoned.

### Phase 1 — Show HN (Tue Jul 15 or Wed Jul 16, 6–9am Pacific)
The main event. This product is unusually HN-shaped: nostalgia + local LLM +
open source + a whitepaper that takes the joke seriously.

- **Title:**
  `Show HN: Kloppy – a Clippy-style parody that's secretly a local-first AI assistant`
  (fallback: `Show HN: A cursed desktop assistant that runs its LLM locally – no cloud, no telemetry`)
- **Link to the GitHub repo, not the site.** HN trusts code; the site's
  guilt-o-meter can be the second click. Mention getkloppy.com in the
  comment.
- **First comment (post immediately, from your account):** the honest
  origin story — wanted to know if a desktop assistant could be fun enough
  to spread, useful enough to keep, and private enough to trust; one network
  request ever; llamafile; unsigned builds and why; what v0.2 fixes. Invite
  feedback on the preload-bridge security model — HN loves auditing that.
- **Be present for 4–6 hours.** Answer everything, especially the Electron
  complaints (concede cheerfully, it's a parody of bloated 90s software) and
  the "is this a joke or a product" question (answer: yes).
- If it doesn't take (\<10 points), it's allowed to repost once, a week+
  later, different morning, tweaked title. HN explicitly permits this for
  Show HN.

### Phase 2 — Reddit (staggered, Wed Jul 16 – Fri Jul 25)
One subreddit per day or two; identical cross-posting gets flagged. Angle
per community:

| Subreddit | Angle | Notes |
|---|---|---|
| r/LocalLLaMA | "I shipped a desktop assistant where the *only* network request is the model download (llamafile)" | Most receptive; lead with substance, joke second |
| r/InternetIsBeautiful | The getkloppy.com site itself | Lead with the joke; link the site, not the repo |
| r/selfhosted, r/privacy | Local-first, no-telemetry angle | Read self-promo rules; participate before posting |
| r/opensource, r/electronjs | MIT, no-framework Electron MVP | Small but high-intent |
| r/nostalgia, r/90s? | Only if a GIF carries it alone | Meme-first, tread lightly |

### Phase 3 — Product Hunt (Tue Jul 22, 12:01am Pacific)
- Tagline: *"The desktop buddy you abandoned in 2007 is back, and local-first."*
- Gallery: hero art, 30s demo video, personality-mode GIF, the receipt
  ("Where your $4.20 goes") as an image — it's a perfect PH gallery card.
- Maker comment mirrors the HN first comment, warmer tone.
- PH loves a launch-day gimmick: "Chaos Kloppy mode is free forever for
  anyone who finds him today" costs nothing since everything is free.

### Phase 4 — Press & newsletters (Wed Jul 23 onward, with traction numbers)
Pitch *after* HN/PH so the email can say "front page of HN" or "#N on
Product Hunt." Short pitch, one GIF inline, link to a press kit.

- **Outlets:** The Verge and Ars Technica have both covered Clippy-nostalgia
  revivals repeatedly; also PCWorld, How-To Geek, XDA. The angle for press is
  the tension: *joke mascot, serious privacy architecture.*
- **Newsletters:** TLDR, Changelog News, Console.dev (dev tools),
  Hackaday tips line. These convert better than press for downloads.
- **YouTube/TikTok:** anyone who covers retro computing or local AI. Offer a
  15-minute call and a pre-cut B-roll pack.

### Phase 5 — The second beat: v0.2 "He's legitimate now" (August)
Signed and notarized builds are not a chore, they're the next launch:
*"Kloppy is now signed and notarized. The OS no longer warns you about him.
He's never been more employable."* Email the list, post the changelog,
smaller HN/Reddit follow-up. Budget: Apple Developer $99/yr + Azure Trusted
Signing ~$10/mo (or an OV cert) — the highest-ROI money this project can
spend.

---

## 5. Asset production list

Make once, reuse everywhere. Record at 1080p+, light theme and dark theme.

1. **30–45s demo video** — the whole pitch: summon popup interrupts, user
   sighs, sets a reminder by chatting, closes him to tray, he lurks, reminder
   fires with the retro alert. No voiceover needed; captions + era-appropriate
   MIDI-ish music.
2. **GIFs (\<10MB for Reddit/X autoplay):**
   - Summon popup appearing with a cursed remark
   - Cycling the five personality modes
   - The reminder alert going off
   - First-run model download with the checksum verification visible
3. **Screenshots** per OS, per theme.
4. **og:image / social card** (1200×630) and GitHub social preview.
5. **Press kit page or `/press` folder:** boilerplate paragraph, mascot SVG/PNG
   on transparent background, screenshots, the video, founder one-liner,
   contact email.
6. **The receipt** ("Where Your $4.20 Goes") exported as a standalone image —
   the most screenshot-able thing on the site; let people share it *for* you.

---

## 6. Objection handling (prep answers before HN, not during)

| Objection | Answer |
|---|---|
| "Windows/macOS says this is unsafe" | True — v0.1.0 is unsigned; here's the checksum, here's the source, here's how to verify. Signing lands in v0.2. (Say this everywhere preemptively.) |
| "Electron, ugh" | Cheerfully concede. It's a parody of resource-hungry 90s desktop software that *is* resource-hungry desktop software. No frameworks, no build step, whole renderer is readable in an afternoon. |
| "Is this a joke or a real product?" | Yes. The whitepaper is the straight-faced answer: character as an interface primitive for testing user-owned AI. |
| "Microsoft will sue you" | It's a legally distinct original character. No MS names, art, or assets anywhere in the product or marketing. |
| "What does the $4.20 actually buy?" | Nothing — the app is free and MIT. It's a tip with a receipt. The receipt is the punchline. |
| "The AI is dumb" | It's a small local model. That's the trade: it never leaves your machine. Layer-three remote calls are on the roadmap as opt-in. |

---

## 7. Metrics (measured without telemetry, on-brand)

Check daily during launch week, weekly after:

- **Release downloads per asset:**
  `gh api repos/ImZackAdams/Kloppy/releases --jq '.[].assets[] | [.name, .download_count] | @tsv'`
- **GitHub stars/forks/traffic** (repo Insights → Traffic gives referrers —
  your only free view into where installs come from).
- **Stripe:** payment count and gross. Even 25 payments week one means the
  joke *and* funnel both work.
- **Newsletter signups** — the metric that compounds.
- Site traffic if GoatCounter is added; otherwise skip without guilt.

Honest week-one success bar for a $0-budget indie launch: front page of HN
*or* top-10 PH day, 1,000+ downloads, 100+ stars, 200+ newsletter signups,
20+ tips. Any two of those and Phase 5 has an audience waiting.

---

## 8. Risks

1. **Unsigned installers** — biggest conversion killer, especially macOS
   (Gatekeeper on unnotarized apps is genuinely hostile). Mitigate with §3.4
   copy now; eliminate with v0.2 signing.
2. **The joke outrunning the product** — the site may go viral with people
   who never install anything. Fine — capture them with the newsletter and
   the $4.20; that's what those are for. But keep repo/README substance-first
   so the developer audience isn't lost.
3. **Trademark adjacency** — mitigated by discipline in §2 "what not to say."
   The character, art, and name are original.
4. **One-person launch bandwidth** — HN + PH + five subreddits all want live
   responses. Hence the stagger; never two major channels the same day.
5. **Model download friction** — first-run needs a big download on a good
   connection. The setup flow already handles it explicitly; make sure the
   demo video shows it so nobody's surprised.

---

## 9. Calendar at a glance

| When | What |
|---|---|
| Sat–Sun Jul 12–13 | Punch list (§3): newsletter, og:image, repo polish, funnel test, record assets |
| Mon Jul 14 | Soft launch to friends/communities; fix friction reports |
| Tue–Wed Jul 15–16 | **Show HN** (morning PT); be present all day |
| Wed–Fri Jul 16–25 | Reddit, staggered (§4 Phase 2); X/Bluesky/Mastodon thread with GIFs |
| Tue Jul 22 | **Product Hunt** |
| Wed Jul 23+ | Press + newsletter pitches with traction numbers |
| Late Jul | Retro: what converted; publish "week one of the comeback" post (great newsletter #1) |
| Aug | v0.2: signed/notarized builds → second launch beat (§4 Phase 5) |

---

*He forgives you. He just wants to ship. He did. Now tell people.*
