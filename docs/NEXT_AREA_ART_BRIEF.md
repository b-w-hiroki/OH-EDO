# Next Area Art Brief — 寺社前 / 茶屋まわり

Issue: #84

## Goal

Add the first physical post-Day10 expansion without changing the core loop or the approved six-slot town UI.

The new area should feel like a natural continuation of the current spring-Edo scenic set:
- bright anime-style Edo
- spring daylight
- warm washi / vermilion / indigo accents
- characters large and readable
- scenery detailed enough to feel lived-in, but with clear foreground staging space

## Runtime asset names

- `public/assets/edo/backgrounds/temple-teahouse.webp`
- `public/assets/edo/characters/full/teahouse-girl.webp`
- `public/assets/edo/characters/full/temple-steward.webp`

Source-generation originals should be retained under:
- `public/assets/edo/generated/source/next-area/`

## Background — 寺社前 / 茶屋まわり

### Composition

Landscape background matching the current scenic set proportions.

Required scene elements:
- small Edo shrine/temple frontage on the left-middle distance
- stone lantern and low stone steps
- tea stall / teahouse frontage on the right
- red cloth bench and kettle / cups / dango display
- cherry blossoms, petals, spring sky
- several distant townspeople only; no large foreground human figures
- narrow lane continuing deeper into town to suggest the next chapter expands outward

### Staging safe zones

Keep these areas visually quiet enough for runtime character art:
- left foreground: protagonist, about 34–38% of scene width
- right foreground: primary NPC, about 30–34%
- center-right lower area: optional secondary NPC, about 16–20%
- upper-left: small hanging-note UI
- bottom edge: no critical art; mobile crop may remove it

Avoid:
- baked-in text
- logos
- foreground NPCs
- high-contrast props directly behind character faces
- excessive realism

## NPC 1 — 茶屋の娘

Working id: `teahouse_girl`

Role:
- hears everyday complaints before they become formal “problems”
- links merchants, travelers, and residents
- socially observant rather than exposition-heavy

Visual:
- woman in her early 20s
- approachable, quick-witted expression
- spring kimono/apron suitable for working at a tea stall
- muted vermilion + warm cream + small indigo detail
- full body, transparent background
- 3/4 standing pose facing slightly toward screen center
- hands readable; one may hold a tea tray or cloth
- silhouette distinct from landlord
- same bright anime style and rendering density as existing cast

## NPC 2 — 寺社の世話役

Working id: `temple_steward`

Role:
- practical caretaker rather than priestly authority
- knows boundary disputes, lost items, travelers, festival logistics
- represents concerns from outside the current four town areas

Visual:
- man in his late 30s to 40s
- calm but slightly severe face
- work-worn Edo clothing with shrine/temple caretaker cues
- indigo / charcoal / straw color palette
- full body, transparent background
- upright posture, slightly toward screen center
- may carry broom, ledger, or tied keys; keep prop compact
- silhouette clearly different from firechief

## Runtime staging

Desktop:
- protagonist left foreground
- teahouse girl right foreground for tea-stall events
- temple steward right foreground for shrine/boundary events
- secondary character may appear center-right at reduced scale

Mobile 430×932:
- protagonist left, 60–68% width
- featured NPC right, 52–60% width
- preserve face visibility above bottom navigation
- avoid baked scenery details that conflict with portrait crop

## Navigation rule

Do not add a seventh permanent bottom tab.

Post-Day10:
- existing `江戸の地図` tab becomes the entry point to an expanded map panel
- the new area appears inside that map panel as a selectable destination
- existing six-slot navigation remains unchanged
- direct return from the new area uses the same map / area movement flow

## First event direction

Working title: `十一日目：茶屋に集まる話`

Core:
- the player is now a recognized town figure
- two people bring incompatible versions of the same small problem
- the player chooses whose framing to trust first
- the choice changes both NPC relationships and what rumor reaches the existing town

Possible choice dimensions:
- listen to travelers / commerce
- prioritize neighborhood custom / safety
- make both sides sit down and exchange information

## Done criteria

- final background + 2 character assets committed
- new AreaId / NPCIds wired without breaking old saves
- map-driven navigation entry; no seventh permanent tab
- at least one data-driven post-Day10 town event
- relation changes visible in people rail
- desktop 1600×900 and mobile 430×932 screenshots
- WebKit portrait/landscape green
- Day1→Day10 regression remains green
