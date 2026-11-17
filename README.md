# Plain Language Lab

Practise patient-facing writing for clinical trials: consent forms, assent forms and patient
texts that people can read, checked by rules in the browser.

**Live:** https://randomthingsonlineatsk-cloud.github.io/plain-language-lab/

Training only. Every study, product, sponsor and participant is fictional. Not a validated system.

## What it does (Phase 1)

1. **Studies from the Protocol Builder.** Start from VERDANT-1 (HRP-301, lumiravostat for
   chronic hand eczema) or GLV-12-301, or open a Protocol Builder project file. The consent
   form is drafted from the protocol: the chance of placebo, the visits, the blood volume, the
   known side effects and the registry numbers all come from it.
2. **Consent form builder** for four documents: the adult consent form (key information first),
   a representative's form for adults who cannot consent, written assent for ages 12 to 17 and
   an oral assent script for ages 7 to 11. Each section shows its reading level, whether it was
   edited, and can be marked reviewed.
3. **Required elements by region**, flagged as you write:
   - ICH E6(R3) section 2.8 (every region);
   - US: 21 CFR 50.25(a), (b) and the exact ClinicalTrials.gov sentence of 50.25(c);
   - EU: Regulation (EU) No 536/2014, Article 29;
   - India: New Drugs and Clinical Trials Rules 2019, Third Schedule Table 3;
   - key information first (US proposed rule of 2022 and draft guidance of 2024; required under
     the Common Rule for federally funded research), checked but not counted in the US list.
4. **India**: a decision helper for recording the consent process (audio and video for
   vulnerable participants in new chemical entity trials; audio only for anti-HIV and
   anti-leprosy drugs), the impartial witness and compensation wording.
5. **Readability panel**: Flesch Reading Ease, Flesch-Kincaid, SMOG, Gunning Fog, Coleman-Liau and
   the Automated Readability Index side by side, each with what it counts and its limits; long
   sentences, passive voice, nouns used for verbs, double negatives, unexplained abbreviations and
   percentages without a natural frequency.
6. **Jargon dictionary** of about 280 terms with plain alternatives, shared with the Protocol
   Builder.
7. **Rewrite drills**: eight passages from consent forms, a leaflet, a lay summary and an assent
   form. Each rewrite is scored on reading level, jargon, sentence length, passive voice and the
   facts that must survive, with claims that must not be added.
8. **Learn**: eight lessons with quizzes (plain language and ISO 24495-1, readability formulas,
   US, EU and Indian consent, key information, assent, numbers and risk).
9. **Missions** PL1 to PL5: rewrite five passages; fix a consent form missing ten required
   elements; write the key information; write assent for two age groups; decide when consent is
   recorded in India.

Export each document to Word or HTML, and the whole project as a JSON file. Works offline after
the first visit; press `?` for keyboard shortcuts.

## Coming next

Phase 2: risk tools and icon arrays, the lay summary of results from the TLF Programming Lab,
the package leaflet and Medication Guide shared with the Labelling Workbench, and simulated user
testing. Phase 3: translation and back-translation in eight Indian languages and the EU languages,
ethics committee versions, eConsent and the CDM Console link. Phase 4: writing skills drills, the
certificate, the classroom and the pharmolecule journey step. The writing-skills drills cover the
topic areas used in medical writing courses such as the AMWA Essential Skills programme; this app
is not affiliated with AMWA.

## Run it

```
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/
```

React, TypeScript, Vite and Tailwind; IndexedDB storage; no server and no AI service.

## Shared code

`src/shared/consent.ts` (the consent generator, element checklists and India recording rule) and
`src/shared/jargon.ts` are identical in the Protocol Builder; a test in each repo fails if they
differ. The worked-example studies in `src/domain/studies.json` are written by the Protocol
Builder's tests.

## Licence

Apache-2.0. See LICENSE and NOTICE.

Built by Khan Gulrez Shagufa Fazal Ahmed.
