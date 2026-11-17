// Learn mode: short lessons with a worked example from VERDANT-1 and a three-question quiz each.
export interface Quiz { q: string; options: string[]; answer: number; why: string }
export interface Lesson { id: string; title: string; paras: string[]; example: string; quiz: Quiz[] }

export const LESSONS: Lesson[] = [
  { id: 'plain', title: 'Plain language and ISO 24495-1',
    paras: [
      'Plain language means the reader can find what they need, understand it and use it, the first time they read it. ISO 24495-1:2023 sets four principles: the text is relevant (written for these readers and what they need), findable (they can find it), understandable (they understand it) and usable (they can act on it).',
      'For patient documents this comes down to a few habits: say who does what (active voice), one idea a sentence, about 15 to 20 words a sentence on average, everyday words with technical terms explained once, headings that ask the reader’s questions, and the most important information first.',
      'Plain does not mean less. A consent form must still give every required element; a leaflet must still give every warning. The skill is to keep the content and change the way it is said.',
    ],
    example: '“Venipuncture will be performed at each scheduled visit” becomes “At each visit, a nurse will take blood from a vein in your arm.” The fact is the same; the reader now knows who, where and what.',
    quiz: [
      { q: 'Which ISO 24495-1 principle does a heading like “Can I stop taking part?” serve most?', options: ['Findable', 'Relevant', 'Usable'], answer: 0, why: 'Headings that match the reader’s questions help them find the information.' },
      { q: 'A rewrite is easier to read but drops the 16-week duration. Is it plain language?', options: ['No: plain language keeps the content', 'Yes: it scores better', 'Yes, if the grade is under 8'], answer: 0, why: 'The meaning must survive; a lower grade bought by losing facts is a worse document.' },
      { q: 'Which is active voice?', options: ['The study doctor will check your blood pressure.', 'Your blood pressure will be checked.', 'Blood pressure checks will be performed.'], answer: 0, why: 'Active voice names who does the action.' },
    ] },
  { id: 'readability', title: 'Readability formulas and their limits',
    paras: [
      'Readability formulas estimate difficulty from surface counts. Flesch Reading Ease and Flesch-Kincaid use words per sentence and syllables per word; SMOG and Gunning Fog count words of three or more syllables; Coleman-Liau and the Automated Readability Index count letters or characters.',
      'They agree on direction, not on the number: the same text can be grade 7 on one and grade 10 on another. SMOG needs at least 30 sentences to be valid and predicts full understanding, so it runs higher.',
      'All of them were built on English prose. They cannot see meaning, order, layout, numbers, tables, or whether a long word is familiar (“medicine”) or rare (“hepatotoxic”). A text of short wrong sentences scores well. Use them as a smoke alarm, not a verdict, and test with readers.',
      'Many ethics committees expect consent forms at about grade 8 or below; that is a common expectation, not a legal rule. Indian languages need their own measures: the English formulas do not apply to Hindi or Marathi.',
    ],
    example: 'The VERDANT-1 protocol paragraph on blood sampling scores grade 16 on Flesch-Kincaid; the plain rewrite scores about grade 6. SMOG on the same two sentences is unreliable because there are fewer than 30 sentences.',
    quiz: [
      { q: 'What does SMOG need to be valid?', options: ['At least 30 sentences', 'At least 100 words', 'A medical word list'], answer: 0, why: 'SMOG was designed on samples of 30 sentences.' },
      { q: 'A text scores grade 6 but most readers misunderstand the risks. What is wrong?', options: ['The formula cannot judge meaning: test it with readers', 'Nothing: grade 6 is good', 'Use a different formula'], answer: 0, why: 'Formulas count surface features; only testing shows understanding.' },
      { q: 'Should you run Flesch-Kincaid on the Hindi translation?', options: ['No: the formulas are for English', 'Yes, it works for any language', 'Only for Devanagari script'], answer: 0, why: 'Syllable and word-length measures were calibrated on English.' },
    ] },
  { id: 'us', title: 'US consent: 21 CFR 50.25 and key information',
    paras: [
      'Under 21 CFR 50.25(a), every consent form for an FDA-regulated trial gives eight basic elements: that it is research (purpose, duration, procedures, what is experimental), foreseeable risks, benefits, alternatives, confidentiality including that FDA may inspect records, compensation and treatment for injury (for more than minimal risk), whom to contact, and that taking part is voluntary.',
      'Section 50.25(b) adds six elements when appropriate: unforeseeable risks (including to an embryo or fetus), when the investigator may end participation, extra costs, the consequences of withdrawal, new findings, and the approximate number of participants. Section 50.25(c) requires one statement word for word about ClinicalTrials.gov for applicable clinical trials.',
      'Key information first: the Common Rule has required it for federally funded research since 2019, and FDA proposed the same for FDA-regulated trials in 2022, with draft guidance in March 2024. The app checks it and labels it as proposed for FDA trials.',
    ],
    example: 'VERDANT-1 is registered as NCT99930101 (fictional), so its form must carry the 50.25(c) sentence exactly; a paraphrase fails the check.',
    quiz: [
      { q: 'Which element is in 50.25(b), not (a)?', options: ['The approximate number of participants', 'Foreseeable risks', 'Alternatives'], answer: 0, why: 'The number of participants is an additional element, 50.25(b)(6).' },
      { q: 'May the ClinicalTrials.gov statement be reworded to be plainer?', options: ['No: 50.25(c) gives its exact words', 'Yes, if the meaning stays', 'Only in the key information'], answer: 0, why: 'The regulation requires that specific statement.' },
      { q: 'Is key information first required for FDA-regulated trials today?', options: ['Proposed, not final', 'Yes, since 2019', 'Never'], answer: 0, why: 'FDA proposed it in 2022; the Common Rule already requires it for federally funded research.' },
    ] },
  { id: 'eu', title: 'EU consent: CTR Article 29, minors and incapacitated adults',
    paras: [
      'Article 29 of the Clinical Trials Regulation says the information must let the participant understand the nature, objectives, benefits, implications, risks and inconveniences of the trial; their rights, including to refuse and to withdraw at any time without detriment and without giving a reason; the conditions, including the expected duration; and the alternatives, including follow-up if they stop.',
      'It must also explain the damage compensation system, give the EU trial number, and say that a summary of the results and a lay summary will be available in the EU database. The information is given in a prior interview with a qualified member of the team, and must be comprehensive, concise, clear and understandable to a layperson.',
      'Minors (Article 32) and incapacitated adults (Article 31) consent through their legally designated representative, and receive information adapted to their capacity; a minor’s explicit wish to refuse or withdraw is respected.',
    ],
    example: 'VERDANT-1 runs in Germany, so its form needs the EU trial number 2026-500000-00-00 (fictional) and the statement about results in the EU database.',
    quiz: [
      { q: 'What must an EU participant be told about withdrawal?', options: ['They may withdraw at any time without detriment and without giving a reason', 'They must give a reason', 'They may withdraw only at a visit'], answer: 0, why: 'Article 29(2)(a)(ii).' },
      { q: 'Which number must appear in an EU consent form?', options: ['The EU trial number', 'The NCT number', 'The protocol version'], answer: 0, why: 'Article 29 asks for the EU trial number and where results will appear.' },
      { q: 'A 14-year-old clearly refuses, but the parent consents. What happens?', options: ['The minor’s refusal is respected', 'The parent decides', 'The investigator decides'], answer: 0, why: 'Article 32 requires the minor’s explicit wish to refuse to be respected.' },
    ] },
  { id: 'india', title: 'India: Table 3, compensation and recording consent',
    paras: [
      'The New Drugs and Clinical Trials Rules, 2019 set out the essential elements of the participant information sheet in the Third Schedule (Table 3). They include the probability of random assignment, that placebo has no therapeutic effect, prorated payment, and compensation and free treatment for trial-related injury, disability or death.',
      'For vulnerable participants in trials of a new chemical or molecular entity, the consent process is recorded on audio and video, and the recording kept by the investigator; for anti-HIV and anti-leprosy drugs, an audio recording only. The recording covers the information given and the participant’s understanding, and adds to written consent rather than replacing it.',
      'When a participant or their representative cannot read, consent is given in the presence of an impartial witness who also signs. The form must be in a language the participant understands, which in India often means a regional language with a back-translation checked by the ethics committee.',
    ],
    example: 'At the VERDANT-1 site in Pune, a participant who cannot read is vulnerable; lumiravostat is a new chemical entity, so the consent conversation is recorded on audio and video, and an impartial witness signs.',
    quiz: [
      { q: 'A vulnerable participant joins a trial of a new anti-HIV molecule. What is recorded?', options: ['Audio only', 'Audio and video', 'Nothing'], answer: 0, why: 'For anti-HIV and anti-leprosy drugs the rule asks for audio only.' },
      { q: 'Does a recording replace the signed form?', options: ['No: it adds to written consent', 'Yes', 'Only for illiterate participants'], answer: 0, why: 'Written consent (or a witnessed thumb impression) is still needed.' },
      { q: 'Which element is specific to India’s Table 3 rather than 50.25?', options: ['Prorated payment and compensation for trial-related death', 'Foreseeable risks', 'Contacts'], answer: 0, why: 'Table 3 names compensation for injury or death and prorated payment explicitly.' },
    ] },
  { id: 'key', title: 'Writing key information',
    paras: [
      'Key information is a short opening section that gives a person what they most need to decide: that this is research and voluntary, why it is being done, how long it lasts and what it involves, the main risks, whether they might benefit, and that there are other options.',
      'It is a summary, not a copy of the form. Write it last, from the finished form; keep it to a few short paragraphs; and choose the risks that matter most to the decision, with their frequency in words a reader can use.',
    ],
    example: 'VERDANT-1’s key information names the 1 in 3 chance of placebo, about 25 weeks with 8 site visits, the two most common side effects, and that other treatments exist.',
    quiz: [
      { q: 'Which belongs in key information?', options: ['The chance of getting placebo', 'The full list of laboratory tests', 'The ethics committee’s address'], answer: 0, why: 'The placebo chance bears directly on the decision to join.' },
      { q: 'When is the key information best written?', options: ['Last, from the finished form', 'First, before the form', 'By the sponsor’s lawyers'], answer: 0, why: 'It summarises the form, so it is written from it.' },
      { q: 'Where does it go?', options: ['At the start of the form', 'In an appendix', 'After the signatures'], answer: 0, why: 'It comes first so it is read first.' },
    ] },
  { id: 'assent', title: 'Assent and vulnerable participants',
    paras: [
      'Children cannot give legal consent: a parent or guardian gives permission, and the child gives assent, an agreement suited to their age. In the US, 21 CFR 50 Subpart D sets when assent is required (50.55); in the EU, Article 32 of the CTR; in India, the rules ask mature minors and adolescents to sign a separate assent form, and the ICMR guidance suggests oral assent at 7 to 11 years and written assent at 12 to 18.',
      'Write for the age: short words and sentences, concrete events (“we will take a little blood from your arm”), and a clear statement that the child can say no and that no one will be cross. Leave out adult matters such as insurance or regulations. A child’s refusal should be respected.',
      'Other vulnerable participants include adults who cannot decide for themselves, who consent through a legally acceptable representative, and people who cannot read, who need an impartial witness.',
    ],
    example: 'The VERDANT-1 oral assent script for 7 to 11 year olds uses sentences of under 10 words and says “You can say no, and no one will be cross with you.”',
    quiz: [
      { q: 'What should an assent form for a 9-year-old say clearly?', options: ['They can say no', 'The compensation arrangements', 'The regulators who may inspect'], answer: 0, why: 'The child’s choice is the heart of assent.' },
      { q: 'Who gives legal permission for a child?', options: ['A parent or guardian', 'The child', 'The investigator'], answer: 0, why: 'Permission comes from the parent or guardian; assent from the child.' },
      { q: 'An adult cannot decide for themselves. Who consents?', options: ['A legally acceptable representative', 'The study doctor', 'No one: they cannot join'], answer: 0, why: 'Where allowed, a representative decides, as the person would want.' },
    ] },
  { id: 'numbers', title: 'Numbers and risk for lay readers',
    paras: [
      'People understand “12 in 100” better than “12%” and much better than “0.12”. Give natural frequencies with the same denominator throughout (“about 12 in 100 people … about 3 in 100 people”).',
      'A relative risk on its own misleads: “halves the risk” may mean 2 in 1,000 down to 1 in 1,000. Give the absolute numbers. Avoid percentages of percentages and p-values in lay text.',
      'In EU leaflets, side-effect frequencies use fixed terms: very common (more than 1 in 10), common (up to 1 in 10), uncommon (up to 1 in 100), rare (up to 1 in 1,000), very rare (up to 1 in 10,000).',
    ],
    example: 'In VERDANT-1, upper respiratory tract infection was very common (12%): write “about 12 in 100 people had a cold or another nose, throat or chest infection.”',
    quiz: [
      { q: 'Which is clearest for most readers?', options: ['About 12 in 100 people', '12%', 'A probability of 0.12'], answer: 0, why: 'Natural frequencies are understood best.' },
      { q: '“Reduces the risk by 50%” from 2 in 1,000 to 1 in 1,000. What should you add?', options: ['The absolute numbers', 'The p-value', 'Nothing'], answer: 0, why: 'Relative risk without the absolute exaggerates the effect.' },
      { q: 'In an EU leaflet, “common” means…', options: ['Up to 1 in 10 people', 'More than 1 in 10', 'Up to 1 in 100'], answer: 0, why: 'Common is 1 in 100 to 1 in 10.' },
    ] },
  { id: 'leaflet', title: 'Package leaflets, Medication Guides and user testing',
    paras: [
      'An EU package leaflet follows the QRD template: six numbered sections, from “What it is and what it is used for” to “Contents of the pack”, in words a patient uses. Directive 2001/83/EC (Articles 59(3) and 61(1)) requires that it reflects consultations with target patient groups: in practice a readability (user) test.',
      'The usual method: a questionnaire of about 12 to 15 questions on the key safety and use messages, a pilot, then rounds of 10 people likely to use the medicine. An answer is satisfactory when at least 90% of participants find it and 90% of those understand it; leaflets are revised between rounds until every answer passes.',
      'In the US, a Medication Guide (21 CFR 208) is required for some medicines with serious risks, with headings written as questions (“What is the most important information I should know about…?”). FDA proposed a one-page Patient Medication Information in 2023; it is not yet final. The EU reform agreed in 2025 to 2026 will let Member States allow electronic-only leaflets, with paper on request; it is not yet in force.',
    ],
    example: 'The Ostrevia leaflet’s pregnancy section says “It may harm your unborn baby” and gives the 4 weeks of contraception and 4 days without breast-feeding: a test question checks each.',
    quiz: [
      { q: 'What is the usual criterion for a user-tested answer?', options: ['90% find it and 90% of those understand it', '50% understand it', 'Every participant reads the whole leaflet'], answer: 0, why: 'The EU readability guidance uses 90% and 90% of those.' },
      { q: 'Who should take part in a user test?', options: ['People likely to use the medicine', 'Pharmacists only', 'The writers'], answer: 0, why: 'The test checks the leaflet with its readers.' },
      { q: 'Is FDA’s one-page Patient Medication Information required today?', options: ['No: it was proposed in 2023', 'Yes, for all medicines', 'Only for biologics'], answer: 0, why: 'It is a proposed rule; Medication Guides under Part 208 remain.' },
    ] },
  { id: 'lay', title: 'Lay summaries of results',
    paras: [
      'Under the EU Clinical Trials Regulation (Article 37(4) and Annex V), every trial posts a summary for laypersons within a year of its end, with ten elements: the trial, the sponsor, why it was done, who took part, the medicines, the side effects, the results, the sponsor’s comments, follow-up trials, and where to find more.',
      'Good Lay Summary Practice (2021) and the EU recommendations (2017) ask for neutral, non-promotional words, results in natural frequencies, honest uncertainty, and the statement that one trial alone does not answer every question. P-values and “statistically significant” are left out; say in words whether the difference could be due to chance.',
      'In the US, NIH released a draft policy in August 2026 to return plain-language summaries to participants in NIH-funded research.',
    ],
    example: 'In the training data of VERDANT-1, 5 of 16 people on 25 mg (about 31 in 100) and 3 of 15 on placebo (about 20 in 100) reached success: the difference could be due to chance, and the lay summary must say so.',
    quiz: [
      { q: 'Within what time is the EU lay summary due?', options: ['One year from the end of the trial', 'Five years', 'Before the trial starts'], answer: 0, why: 'Article 37(4) sets one year for the results summary and the lay summary.' },
      { q: 'How should a difference whose confidence interval crosses zero be described?', options: ['It could be due to chance', 'The medicine works', 'The medicine is unsafe'], answer: 0, why: 'An interval including no difference means the result may be chance.' },
      { q: 'Which belongs in a lay summary?', options: ['The statement that one trial alone does not answer every question', 'The p-value', 'Words like “breakthrough”'], answer: 0, why: 'Neutral and honest; no p-values or promotion.' },
    ] },
]
