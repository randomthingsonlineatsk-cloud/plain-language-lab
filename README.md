# Plain Language Lab

Practise patient-facing writing for clinical trials: consent forms, assent forms and patient
texts that people can read, checked by rules in the browser.

**Live:** https://randomthingsonlineatsk-cloud.github.io/plain-language-lab/

Training only. Every study, product, sponsor and participant is fictional. Not a validated system.

## What it does

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

10. **Risk and numbers**: absolute against relative risk, number needed to treat, natural
    frequencies, the EU frequency terms and icon arrays (SVG); checks for relative risk alone,
    percentages without “in 100”, percentages of percentages, mixed denominators, frequency words
    that do not match, and p-values in lay text.
11. **Patient leaflet** from the Labelling Workbench (its “Leaflet for the Plain Language Lab”
    export, or Ostrevia’s EU package leaflet and US Medication Guide): rewrite each section with its
    reading level, keep every key safety message, check the frequency words.
12. **Simulated user test**: a questionnaire on the key messages, a pilot and rounds of 10 simulated
    participants of mixed literacy and numeracy; an answer passes at 90% found and 90% of those
    understood (16 of 20 over two rounds on the same text). Results repeat for the same text.
13. **Lay summary of results** (EU CTR Annex V, ten elements) drafted from the study and the TLF
    Programming Lab’s analysis results (its ARS JSON download), or from the CSR & Narrative Studio’s
    lay results (`csr-studio/lay-results`: the same results as the clinical study report, with the
    CSR tables they come from): natural frequencies, differences in words, honest uncertainty, no
    p-values; checks PL-L01 to PL-L10.
14. **Missions PL6 to PL9**: bring the Ostrevia leaflet to its reading level; user-test it and pass;
    write the VERDANT-1 lay summary from its results; fix the numbers in a misleading summary.

Export each document to Word or HTML, and the whole project as a JSON file. Works offline after
the first visit; press `?` for keyboard shortcuts.

15. **Translations**: the translator pastes each segment and its back-translation; the app checks
    numbers (native digits included), English left untranslated and open reconciliation items, and
    a translation goes stale when the English version moves on. Eight Indian languages (Hindi,
    Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, Malayalam), the EU languages and Canadian
    French. No machine translation.
16. **Versions and ethics**: issue versions with a summary, submit them to each ethics committee,
    record decisions and which version each site uses. Flags catch use before approval, use of a
    superseded version and stale translations. When a protocol amendment arrives (a Protocol
    Builder file with two versions), the app shows the tracked changes and proposes re-consent,
    inform or no action. The consent versions download feeds the CDM Console’s Twin page, where
    the superseded-version check (IC-74 for HRP-301) follows the latest approved version.
17. **eConsent mock-up**, after the FDA and OHRP Q&A on electronic informed consent (2016) and the
    EU recommendation paper on decentralised elements (2022): identity check, screens with glossary
    pop-ups, a comprehension quiz with teach-back, a question log, a signature with its meaning, a
    copy for the participant and a downloadable audit trail.
18. **Missions PL10 to PL12**: reconcile a Hindi back-translation with six planted errors; handle
    amendment 1 (re-consent, new version, approvals, sites); set up an eConsent flow that passes.

19. **Writing skills drills**: seven sets of eight short items with instant feedback (grammar,
    punctuation, word choice, sentence structure, numbers and units, abbreviations, statistics for
    writers). They cover the topic areas used in medical writing courses such as the AMWA Essential
    Skills programme; the items are written for this app, which is not affiliated with AMWA.
