# Common Ground Matrix

Common Ground Matrix compares two countries using World Bank indicators and surfaces where they are statistically most similar.

## Design System

This project uses the **PostHog-inspired design library** installed via:

`npx getdesign@latest add posthog`

The active design spec lives in [DESIGN.md](./DESIGN.md) and should be used as the primary UI reference when updating layout, components, colors, typography, and chart presentation.

## Tech

- Next.js (App Router)
- Tailwind CSS
- Lucide React
- Recharts
- World Bank API

## Quality Gate

Before pushing, run:

`npm run check`

This runs lint, typecheck, test coverage thresholds, and production build.
