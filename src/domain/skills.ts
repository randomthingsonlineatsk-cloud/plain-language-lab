// Writing skills drills: short items with instant feedback, in the topic areas medical writing
// courses use (grammar, punctuation, usage, sentence structure, numbers and units, abbreviations,
// statistics for writers). Written for this app; not affiliated with any course provider.
// A set counts towards the certificate when at least 6 of its 8 items are answered right.

export interface SkillItem { id: string; q: string; options: string[]; answer: number; why: string }
export interface SkillSet { id: string; title: string; intro: string; items: SkillItem[] }
export const SET_PASS = 6

const I = (id: string, q: string, options: string[], answer: number, why: string): SkillItem => ({ id, q, options, answer, why })

export const SKILL_SETS: SkillSet[] = [
  { id: 'grammar', title: 'Grammar', intro: 'Agreement, pronouns, modifiers and tense in patient documents.', items: [
    I('G1', 'The list of side effects ___ on the next page.', ['is', 'are'], 0, 'The subject is “list”, which is singular; “of side effects” only describes it.'),
    I('G2', 'Neither the participant nor the study doctors ___ which tablet is which.', ['knows', 'know'], 1, 'With “neither … nor”, the verb agrees with the nearer subject: “doctors”, plural.'),
    I('G3', 'In a clinical study report, “The data ___ collected at each visit.”', ['was', 'were'], 1, 'Medical and scientific style (the AMA Manual of Style among others) treats “data” as plural. In patient text, “information” is often clearer.'),
    I('G4', 'Each participant must bring ___ diary to every visit.', ['his', 'their', 'its'], 1, 'Singular “they” is accepted by current style guides, including the AMA Manual of Style, and avoids assuming a gender. “You must bring your diary” is plainer still.'),
    I('G5', 'Which sentence has no dangling modifier?', ['After taking the tablet, the nausea went away.', 'After taking the tablet, she felt the nausea go away.', 'After taking the tablet, nausea may occur.'], 1, 'The opening phrase must describe the subject that follows. Nausea does not take tablets; she does.'),
    I('G6', 'Please tell the doctor ___ you will see at the next visit.', ['who', 'whom', 'which'], 1, '“Whom” is the object of “see”. In plain language you can drop it: “the doctor you will see”.'),
    I('G7', 'A lay summary of a finished study says: “In this study, participants ___ the tablet for 16 weeks.”', ['take', 'will take', 'took'], 2, 'The study is over, so its events go in the past tense. A consent form, written before the study, uses the future.'),
    I('G8', 'People on the lower dose had ___ side effects.', ['less', 'fewer'], 1, 'Side effects can be counted, so “fewer”. Use “less” for amounts you do not count (less pain, less time).'),
  ] },
  { id: 'punctuation', title: 'Punctuation', intro: 'Commas, apostrophes, hyphens and colons.', items: [
    I('P1', 'Which follows AMA style for a list of three?', ['headache, nausea and dizziness', 'headache, nausea, and dizziness', 'headache nausea, and dizziness'], 1, 'AMA style uses the serial (Oxford) comma before the last item. Many EU documents leave it out; whichever you choose, be consistent.'),
    I('P2', 'The study tablet and ___ possible effects are described below.', ['it’s', 'its', 'its’'], 1, '“Its” is the possessive. “It’s” always means “it is” or “it has”.'),
    I('P3', 'Which is right before a noun?', ['a 16 week study', 'a 16-week study', 'a 16-weeks study'], 1, 'A number and unit used together as an adjective before a noun are hyphenated, and the unit stays singular.'),
    I('P4', 'Only smokers were excluded. Which sentence says that?', ['Participants, who smoke, were excluded.', 'Participants who smoke were excluded.'], 1, 'Without commas, “who smoke” restricts the group to smokers. With commas it suggests every participant smokes and all were excluded.'),
    I('P5', 'The study team keeps all ___ diaries locked away.', ['the participant’s', 'the participants’', 'the participants'], 1, 'Many participants, each with a diary: plural possessive, apostrophe after the s.'),
    I('P6', 'Which uses the colon correctly?', ['You will need to bring: your diary, your tablets and your card.', 'You will need to bring three things: your diary, your tablets and your card.'], 1, 'A colon follows a complete clause. Do not put one between a verb and its object.'),
    I('P7', 'How is an age range clearest in patient text?', ['18-75 years', '18–75 years', '18 to 75 years'], 2, 'Words avoid any confusion with a minus sign or a hyphenated code, and screen readers read them correctly.'),
    I('P8', 'Which is correct?', ['Visits are every 4 weeks; however, you may need an extra visit.', 'Visits are every 4 weeks, however, you may need an extra visit.'], 0, '“However” joining two complete sentences needs a semicolon (or a full stop) before it. Two shorter sentences are often plainer.'),
  ] },
  { id: 'usage', title: 'Word choice and usage', intro: 'Words that are often confused, and the plain choice.', items: [
    I('U1', 'The tablet may ___ how your liver works.', ['affect', 'effect'], 0, '“Affect” is the verb (to change); “effect” is usually the noun (a result).'),
    I('U2', 'Results in the lumiravostat group were ___ those in the placebo group.', ['compared to', 'compared with'], 1, 'Use “compared with” when you set two like things side by side to measure differences (AMA style). “Compared to” likens unlike things.'),
    I('U3', 'In a consent form, the people taking part are best called…', ['patients', 'subjects', 'participants (or “you”)'], 2, 'People in research are participants, not patients being treated or “subjects”. Speaking to the reader as “you” is plainest.'),
    I('U4', 'Take one ___ of 25 mg each morning.', ['dose', 'dosage'], 0, 'A dose is the amount taken at one time; dosage is the whole regimen (amount, how often, how long).'),
    I('U5', 'The ___ investigator leads the study at your hospital.', ['principle', 'principal'], 1, '“Principal” means main or leading. “Principle” is a rule or belief. In patient text, “the study doctor” is plainer.'),
    I('U6', 'The team will ___ that your data are kept private.', ['insure', 'ensure', 'assure'], 1, '“Ensure” means make certain; “insure” is about insurance; you “assure” a person. Plainer: “make sure”.'),
    I('U7', 'Tell us about common infections (___ colds and flu).', ['i.e.', 'e.g.', 'such as'], 2, '“e.g.” (for example) is right in technical text, but many readers mix it up with “i.e.” (that is). “Such as” says it in words.'),
    I('U8', 'Which word is plainest for “commence”?', ['initiate', 'start', 'institute'], 1, 'Prefer the short everyday word: start, end, use, help, about, before, after.'),
  ] },
  { id: 'structure', title: 'Sentence structure', intro: 'Active voice, verbs instead of nouns, parallel lists and the main point first.', items: [
    I('S1', 'Which is the active version of “Blood samples will be taken by the study nurse”?', ['Blood samples will be taken.', 'The study nurse will take blood samples.', 'The taking of blood samples will be done by the nurse.'], 1, 'Active voice names who does what, first. The first option also drops the person who acts.'),
    I('S2', 'Which turns the hidden verb back into a verb? “Discontinuation of treatment will occur if your liver tests are abnormal.”', ['Treatment discontinuation will occur if your liver tests are abnormal.', 'If your liver tests are abnormal, you will stop treatment.', 'Abnormal liver tests will result in the discontinuation of treatment.'], 1, '“Discontinuation” hides the verb “stop”. Putting the condition first also helps the reader.'),
    I('S3', 'Which list is parallel?', ['You will keep a diary, attend visits and take your tablets.', 'You will keep a diary, attending visits and to take your tablets.', 'You will keep a diary, visits must be attended and take your tablets.'], 0, 'Items in a list share one grammatical form, here a verb after “you will”.'),
    I('S4', 'Which version puts the main point first?', ['Because the tablet may harm an unborn baby and studies in animals showed this, you must not get pregnant during the study.', 'You must not get pregnant during the study. The tablet may harm an unborn baby.'], 1, 'Lead with what the reader must do, then why. Two short sentences are easier than one long one.'),
    I('S5', 'Plain version of “It is not uncommon for participants to experience headache.”', ['Headache is not uncommon.', 'Headache is common.', 'It is not unusual for headache to be experienced.'], 1, 'Double negatives make readers do arithmetic. Say what you mean, and use the frequency word that matches the number.'),
    I('S6', '“The tablet may possibly potentially cause dizziness.” Best edit?', ['The tablet may cause dizziness.', 'The tablet potentially causes dizziness.', 'Dizziness is a possible potential effect.'], 0, 'One hedge is enough. Stacked hedges sound evasive and hide the real level of risk; give a number if you have one.'),
    I('S7', 'When is a bulleted list better than a paragraph?', ['For any sentence over 15 words', 'For three or more parallel items or steps the reader may need to find again', 'Never in patient text'], 1, 'Lists help readers scan steps, visits or side effects. Keep each item short and in the same form.'),
    I('S8', 'A good average sentence length for patient text is about…', ['8 words', '15 to 20 words', '30 words'], 1, 'Plain-language guidance aims for an average of about 15 to 20 words, with some variety. Very short sentences throughout can read as choppy.'),
  ] },
  { id: 'numbers', title: 'Numbers and units', intro: 'Writing numbers and doses so they cannot be misread.', items: [
    I('N1', 'Which is right at the start of a sentence?', ['12 people stopped early.', 'Twelve people stopped early.'], 1, 'Spell out a number that starts a sentence, or reword so it does not start there (“In total, 12 people stopped early”).'),
    I('N2', 'Which follows safe-practice rules for a dose?', ['.5 mL', '0.5 mL', '0.50 mL'], 1, 'Always use a leading zero; a missed decimal point turns .5 into 5. Do not add a trailing zero.'),
    I('N3', 'Which follows safe-practice rules?', ['5.0 mg', '5 mg', '5mg'], 1, 'A trailing zero can be misread as 50 mg. Put a space between the number and the unit.'),
    I('N4', 'Which way of writing micrograms does ISMP recommend?', ['µg', 'mcg', 'ug'], 1, 'The µ symbol can be misread as m (milligrams), a thousandfold error. ISMP lists µg among its error-prone abbreviations.'),
    I('N5', 'Which is easiest for most readers?', ['The risk is 0.02.', 'The risk is 2%.', 'About 2 in 100 people get this.'], 2, 'Natural frequencies (x in 100) are understood better than decimals or percentages, especially by readers with low numeracy.'),
    I('N6', 'The study takes 75 mL of blood in total. What helps the reader most?', ['75 mL', '75 mL (about 5 tablespoons)', '0.075 L'], 1, 'Give an everyday comparison after the measurement. A tablespoon is 15 mL, so 75 mL is about 5 tablespoons.'),
    I('N7', 'Which dosing instruction is clearest?', ['Take 1 tablet q.d. p.o.', 'Take 1 tablet once daily per os.', 'Take 1 tablet by mouth each morning.'], 2, 'Say how and when in everyday words. Latin abbreviations such as q.d. are on safety do-not-use lists.'),
    I('N8', 'Side effect A: 2 in 100 people. Side effect B: 1 in 1,000. Best way to present both?', ['2% and 0.1%', '2 in 100 and 1 in 1,000', '20 in 1,000 and 1 in 1,000'], 2, 'Use the same denominator so readers can compare at a glance.'),
  ] },
  { id: 'abbreviations', title: 'Abbreviations', intro: 'When to define, when to avoid, and the do-not-use list.', items: [
    I('A1', 'When should you define an abbreviation?', ['Never; readers can look it up', 'At first use, and only if you use it several times; otherwise write it in full', 'In a glossary at the end only'], 1, 'Define at first use in the text. If it appears once or twice, write the words instead.'),
    I('A2', 'Which is on the Joint Commission “Do Not Use” list?', ['mg', 'Q.D.', 'mL'], 1, 'Q.D. and Q.O.D. are confused with each other; write “daily” and “every other day”. U, IU, trailing zeros and missing leading zeros are on the list too.'),
    I('A3', 'How should “10 U of insulin” be written?', ['10 U', '10 IU', '10 units'], 2, '“U” can be read as 0 or 4, and “IU” as IV or 10. Write “units”.'),
    I('A4', 'A consent form says “Take the tablet b.i.d.” Plain version?', ['Take the tablet BID.', 'Take the tablet twice a day.', 'Take the tablet bis in die.'], 1, 'Patients should not need Latin. Write the timing in words.'),
    I('A5', 'Plural of ECG?', ['ECG’s', 'ECGs', 'ECG'], 1, 'No apostrophe for plurals of abbreviations. In patient text, “heart tracings (ECGs)” at first use.'),
    I('A6', 'A consent form refers to “AEs and SAEs”. Plain version?', ['side effects and serious side effects', 'adverse events (AEs)', 'AE/SAE'], 0, 'Write what readers know. Strictly, an adverse event is any medical problem during the study; “medical problems, including side effects” is accurate and plain.'),
    I('A7', 'Must an EU lay summary give the trial’s protocol number and EU trial number?', ['No, codes confuse lay readers', 'Yes: Annex V of the EU Clinical Trials Regulation lists the trial identifiers as the first element', 'Only if the sponsor wishes'], 1, 'Annex V starts with the trial’s identification, including the protocol number and EU trial number, so readers can find more information.'),
    I('A8', 'Which heading is best for patients?', ['ICF Section 7: AE reporting and SUSAR', 'What to do if you feel unwell', 'Pharmacovigilance procedures'], 1, 'Headings as questions or tasks help readers find what they need. Keep abbreviations out of headings.'),
  ] },
  { id: 'statistics', title: 'Statistics for writers', intro: 'Proportions, averages, risk and uncertainty, said in words.', items: [
    I('T1', 'Hospital stays are mostly 2 to 3 days, but a few last 40 days. Which average describes a typical stay?', ['Mean', 'Median', 'Range'], 1, 'The median is the middle value and is not pulled up by a few very long stays; the mean is.'),
    I('T2', '38 of 152 participants had treatment success. What percentage is that?', ['25%', '38%', '15%'], 0, '38 ÷ 152 = 0.25, so 25%: about 1 in 4.'),
    I('T3', 'A side effect went from 1 in 100 people on placebo to 2 in 100 on the drug. Which is the fairest plain sentence?', ['The drug doubled the risk.', 'The drug increased the risk by 100%.', 'About 1 more person in every 100 had it on the drug.'], 2, 'Relative changes alone exaggerate small risks. Give the absolute numbers in one denominator.'),
    I('T4', 'Difference 26 in 100, 95% confidence interval 12 to 40. Plain wording?', ['Exactly 26 more people in 100 will get better.', 'We can be fairly sure the true difference is between 12 and 40 more people in every 100.', 'There is a 95% chance the drug works.'], 1, 'The interval shows the uncertainty. Say the likely range in words and do not claim exactness.'),
    I('T5', 'What does p<0.001 tell you?', ['The drug works for 99.9% of people.', 'A difference this large would be very unlikely if the drug had no effect.', 'The result is clinically important.'], 1, 'A p-value is about chance, not size or importance. Lay summaries should explain results in words without p-values.'),
    I('T6', 'A rate rose from 10% to 15%. That is a rise of…', ['5 percentage points (a 50% relative rise)', '5% (relative)', '50 percentage points'], 0, 'Percentage points are the absolute difference; percent change is relative. Say which one you mean.'),
    I('T7', '38.2% succeeded on the drug and 11.9% on placebo. About how many people need the drug for one more to succeed?', ['About 2', 'About 4', 'About 26'], 1, 'The difference is 26.3 in 100, and 100 ÷ 26.3 ≈ 3.8: about 4 (the number needed to treat).'),
    I('T8', 'What does a standard deviation describe?', ['How precisely the mean is estimated', 'How spread out the individual values are', 'The chance that the result is real'], 1, 'The standard deviation describes the spread of the data; the standard error describes the precision of the mean.'),
  ] },
]

export const setById = (id: string) => SKILL_SETS.find((s) => s.id === id)
export const scoreSet = (set: SkillSet, answers: Record<string, number>) => set.items.filter((i) => answers[i.id] === i.answer).length