20. **Certificate**: pass the core missions (PL1, PL2, PL3, PL6 and PL8), every Learn quiz (2 of 3
    or better) and every writing-skills set (6 of 8 or better). Distinction: every mission passed,
    three or more at expert level. The verification code (PL-) and the passport record are checked
    on the pharmolecule [Regulatory Skills Passport](https://randomthingsonlineatsk-cloud.github.io/pharmolecule/passport.html).
21. **Classroom** (optional, the only feature that talks to a server): instructors create a class
    and assign missions; students join with a code and send their mission projects; instructors
    re-score each one in their own browser, comment, and see a leaderboard. It uses the shared
    classroom server in the eCTD Dossier Builder repository, routes under `/pl/v1`.
22. **Lifecycle journey**: the Export page’s hand-off is checked twice on the pharmolecule
    [Ostrevia journey](https://randomthingsonlineatsk-cloud.github.io/pharmolecule/journey.html):
    the VERDANT-1 consent form drafted from your own Protocol Builder protocol, and the lay summary
    written from your own TLF Programming Lab results.
23. **Health-literacy scorecard**: rate any document with the CDC Clear Communication Index (20
    items; 90 passes) and AHRQ’s PEMAT for print (understandability and actionability), with
    suggested ratings where the text shows something measurable. Item wording is shortened; the
    official tools have the full guidance.
24. **Patient panel review**: five reader personas (written for this app, driven by rules) comment
    on the consent form; each comment closes when the text is revised, or is kept with a reason,
    and the review log can be downloaded. A rehearsal for a real panel, not a substitute.
25. **Easy Read and audio**: a first draft of one sentence a line from any consent section, simple
    pictures, large print, an audio script, and checks for each (after common Easy Read guidance;
    there is no single legal standard).
26. **Glossary and translation memory**: an approved term list per language (starter lists for
    Marathi and Tamil) and checks for glossary drift (PL-T05) and for segments that differ from an
    approved translation of the same English (PL-T06). Practice sets for Telugu, Kannada, Bengali,
    Gujarati and Malayalam; descriptive measures (words a sentence, letters a word) for Indian
    languages, which have no validated readability formula. The practice sentences were written
    for this app and are not validated translations.
27. **Publication summary**: a plain-language summary of a (fictional) journal article with a
    three-panel graphical abstract and twelve checks.
28. **Language access**: consent languages and formats per site from the Protocol Builder’s
    enrolment plan and fictional site profiles, with a stated planning rule and the US short-form
    route (21 CFR 50.27(b)(2)).
29. **Missions PL13 to PL19**: score and fix a handout; resolve a patient panel; Easy Read and audio;
    Marathi and Tamil on the glossary; a publication summary; a language-access plan; the GLV-12-301
    lay summary from its results (HbA1c explained without percentages of percentages).
30. **CDM Console link, site by site**: the consent-versions file now carries each ethics committee’s
    country and approvals. On the Console’s Edit checks page each site is mapped to its committee,
    every participant’s signed version and date is compared with that committee’s approvals, and
    mission M21 there asks you to query the ones that are wrong.

The user test is simulated: its readers are generated by rules from the text. The app says so next
to the result; a real readability test needs real participants.

## Later

- When the EU pharmaceutical reform’s new leaflet rules (Council position adopted 28 September
  2026; Parliament’s vote and publication still to come) and the FDA’s Patient Medication
  Information final rule (on FDA’s agenda for December 2026) are final, their formats will be added.
  Notes on both are in Learn.
- When the CSR & Narrative Studio exists, its results and narratives will feed the lay summary.

## Run it

```
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/
```

React, TypeScript, Vite and Tailwind; IndexedDB storage; no server and no AI service.

## Shared code

`src/shared/consent.ts` (the consent generator, element checklists and India recording rule),
`src/shared/laysummary.ts` and `src/shared/jargon.ts` are identical in the Protocol Builder; a test
in each repo fails if they differ. The worked examples are written by the other apps' tests:
`studies.json` by the Protocol Builder, `leaflets.json` by the Labelling Workbench, and
`results.json` (the reference analyses of both studies, run in R through webR) by the TLF
Programming Lab.

## Licence

Apache-2.0. See LICENSE and NOTICE.

Built by Khan Gulrez Shagufa Fazal Ahmed.
