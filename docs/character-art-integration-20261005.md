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
- Full Day1–10 production regression passed on Chromium desktop/390px/375px and WebKit portrait; WebKit landscape conversation/navigation and Chromium landscape choice/result/rotation passed. Save migration, choice/reward reloads, rapid fire-choice taps, audio preference and offline Day10 restoration passed. No reproduced progression bug required a gameplay change.
- Initial-head verify CI passed; screenshot CI stopped when Linux WebKit closed unexpectedly, not at a game/assertion failure. Final-head CI remains a separate completion check in the draft PR. Do not infer approval to merge or deploy.

## Library evidence checkpoint

All following confirmed entries are version 0, with paths `/<filename>`; filenames use `oh-edo-before-main-4814a9f-` or `oh-edo-after-942bcc1-` followed by the viewport/view suffix below. They are paired fresh Day1 screenshots, not the Day6 selection fixtures.

| Suffix | Before Library ID | After Library ID |
| --- | --- | --- |
| mobile-375x667-town.png | `libfile_148190bb60d08191b38c18b00bab7abc` | `libfile_8d1a7e6fcd4881918519639531466c35` |
| mobile-375x667-dialog.png | `libfile_b152dc305c888191974a9d4c19b1698b` | `libfile_c73539f29d988191b36fbb7abccd1649` |
| mobile-390x844-town.png | `libfile_51ea90a4f6c08191baae0c294e3b56d3` | `libfile_29d47ef7aa54819197b919a1177e1cdf` |
| mobile-390x844-dialog.png | `libfile_aaf9af44d3508191888a34a802ffba28` | `libfile_4c28d67d6cb0819194752c001132370e` |
| landscape-844x390-town.png | `libfile_e86078a1a0ec8191bd0ccb9dc1bca5b5` | `libfile_69aebc871f2081918ec76217eea7e8ea` |
| landscape-844x390-dialog.png | `libfile_f6fac7d3ac908191b349ca1c4f2c2a4d` | `libfile_b1631539710c81919fd62bd2e2d48e73` |
| desktop-1600x900-town.png | `libfile_b393e91b53608191b579535d5686b889` | `libfile_06cf8617747881919eac9b274aaf379c` |
| desktop-1600x900-dialog.png | `libfile_f19583bae8448191b9bf0c672d0230c8` | `libfile_02d2b4e509408191a89f7a6940ed1b48` |

The final evidence archive also includes all selected-character fixtures and the H.264 recording; its confirmed Library receipt is attached to PR #168 after save completion.

The regression assertions now accept a deliberately contained portrait and a physically separate art region rather than requiring a cropped portrait or bottom-overlay composition. Asset-path assertions target the new fishmonger WebP. Gameplay assertions remain intact.

## Follow-up: fair character distance and common ground

The user confirmed that unexplained near/far differences should be removed. Placement now measures the existing illustration's human head-to-foot anchors rather than its canvas/prop bounds. The player and all adults share a body height of 70% of the scene and a ground line at 94%. The child's body height is 72% of that adult reference, with the original proportions and pose preserved. Raised paper, staff, fish, hands and transparent padding no longer determine apparent human stature. No image is regenerated, stretched non-uniformly or replaced.

`src/characterPlacement.ts` records the reviewed pixel anchors. The existing scene container provides responsive dimensions. Both town and dialogue QA assert equal adult height, natural child height, matching ground, full art containment and no art/dialogue intersection. `scripts/capture-fair-placement-comparison.mjs` captures same-condition five-person before/after comparisons at 375×667, 390×844 and 844×390. Library receipts and final exact-head CI are recorded in PR #168.

## Follow-up: foreground silhouette / background separation

The existing alpha art receives one compact warm-ink drop shadow (2–4px diagonal offset, .75px blur, .64 opacity). Only the background receives a .16-opacity darkening layer. The tuning variables live together in `.town-art-stage`. No board, duplicated character, regenerated asset, face/cloth dimmer, non-uniform scaling or cast repositioning is introduced. Original foreground colour, common ground and child/adult stature remain intact.

The 24-case browser regression now checks town and dialogue: a single alpha shadow, its conservative three-blur-radius containment, unchanged foreground opacity, unfiltered cast/scene parents, background-only dimmer and layer order. The same regression is added to screenshot CI before the existing full release QA. Comparisons use the confirmed c526d8d captures and identical Day6 fixtures at 375×667, 390×844 and 844×390, with five NPCs across all four backgrounds, in both town and dialogue. `scripts/capture-foreground-separation-comparison.mjs` produces three native-resolution comparison images; confirmed Library IDs and final exact-head CI are attached to PR #168.
