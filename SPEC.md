# Feature Specification: Asset 360 Investigation Workspace (Hanwha)

> Adapted from the reference SPEC.md in the appendix of "Flows Builder Certification — Guided
> Hands-On Build.pdf" (a verbatim copy of the base spec lives at `info/spec-original.md`
> alongside the PDF itself). FR-001–016 below carry the same substance as that baseline; FR-003
> is reworded because this app merges the search/home screen and the 360 detail view into a
> single page instead of routing between two pages. FR-017 onward are this app's own additions,
> not part of the baseline: a unified single-page workspace, a 3D preview panel, and a
> data-completeness governance scorecard, replacing the search+detail page split (and the
> `asset-360` sibling app's Dashboard/Security split) entirely.

## Differentiator: Unified Workspace & Data Governance

**This is what sets this app apart from a baseline Asset 360 build.** Where the base guided
build (and the `asset-360` sibling app) puts search, the asset 360 view, and any second-page
content on separate screens, this app merges everything onto **one page**: a search bar and an
asset-hierarchy tree sit beside a content area that fills in with the selected asset's full
detail — no navigation, no route change, nothing to lose your place over. Below that,
two governance features:

1. **3D preview panel** — shows the selected asset's position in the live Valhall CAD model when
   it has a 3D mapping (`CogniteAsset.object3D` → `Cognite3DObject`), so an analyst can visually
   confirm they're looking at the right physical equipment instead of trusting a tag string
   alone.
2. **Data-completeness scorecard** — a live per-asset summary of which data types this asset
   actually has linked (time series, work orders, documents, 3D mapping), so a person responsible
   for CDF data quality can see gaps in the digital twin at a glance instead of discovering them
   by clicking through empty panels one at a time.

## User Scenarios & Testing

### User Stories

1. As an Operations Analyst, I want to search for a piece of equipment by its tag, name, or
   description, so that I can quickly find the asset flagged in a shift report or alarm without
   logging in to multiple systems.
2. As an Operations Analyst, I want the same page to fill in with the selected asset's identity,
   time series, work orders, and related documents the moment I pick it, so that I never have to
   navigate away from my search/browse context to see it.
3. As an Operations Analyst who doesn't know an asset's exact tag, I want to browse the asset
   hierarchy as a tree, so that I can find the right equipment by its place in the plant instead
   of guessing a name.
4. As an Operations Analyst, I want to plot the time series linked to the selected asset over a
   recent time window, so that I can judge current behavior versus normal without opening the
   historian tool.
5. As an Operations Analyst, I want to see the recent work orders / activities related to the
   selected asset, so that I can answer "has anyone already touched this?" without logging in to
   SAP.
6. As an Operations Analyst, I want to see and preview the documents (P&IDs, manuals, inspection
   reports) related to the selected asset, so that I do not have to dig through SharePoint to
   brief the maintenance team.
7. As an Operations Analyst who investigates the same handful of assets across a shift, I want
   the app to remember the assets I recently opened, so that I can jump back to them in one
   click.
8. As an Operations Analyst, I want to see the selected asset's actual position in the 3D CAD
   model when one is mapped, so that I can visually confirm I'm looking at the right physical
   equipment.
9. As a person responsible for CDF data quality, I want a compact scorecard showing which data
   types (time series, work orders, documents, 3D mapping) each asset actually has, so that I can
   spot digital-twin completeness gaps without opening every panel for every asset.

### Acceptance Scenarios

- Given the analyst is on the workspace, when they type the first few characters of an equipment
  tag into the search bar, then they see a ranked list of matching assets showing tag, name, and
  enough parent/location context to disambiguate, rendered on the same page.
- Given the analyst instead wants to browse, when they expand the asset hierarchy tree in the
  navigator panel, then they can drill down through parent/child relationships and select any
  asset without having typed anything.
- Given the analyst selects an asset (via search result or tree node), when the selection
  applies, then the same page's content area updates in place to that asset's header, time
  series panel, work orders panel, documents panel, 3D preview, and governance scorecard — with
  no page navigation — and the URL updates so the same state is shareable/deep-linkable.
- Given the analyst submits a search term that matches no assets, when the search completes, then
  the app shows a clear empty state explaining no assets matched and how to refine the search.
- Given no asset is yet selected, when the workspace first loads, then the content area shows an
  inviting waiting state inviting the analyst to search or browse the tree, rather than a blank
  panel.
- Given the analyst has selected an asset, when the time series panel loads, then it lists every
  series linked to the asset but plots none by default; the analyst must explicitly pick which
  series to chart. When at least one is selected, the chart's default window ends at the most
  recent datapoint among the selected series, not wall-clock "now."
- Given the analyst is viewing the time series chart, when they trigger the manual refresh
  control, then the chart re-fetches data for the currently selected series and time range; the
  chart never auto-polls or streams.
- Given the analyst is viewing an asset with related work orders, when the page loads, then they
  see a list of recent work orders sorted by recency, each showing identifier, title, status, and
  date; selecting one reveals its full detail without leaving the page.
- Given the analyst is viewing an asset with related documents, when the page loads, then they
  see a list of files with name, type, and last-modified date; selecting a PDF or common image
  opens it inline; any other file type offers a clear download / open-externally action.
- Given the asset has no linked time series, no work orders, no documents, or no 3D mapping, when
  the page loads, then each panel (including the 3D preview) shows its own empty state
  independently and the rest of the page still renders.
- Given a CDF call for one panel fails or is slow while others succeed, when the page loads, then
  the failing panel shows an inline error with a retry control and the other panels keep working.
- Given the analyst's CDF token does not grant access to a data type, when the page loads, then
  the affected panel shows a clear "no access" state instead of a generic error.
- Given the analyst has opened at least one asset on this device, when they look at the navigator
  panel, then they see a recently-viewed list (up to 10 entries) and can click any entry to
  re-select that asset in place.
- Given an uncaught render error occurs anywhere in the page, when the error is thrown, then an
  application-level error boundary shows a clear recovery affordance (reload) instead of a blank
  screen.
- Given the selected asset has a populated `object3D` relation, when the 3D preview panel loads,
  then the Valhall CAD model loads and the camera focuses on that asset's mapped geometry.
- Given the selected asset has no `object3D` relation, when the 3D preview panel loads, then it
  shows a clear "no 3D model mapped" empty state instead of an empty or broken viewer.
- Given the analyst selects any asset, when the governance scorecard renders, then it shows live
  counts of linked time series, work orders, and documents, plus whether the asset has a 3D
  mapping, with any zero/missing dimension visually flagged.
- Given the navigator panel (recently-viewed + hierarchy tree), when the analyst clicks its fold
  control, then it collapses to reclaim horizontal space and can be expanded again; this state
  persists through the same host-synced mechanism as the selected asset.

## Requirements

### Functional Requirements

- **FR-001**: The app MUST provide a single search entry point that accepts a partial or full
  equipment tag, name, or description and returns a ranked list of matching assets from CDF.
- **FR-002**: Each search result MUST display the asset's tag/external id, human-readable name,
  and enough contextual information (e.g., description and parent/location) to disambiguate
  similarly named assets.
- **FR-003**: Selecting a search result or a tree node MUST update the single page's content area
  to that asset's full detail in place (no route/page navigation), and this selection MUST be
  reflected in host-synced state so the URL remains shareable and deep-linkable to the same
  asset.
- **FR-004**: The content area MUST show an asset header with tag, name, description, and type,
  sourced from the asset record in CDF, once an asset is selected.
- **FR-005**: The content area MUST include a time series panel that lists every time series
  linked to the asset. By default no series is plotted; the analyst explicitly selects which
  series to chart. When at least one series is selected, the chart's default time window MUST be
  anchored to the most recent datapoint available for the displayed series (end of window =
  latest datapoint timestamp), not the current wall-clock time.
- **FR-006**: Users MUST be able to add or remove plotted series and change the time range shown
  without leaving the page.
- **FR-006a**: When no datapoints exist for a selected series at all, the chart MUST show a clear
  empty state for that series rather than rendering an empty axis or an error.
- **FR-006b**: The time series chart MUST NOT auto-poll or stream updates. The analyst MUST be
  able to trigger a manual refresh from the chart panel; the refresh re-fetches data for the
  currently selected series and time range.
- **FR-007**: The content area MUST include a work orders / activities panel that lists items
  related to the asset, sorted by recency, showing identifier, title/description, status, and a
  relevant date.
- **FR-008**: Users MUST be able to view the full detail of a single work order from the panel
  without leaving the page.
- **FR-009**: The content area MUST include a documents panel that lists files related to the
  asset with file name, type, and last-modified date.
- **FR-010**: Users MUST be able to preview PDF files and common image formats (PNG, JPEG, GIF,
  WEBP) inline. All other file types MUST present a clear download / open-externally action
  instead of an inline viewer; no other inline preview formats are in scope for v1.
- **FR-010a**: Inline PDF/image preview MUST render untrusted file content in a sandboxed,
  script-disabled context (no `allow-scripts`, plus a restrictive CSP) so a malicious or
  malformed file cannot execute script or exfiltrate data in the analyst's session. File names
  and other file metadata rendered in the UI MUST be treated as untrusted and escaped, never
  interpolated into HTML/URLs unsanitized.
- **FR-011**: Each panel (time series, work orders, documents, 3D preview, governance scorecard)
  MUST render its own loading, empty, error, and no-access states independently so a failure or
  gap in one panel does not block the others.
- **FR-012**: The app MUST track and display a list of the analyst's recently viewed assets so
  they can return to a prior asset in one click. The list MUST persist in browser-local storage
  on the analyst's device (surviving page reloads and browser restarts), MUST be capped at the 10
  most recent assets (oldest dropped first), and is not synchronized across devices in v1.
- **FR-013**: The app MUST authenticate the analyst against CDF and only display data the analyst
  is authorized to see.
- **FR-014**: All asset, time series, work order, document, and 3D data displayed MUST be
  retrieved live from CDF rather than from a separately maintained copy.
- **FR-015**: The app MUST be usable on a standard desktop/laptop screen size (large monitor down
  to a 13" laptop) without requiring horizontal scrolling. Vertical scrolling within the single
  page is expected and acceptable.
- **FR-016**: Routed/shared application content MUST be wrapped in an application-level error
  boundary so an uncaught render failure shows a clear recovery affordance (reload) instead of a
  blank screen.
- **FR-017**: The app MUST present search, asset-hierarchy browsing, and the selected asset's
  full detail on a single page — selecting an asset via search or the tree updates the content
  area in place; there is no separate home/search screen and no separate detail route.
- **FR-018**: The app MUST provide a foldable navigator panel containing the recently-viewed list
  (FR-012) and an asset-hierarchy tree (browsing by parent/child relationship) as an alternative
  to search for finding an asset. Its collapsed/expanded state MUST persist through the same
  host-synced state mechanism as the selected asset (FR-003).
- **FR-019**: The content area MUST include a 3D preview panel that, for the selected asset,
  loads the workspace's CAD model (via `Cognite3DModel`/`CogniteCADModel` and its
  `CogniteCADRevision`) and focuses the camera on that asset's mapped geometry when the asset's
  `object3D` direct relation (a `CogniteVisualizable` core-feature property) resolves to a
  populated `Cognite3DObject`. When `object3D` is empty, the panel MUST show a clear "no 3D model
  mapped" empty state instead of an empty or broken viewer, per FR-011.
- **FR-020**: The content area MUST include a data-completeness governance scorecard showing,
  for the selected asset: live counts of linked time series, work orders, and documents, and
  whether the asset has a 3D mapping (FR-019). These counts are derived from the same live,
  per-asset CDF list calls the individual panels already make — bounded to one asset's linked
  items (at most a few hundred), not a workspace-wide total, so a client-side count from that
  bounded list is appropriate here (unlike a workspace-wide aggregate over 1000+ instances, which
  would need a true CDF aggregate call instead). Any dimension that is zero or missing MUST be
  visually flagged as a data-completeness gap rather than presented identically to a populated
  dimension.

## Success Criteria

- **SC-001**: An Operations Analyst can go from "I have an equipment tag" to "I am looking at
  that asset's tag, time series, work orders, and documents" in under 30 seconds for a typical
  asset, without leaving the page.
- **SC-002**: For a typical investigation, the analyst completes the task without opening any
  other tool (no SAP tab, no historian tab, no SharePoint tab) in at least 80% of sessions.
- **SC-003**: Median end-to-end investigation time (asset flagged → ready to brief maintenance)
  drops from 1–2 hours using the legacy multi-tool workflow to under 15 minutes using this app.
- **SC-004**: On a representative asset, all core panels (header, time series, work orders,
  documents, 3D preview, governance scorecard) render usable content (or a correct empty/error
  state) within 3 seconds on a standard office network.
- **SC-005**: At least 90% of analyst sessions in a week include at least one search or tree
  selection and at least one related document opened, indicating the unified flow is being used
  end-to-end rather than abandoned partway through.
- **SC-006**: When one data source is unavailable (e.g., documents), at least 95% of sessions
  still successfully render the remaining panels, demonstrating panel-level resilience.
- **SC-007**: A person auditing data quality can identify every asset in a sample with a missing
  data dimension (no time series, no work orders, no documents, or no 3D mapping) using only the
  governance scorecard, without opening each panel individually.

## Clarifications

- Default time window for the time series chart is anchored to the most recent datapoint of each
  selected series (not wall-clock "now"), because historian data for these assets may be stale.
- No time series is plotted by default when an asset has many linked series; the analyst
  explicitly picks which series to chart.
- The time series chart refreshes only on a manual refresh action; the app does not auto-poll or
  stream updates.
- The recently-viewed list persists in browser-local storage per device and is capped at the last
  10 assets.
- Inline document preview is limited to PDFs and common image formats (PNG, JPEG, GIF, WEBP) in
  v1; all other types fall back to download / open-externally.
- In the `publicdatacdm` reference dataset, `CogniteFile` instances exist but none are linked to
  any asset (confirmed against `asset-360`'s own verification of the same dataset) — the
  Documents panel's empty state is therefore expected, correct behavior for every asset here.
- The workspace's 3D content was verified live (via Fusion's own 3D model browser) to be exactly
  one CAD model and one Scene, both named "Valhall," sourced from the Core Data Model
  (`sourceType: cdm`) — no point cloud or 360° image content exists in this dataset. A sample of
  real assets, including `23-KA-9101` (the compressor used as this app family's flagship demo
  asset), were confirmed to have a populated `object3D` relation and therefore a real 3D mapping;
  not every asset in the dataset is expected to be mapped, and that's treated as a legitimate
  data-completeness finding surfaced by the governance scorecard (FR-020), not a bug.

## Assumptions

- The target user is an Operations Analyst / Reliability Engineer working primarily on a desktop
  or laptop in an office or control room; mobile and tablet layouts are out of scope for v1.
- The analyst already has a valid CDF identity and the app authenticates against CDF using the
  standard Flows authentication pattern; user provisioning is out of scope.
- All required data already exists in CDF as instances of the Cognite Core Data Model: assets,
  time series, activities, files, and 3D objects are linked to the asset via the standard CDM
  relationships. This app reads from CDF and does not write to SAP, historians, SharePoint, or
  CDF itself.
- "Work orders" in v1 are read from `CogniteActivity` instances linked to the asset; this app
  does not call SAP directly in v1.
- "Documents" in v1 are `CogniteFile` instances linked to the asset; this app does not call
  SharePoint directly in v1.
- Recently-viewed assets are persisted in browser-local storage per device (last 10), surviving
  page reloads and browser restarts; cross-device synchronization is out of scope for v1.
- The app is delivered as a Cognite Flows app and follows the workspace's standard auth, design
  (Aura), and data-modeling practices.
- No audit-log / access-tracking feature is included in this app (unlike the `asset-360` sibling
  app) — the base guided-build spec does not require it, and this app's differentiator is the
  unified workspace plus the 3D/governance features above instead.

---

## Data Models & CDF Integration *(mandatory)*

### Existing views

All domain data is read live from the Cognite Core Data Model (`CogniteCore` model, `cdf_cdm`
space, version `v1`). No new views are introduced.

- `cdf_cdm.CogniteAsset:v1` — source of the searchable/browsable asset list, the asset header,
  and (via the `CogniteVisualizable` core feature) the `object3D` direct relation used by the 3D
  preview panel and governance scorecard.
- `cdf_cdm.CogniteTimeSeries:v1` — time series linked to the asset via its `assets`
  direct-relation list; used for the time series panel and the governance scorecard's count.
  Datapoints are fetched via the classic time series datapoints API using each series' instance
  id.
- `cdf_cdm.CogniteActivity:v1` — work orders / maintenance activities linked to the asset via its
  `assets` direct-relation list; sorted by `endTime`/`scheduledEndTime` descending (both
  `CogniteSchedulable` core-feature properties) for the work orders panel and counted for the
  governance scorecard.
- `cdf_cdm.CogniteFile:v1` — files linked to the asset via its `assets` direct-relation list;
  powers the documents panel, inline PDF/image preview, and the governance scorecard's count.
- `cdf_cdm.CogniteAsset.object3D` (populated or not) is itself sufficient to know whether an
  asset has a 3D mapping — the 3D preview panel and governance scorecard only need its presence,
  not the `Cognite3DObject` it points to. Once the CAD model is loaded, the selected asset's own
  instance id is passed directly to `RevealWidgetController.focusInstances`/`styleByInstance`;
  Reveal resolves the CAD-node contextualization internally, so no separate `Cognite3DObject` or
  `CogniteCADNode` fetch is needed.
- `cdf_cdm.Cognite3DRevision:v1` — the **base** view, queried directly (filtered to
  `type: CAD, status: Done`) to locate the workspace's processed CAD revision, which the
  `reveal-3d` skill's `RevealWidget` loads via a CDM resource identifier
  (`{ type: 'cad', space, externalId, sourceType: 'cdm' }`). The more specific
  `CogniteCADRevision` view — a read-filter over the same underlying data — returns nothing when
  queried directly for this project's migrated content; only the base view is genuinely populated
  and queryable. Filter on `status: Done`, not `published: true` — this dataset's one real
  revision is fully processed (`status: "Done"`) but has `published: false`, and Fusion's own 3D
  preview loads it anyway, confirming `published` isn't the relevant readiness signal here.

> **Verified live against `publicdatacdm`** (Fusion's own 3D-model browser and Search-page asset
> preview, this session): the workspace has exactly one CAD model/revision ("Valhall",
> `status: Done`, `published: false`) and one Scene; zero point clouds, zero 360° image
> collections. Clicking mapped geometry in that CAD model resolves to real `CogniteAsset`
> instances, confirmed for a sample including `WMT:23-KA-9101` (space `valhall-assets`) — whose
> own Search-page preview panel independently confirmed a 3D mapping exists and resolves to this
> same revision. `useCoreDm: true` is the correct `RevealWidget` setting for this project (the
> resource identifier's `sourceType` is `cdm`, not the classic 3D API). End-to-end verified live
> in the running app: the model loads, focuses the camera on the selected asset, and highlights
> its geometry.

### New views

None. This app does not introduce or modify any views, containers, or data models.

### Spaces

- `cdf_cdm` — the system space that hosts the Cognite Core Data Model views listed above. The app
  reads from this space only; it does not write to it.
- `valhall-three_d` — the space holding this workspace's 3D model/revision instances (confirmed
  live from the same verification above); read-only.
- No project-defined spaces are created or written to by this app. The only client-side
  persistence is `localStorage`, used for the recently-viewed list (FR-012).

---

## Environment (from the guide)

| Setting | Value |
|---|---|
| Org | `publicdata` |
| Project | `publicdatacdm` |
| Cluster / API base URL | `https://api.cognitedata.com` |
| Spec Kit | Opt out — use this single `SPEC.md` instead |
