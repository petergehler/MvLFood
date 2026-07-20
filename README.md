# MvLFood

Food options around Maria-von-Linden-Strasse.

Small installable web app for quick lunch decisions near Maria-von-Linden-Strasse.

## Run locally

```sh
npm run dev
```

Then open `http://localhost:5173`.

## Install on iOS and Android

This is a Progressive Web App. On Android, open the URL in Chrome and use install/add-to-home-screen. On iOS, open it in Safari and use Share > Add to Home Screen.

## Data approach

The app only reads `data/menu.json`. That keeps the phone app fast, offline-friendly, and independent of cross-origin rules or PDF parsing.

The normalized feed has:

- `sources` for Hungry Elk, MPH, and future food trucks
- `days[].items[]` for all visible food options
- `diet` values: `vegan`, `vegetarian`, `meat`, `fish`, or `unknown`
- `allergens` using the source codes printed on the plans

Food trucks should be added as another source with `"kind": "truck"` and normal items for the days they appear. The UI will automatically show the source badge.

Source logos live in `data/images/logos/`. The Max Planck mark was looked up from Wikimedia Commons' Max Planck Forschung SVG, and the Hungry Elk mark was derived from a provided screenshot by extracting the elk line art into a small transparent PNG.

Spicetripping should only be added to the feed for the days explicitly mentioned in the weekly email. Save the email body as text and the attached menu image into `data/images/trucks/`, then run:

```sh
npm run parse:spicetripping -- --email=/path/to/email.txt --image=data/images/trucks/spicetripping-YYYY-MM-DD.png
```

The helper extracts the service date, time, and location from the email and emits normalized JSON to paste into `data/menu.json`. The menu image can be attached to truck items with the optional `image` field.

For Max-Planck-Haus, parse the HTML Speiseplan table instead of the PDF text so category and diet come from the table headers:

```sh
npm run parse:mph
```

## Update mechanism

The feed is refreshed by `.github/workflows/update-menu.yml`:

- It runs every Monday at 08:17 Europe/Berlin time, with a 10:47 backup run to reduce the chance of a missed GitHub scheduled event. It can also be started manually from GitHub Actions.
- It runs `npm run update:menu`, then `npm run validate`.
- If `data/menu.json` changed, the workflow commits the new feed back to the repository.

The updater currently owns the sources with stable public menu pages:

- Hungry Elk: discovers the current PDF through the Stollsteimer WordPress REST API and parses the positioned PDF text.
- Max-Planck-Haus: parses the public HTML Speiseplan table.

If `OPENAI_API_KEY` is available, `npm run update:menu` also sends the generated Hungry Elk and MPH items through an LLM normalization pass. The LLM only rewrites app-facing `title`, `description`, and `diet`; dates, sources, categories, prices, allergens, and opening hours stay under deterministic code and validation.

For GitHub Actions, add an `OPENAI_API_KEY` repository secret. You can optionally set an `OPENAI_MODEL` repository variable; otherwise the workflow uses `gpt-5-mini`. To force a deterministic-only local run:

```sh
MENU_LLM_NORMALIZE=0 npm run update:menu
```

Recurring non-dated entries such as Yellow Donkey are carried forward from the existing JSON for matching weekdays. Manually entered dated truck visits, such as Spicetripping emails, are preserved only when their `openingHours.date` falls inside the generated week.

For local testing:

```sh
npm run update:menu
npm run validate
```

`npm run update:source-text` is still available as a debugging helper when you want to inspect raw PDF text.

## Open questions

- Which food trucks should be included, and where is their most reliable schedule/menu source?
- Should allergy filtering hide unknown items, or keep them visible with an `ask` badge?
- Which additional food-truck feeds have reliable public sources that can be parsed automatically?
