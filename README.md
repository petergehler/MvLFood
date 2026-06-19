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

The recommended simple workflow is:

1. A scheduled GitHub Action runs `scripts/update-source-text.mjs`.
2. It downloads the Hungry Elk PDF URL from the Stollsteimer WordPress REST API.
3. It downloads the MPH PDF URL supplied through the workflow input or environment.
4. It extracts text into `data/source-text/`.
5. A human or a later parser updates `data/menu.json`.

This is intentionally conservative because both current sources are PDF/table based, and food allergy filtering should not depend on fragile phone-side parsing.

## Open questions

- Which food trucks should be included, and where is their most reliable schedule/menu source?
- Should allergy filtering hide unknown items, or keep them visible with an `ask` badge?
- Do you want a fully automatic parser that commits `data/menu.json`, or a safer weekly review step before publishing?
