# Selected-character presentation integration — 2026-10-05

Base: main `4814a9f254b30b3e39f2d3c40195ae5a5fc6e159` (PR #167).
Branch: `codex/oh-edo-character-art-integration-20261005`.

## Scope

- Integrate the reviewed full-body art for landlord, fishmonger, child, newsman and firechief.
- Use reviewed dedicated portraits for landlord, child and firechief; retain the existing dedicated fishmonger/newsman portraits.
- Keep all previous assets. No new character, story, reward, progression or balance changes.
- Keep the kumitori-master proposal unintegrated: the current renderer has no established full-body display path for that character.
- Display the actual selected NPC, including the existing cross-area picker choices.
- Separate the silhouette region from dialogue. Contain the complete art without masking, cover-cropping or anatomical clipping. Stack on portrait screens; split horizontally in short landscape screens.
- Provide a 44px explicit Next/Close button, readable 16–18px body, scrollable long text and focus indicators. Reading the body does not advance dialogue; focused Enter activates the button once.

## Asset provenance

All masters remain in Library at version 0. Runtime files remove only fully transparent outer padding, retain every nontransparent pixel, add 16px safety padding and encode WebP at quality .94. Eight runtime files total 2,201,812 bytes; original PNG assets are not deleted.

| Runtime art | Confirmed master Library ID |
| --- | --- |
| fishmonger | `libfile_6467f6935e3c8191a84b2755fe07232d` |
| newsman | `libfile_37b541fba26c81919802c1dd9cc052ec` |
| child | `libfile_d29872c0ce448191874f507bd21887d6` |
| landlord | `libfile_4c6795a9dd40819182d01e9b8582337f` |
| firechief | `libfile_3284cde5f31081918d33f75587780c78` |
| child portrait | `libfile_ad3c1db2eefc8191a19d558a5545e8bc` |
| landlord portrait | `libfile_9e336828c2e88191991b3d3b5a24f630` |
| firechief portrait | `libfile_3b9ba70ac8bc8191851af9f0efb63193` |

## Verification and evidence

- `npm run verify`: five unit tests, typecheck, production build and smoke passed.
- `scripts/full-character-art-qa.mjs`: 24 selected-person/area cases passed at 375×667, 390×844, 844×390 and 1600×900. Covers full-body/portrait loading, horizontal overflow, control size, picker End/Escape focus, conversation completion, selected-person persistence, rotation, long-text scrolling and single Enter advancement.
- `scripts/capture-character-art-qa.mjs`: same fresh Day1 state and viewport for baseline main and changed build; images are captured after entrance animation settles.
- `scripts/record-character-art-operation.mjs`: real 390×844 browser recording of title → town → market conversation → Day1 quest choice → reward → Day2 town, including choice/reward reloads. H.264/yuv420p MP4 produced.
- Full Day1–10 production regression and exact-head CI are still in progress at the initial draft checkpoint. Their final results will be attached to the draft PR; do not infer approval to merge or deploy.

The regression assertions now accept a deliberately contained portrait and a physically separate art region rather than requiring a cropped portrait or bottom-overlay composition. Asset-path assertions target the new fishmonger WebP. Gameplay assertions remain intact.
