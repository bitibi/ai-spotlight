# AI Spotlight

Live audience-voting segment for the **Practically AI** monthly meetup. The audience scans a QR code, answers 3–4 short questions on their phone (no login), and the results are exported as a markdown report that drives a live Claude-generated slide deck on stage.

See [HANDOFF.md](HANDOFF.md) for the full product brief, question set, and stage flow.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Server-Sent Events** for live result updates to the presenter view
- **In-memory state** — each meetup is a standalone session
- **Docker → Google Cloud Run** for deployment

## Routes

- `/` — voter view (mobile-first, no login)
- `/present` — presenter view with live bar charts, "next question" control, report export
- `/join/[code]` — QR-friendly entry that drops a participant cookie and forwards to `/`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the voter view and [http://localhost:3000/present?key=dev](http://localhost:3000/present?key=dev) for the presenter view.

## Deploy to Cloud Run

```bash
gcloud run deploy ai-spotlight \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 1
```

Pinning to a single instance keeps in-memory session state coherent for the duration of the meetup.
