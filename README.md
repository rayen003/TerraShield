# TerraShield

A local-first, interactive wildfire mitigation presentation prototype. All five property records, modeled scores, overlays, and evidence illustrations are fictional.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No credentials or backend are required.

```sh
npm test
npm run build
npm run preview
```

With the dev server running, `npm run test:e2e` exercises the live pitch journey, uploads, action editing, persistence, map fallback, report export, portfolio synchronization, and reset in Chrome. Browser tests use an isolated temporary profile and save screenshots and a sample PDF to `artifacts/`.

## Demo journey

1. Open Oakridge House and review its three baseline observations.
2. Open **Ask TerraShield** and choose **What should I do first?**
3. Open the action plan or ask for a four-week plan and explicitly apply it.
4. Open **Evidence**, choose **Load prepared demo evidence**, and read the summary.
5. Choose **Apply simulated review result**. Only A and B are verified; the illustrative index changes from 82 to 58.
6. Open the mitigation report, print or save it as PDF, or download JSON.
7. Open Portfolio to see the same updated state.
8. Reset the demo to restore baseline records and clear conversations and local uploads.

## Privacy and operation

Application state and upload metadata persist in localStorage. Uploaded file contents use local object URLs only and are cleared on reload or reset. Uploads remain review-pending and never change scores automatically. Assistant replies are deterministic and run locally.

The default Leaflet map uses real OpenStreetMap street tiles with visible attribution and normal browser caching. A bundled synthetic schematic replaces the street layer if tiles fail, and the layer control allows switching to the schematic manually. Property anchors, parcel boundaries, and hazard overlays remain fictional. Fonts fall back to Georgia and Arial when unavailable. No external AI service is used. Tile usage follows the [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/); no tile prefetching or offline downloads are implemented.

## Structure

- `src/data.js`: seed records, shared domain transitions, portfolio metrics, report serialization.
- `src/main.js`: application views, accessible controls, local persistence and event handling.
- `src/map.js`: Leaflet map and synthetic layers.
- `src/assistant.js`: property-grounded local responses.
- `src/illustrations.js`: matching synthetic house illustrations and terrain schematic.
- `src/styles.css`: responsive UI and print styling.
- `tests/state.test.js`: review, portfolio, report, reset, upload isolation, and assistant invariants.
