---
appName: "Asset 360 Investigation Workspace (Hanwha)"
externalId: "asset-360-hanwha"
infra: "appsApi"
customer: "Internal — Builder Certification exercise"
tier: "Tier 1: Monitoring & reporting"
owner: ""
userCount: ""
businessValue: ""
milestones: ""
repoUrl: ""
userRole: "Operations Analyst / Reliability Engineer at an industrial facility. Reviews shift reports/alarms each morning; when an asset is flagged, investigates its history, current state, and documentation to brief the maintenance team. Works primarily at a desk in an office, occasionally the control room, on a standard desktop/laptop."
currentProblem: "Even a well-built \"Asset 360\" tool typically still splits the workflow across a search/home screen and a separate detail page (or, as in the sibling asset-360 app, a Dashboard/Security split) — so the analyst still loses their search/browse context every time they open an asset. Separately, nothing in the legacy workflow (or in a typical Asset 360 build) tells anyone whether the digital twin data itself is complete: whether an asset actually has time series, work orders, documents, or a 3D model mapped, versus silently missing one and nobody noticing."
oneSentenceStory: "As an Operations Analyst, I want to search or browse for equipment and see its full 360° detail — time series, work orders, documents, and 3D location — on one page without navigating away, so that I can investigate faster and trust that I'm looking at complete, correct data."
successCriteria: "Median investigation time drops from 1–2 hours to under 15 minutes (SC-003), same bar as asset-360, but reached without any page navigation. Additionally, a person auditing data quality can identify every asset in a sample with a missing data dimension using only the governance scorecard, without opening each panel individually (SC-007)."
userEvidence: "Same honest-assumption basis as asset-360 — the Asset 360 pattern is a well-established first-value CDF use case. The unified-single-page and data-governance-scorecard angle is this app's own hypothesis about a further improvement, not something separately user-tested; framed here as an assumption, not a validated finding."
reviewedSections:
  - appDetails
  - who
  - problem
  - tasksAndSuccess
---

# App Brief — Asset 360 Investigation Workspace (Hanwha)

## App details

- **Customer:** Internal — Builder Certification exercise
- **Tier:** Tier 1: Monitoring & reporting
- **Owner:** _(to be filled in before submission)_
- **Expected users:**
- **Business value:**
- **Milestones:**
- **Repository:**
- **App externalId:** asset-360-hanwha
- **Infra:** appsApi

## Who is this app for?

Operations Analyst / Reliability Engineer at an industrial facility. Reviews shift reports/alarms each morning; when an asset is flagged, investigates its history, current state, and documentation to brief the maintenance team. Works primarily at a desk in an office, occasionally the control room, on a standard desktop/laptop.

## What problem does this solve?

Even a well-built "Asset 360" tool typically still splits the workflow across a search/home screen and a separate detail page (or, as in the sibling asset-360 app, a Dashboard/Security split) — so the analyst still loses their search/browse context every time they open an asset. Separately, nothing in the legacy workflow (or in a typical Asset 360 build) tells anyone whether the digital twin data itself is complete: whether an asset actually has time series, work orders, documents, or a 3D model mapped, versus silently missing one and nobody noticing.

## Tasks and success

**One-sentence story.** As an Operations Analyst, I want to search or browse for equipment and see its full 360° detail — time series, work orders, documents, and 3D location — on one page without navigating away, so that I can investigate faster and trust that I'm looking at complete, correct data.

**Success criteria.** Median investigation time drops from 1–2 hours to under 15 minutes (SC-003), same bar as asset-360, but reached without any page navigation. Additionally, a person auditing data quality can identify every asset in a sample with a missing data dimension using only the governance scorecard, without opening each panel individually (SC-007).

**User evidence.** Same honest-assumption basis as asset-360 — the Asset 360 pattern is a well-established first-value CDF use case. The unified-single-page and data-governance-scorecard angle is this app's own hypothesis about a further improvement, not something separately user-tested; framed here as an assumption, not a validated finding.
