# Contributing to FORGEAI

Thanks for wanting to help. FORGEAI is an early testnet build, so small and focused changes land fastest.

## Getting set up

```bash
npm install
cp .env.example .env.local
npm run dev
```

Node 24 or newer. The app runs at http://localhost:3000 and seeds demo data on first boot. Delete the `.data` folder to start fresh.

## Before you open a pull request

1. `npm run typecheck` passes.
2. `npm run build` passes.
3. With the dev server running, `npm run check:copy` passes.
4. You tried the change in a browser, on desktop and at phone width.

## House rules

**No dash characters in user facing text.** Write "multi step", "onchain", "nonfinancial". Use "to" for ranges and `·` as a separator. The copy check enforces this on every page.

**Plain, honest copy.** Short sentences, no hype, no emoji. Never present simulated or demo data as real. Never promise tokens, rewards or allocations.

**Keep it industrial.** Use the existing color tokens in `src/app/globals.css` and the components in `src/components/ui.tsx` before adding new styles. No gradients.

**Missions are versioned.** If you change a mission's tasks, answers, budget or rubric, bump its `version` in `src/lib/catalog.ts` so old scores are never compared with new ones.

**Scoring changes need a reason.** Changes to `src/lib/engine.ts` or `src/lib/forge.ts` should explain in the pull request how scores or XP move, ideally with before and after numbers.

## Good first contributions

1. New mission content for an existing mechanic.
2. Accessibility fixes: focus order, labels, contrast.
3. Tests for the evaluator and progression rules.
4. A Postgres adapter behind the `read` and `write` interface in `src/lib/db.ts`.

## Reporting bugs

Open an issue with steps to reproduce, what you expected and what happened. For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

By contributing you agree that your work is released under the [MIT License](LICENSE).
