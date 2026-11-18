// Translation workflow for consent forms: forward translation, independent back-translation,
// reconciliation of each discrepancy, review and a translator's certificate, with each language
// version linked to the source version it came from. Consent must be in a language the
// participant understands (EU CTR Article 29; NDCT Rules 2019; ICMR National Ethical Guidelines),
// and Indian ethics committees usually ask for the back-translation. People translate: the app
// manages and checks (no machine translation).
import type { DocType, Project } from './types'
import { latestIssued } from './versions'
import { sectionsOf } from './project'

export const LANGUAGES: { id: string; name: string; script: 'Devanagari' | 'Bengali' | 'Gujarati' | 'Tamil' | 'Telugu' | 'Kannada' | 'Malayalam' | 'Latin'; region: 'IN' | 'EU' | 'other' }[] = [
  { id: 'hi', name: 'Hindi', script: 'Devanagari', region: 'IN' }, { id: 'mr', name: 'Marathi', script: 'Devanagari', region: 'IN' },
  { id: 'ta', name: 'Tamil', script: 'Tamil', region: 'IN' }, { id: 'te', name: 'Telugu', script: 'Telugu', region: 'IN' },
  { id: 'bn', name: 'Bengali', script: 'Bengali', region: 'IN' }, { id: 'gu', name: 'Gujarati', script: 'Gujarati', region: 'IN' },
  { id: 'kn', name: 'Kannada', script: 'Kannada', region: 'IN' }, { id: 'ml', name: 'Malayalam', script: 'Malayalam', region: 'IN' },
  { id: 'de', name: 'German', script: 'Latin', region: 'EU' }, { id: 'fr', name: 'French', script: 'Latin', region: 'EU' }, { id: 'es', name: 'Spanish', script: 'Latin', region: 'EU' },
  { id: 'it', name: 'Italian', script: 'Latin', region: 'EU' }, { id: 'pl', name: 'Polish', script: 'Latin', region: 'EU' }, { id: 'nl', name: 'Dutch', script: 'Latin', region: 'EU' },
  { id: 'fr-CA', name: 'French (Canada)', script: 'Latin', region: 'other' },
]
export type Discrepancy = 'none' | 'number' | 'omission' | 'addition' | 'meaning' | 'untranslated' | 'terminology'
export const DISCREPANCIES: { id: Discrepancy; label: string }[] = [
  { id: 'none', label: 'No discrepancy' }, { id: 'number', label: 'A number, dose or date differs' }, { id: 'omission', label: 'Something is left out' },
  { id: 'addition', label: 'Something is added' }, { id: 'meaning', label: 'The meaning or strength changes (“may” became “will”)' },
  { id: 'untranslated', label: 'Left in English or not translated' }, { id: 'terminology', label: 'A wrong or inconsistent term' },
]
export type SegStatus = 'to translate' | 'translated' | 'back-translated' | 'reconciled' | 'reviewed'
export interface Segment { id: string; heading: string; source: string; forward: string; back: string; status: SegStatus; discrepancy?: Discrepancy; note: string }
export interface Translation { id: string; docType: DocType; lang: string; langName: string; sourceVersion: string; segments: Segment[]; certificate?: { translator: string; date: string } }

const DIGITS: [number, number][] = [[0x0966, 0x096f], [0x09e6, 0x09ef], [0x0ae6, 0x0aef], [0x0be6, 0x0bef], [0x0c66, 0x0c6f], [0x0ce6, 0x0cef], [0x0d66, 0x0d6f]]
/** Native Indian digits (Devanagari ६, Bengali ৬, Tamil ௬ …) read as ASCII digits. */
export function asciiDigits(s: string): string {
  return s.replace(/[०-९০-৯૦-૯௦-௯౦-౯೦-೯൦-൯]/g, (c) => { const k = c.charCodeAt(0); const r = DIGITS.find(([a, b]) => k >= a && k <= b)!; return String(k - r[0]) })
}
export const numbersIn = (s: string) => (asciiDigits(s).match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.')).sort()

export function newTranslation(p: Project, docType: DocType, lang: string): Translation {
  const L = LANGUAGES.find((x) => x.id === lang)!
  const src = latestIssued(p, docType), secs = src?.sections ?? sectionsOf(p, docType)
  return { id: `T-${docType}-${lang}-${Date.now().toString(36)}`, docType, lang, langName: L.name, sourceVersion: src?.version ?? p.docs[docType].version,
    segments: secs.map((s) => ({ id: s.id, heading: s.heading, source: s.text, forward: '', back: '', status: 'to translate', note: '' })) }
}

export interface TrIssue { rule: string; seg: string; text: string }
/** PL-T01 to T05. */
export function translationChecks(t: Translation, allowLatin: string[] = []): TrIssue[] {
  const out: TrIssue[] = [], L = LANGUAGES.find((x) => x.id === t.lang)
  const allow = new Set(['mg', 'ml', 'mL', 'TB', 'HIV', 'ECG', 'NCT', 'CTRI', 'EU', 'http', 'www', ...allowLatin.map((x) => x.toLowerCase())])
  for (const s of t.segments) {
    if (!s.forward.trim() || s.forward.trim() === s.source.trim()) { out.push({ rule: 'PL-T02', seg: s.id, text: `“${s.heading}” is not translated.` }); continue }
    const a = numbersIn(s.source).join(' '), b = numbersIn(s.forward).join(' ')
    if (a !== b) out.push({ rule: 'PL-T01', seg: s.id, text: `“${s.heading}”: numbers differ (source ${a || 'none'}; translation ${b || 'none'}).` })
    if (L && L.script !== 'Latin') {
      const eng = (s.forward.match(/[A-Za-z]{3,}/g) ?? []).filter((w) => !allow.has(w.toLowerCase()) && !allow.has(w))
      if (eng.length) out.push({ rule: 'PL-T03', seg: s.id, text: `“${s.heading}”: English left in the translation: ${[...new Set(eng)].join(', ')}.` })
    }
    if (s.back.trim() && s.status !== 'reconciled' && s.status !== 'reviewed') out.push({ rule: 'PL-T04', seg: s.id, text: `“${s.heading}”: the back-translation is not reconciled yet.` })
    if (s.discrepancy && s.discrepancy !== 'none' && !s.note.trim()) out.push({ rule: 'PL-T04', seg: s.id, text: `“${s.heading}”: a ${s.discrepancy} discrepancy has no reconciliation note.` })
  }
  return out
}
export function staleTranslation(p: Project, t: Translation): boolean { const src = latestIssued(p, t.docType); return !!src && Number(t.sourceVersion) < Number(src.version) }

// ---------- PL10: a Hindi back-translation with six planted discrepancies ----------
// The Hindi was written for this exercise; the back-translation is a literal English rendering.
export const PL10_SEGMENTS: (Omit<Segment, 'status' | 'note' | 'discrepancy'> & { answer: Discrepancy; why: string })[] = [
  { id: 'S1', heading: 'Duration and visits', source: 'You will be in the study for about 25 weeks and come to 8 visits at the study site.', forward: 'आप लगभग 25 सप्ताह तक अध्ययन में रहेंगे और अध्ययन स्थल पर 8 बार आएँगे।', back: 'You will be in the study for about 25 weeks and will come to the study site 8 times.', answer: 'none', why: 'Same facts in other words.' },
  { id: 'S2', heading: 'Placebo', source: 'You have a 1 in 3 chance of receiving placebo. A placebo looks like the study medicine but has no medicine in it.', forward: 'आपको प्लेसिबो मिलने की संभावना 3 में से 1 है। प्लेसिबो अध्ययन की दवा जैसा दिखता है, पर उसमें कोई दवा नहीं होती।', back: 'Your chance of getting placebo is 1 in 3. Placebo looks like the study medicine but has no medicine in it.', answer: 'none', why: 'Faithful; the order of “1 in 3” changes but not its meaning.' },
  { id: 'S3', heading: 'How long you take it', source: 'You will take the study treatment for 16 weeks, by mouth, once a day.', forward: 'आप अध्ययन की दवा ६ सप्ताह तक, मुँह से, दिन में एक बार लेंगे।', back: 'You will take the study medicine for 6 weeks, by mouth, once a day.', answer: 'number', why: '16 weeks became ६ (6) weeks: a number error, caught by the digit check once native digits are read.' },
  { id: 'S4', heading: 'Stopping', source: 'You may stop taking part at any time without giving a reason.', forward: 'आप किसी भी समय भाग लेना बंद कर सकते हैं।', back: 'You can stop taking part at any time.', answer: 'omission', why: '“Without giving a reason” is missing: a right under CTR Article 29 and Table 3.' },
  { id: 'S5', heading: 'Unborn baby', source: 'The study medicine may harm an unborn baby.', forward: 'अध्ययन की दवा गर्भ में पल रहे शिशु को नुकसान पहुँचाएगी।', back: 'The study medicine will harm the unborn baby.', answer: 'meaning', why: '“May harm” became “will harm”: the strength of the statement changed.' },
  { id: 'S6', heading: 'Contraception', source: 'If you could become pregnant, use effective contraception.', forward: 'यदि आप गर्भवती हो सकती हैं, तो प्रभावी गर्भनिरोधक का उपयोग करें। यह दवा पूरी तरह सुरक्षित है।', back: 'If you could become pregnant, use effective contraception. This medicine is completely safe.', answer: 'addition', why: 'A sentence claiming the medicine is completely safe was added.' },
  { id: 'S7', heading: 'Groups', source: 'You will be put into one of 3 groups by chance (like rolling a dice).', forward: 'आपको randomisation द्वारा 3 समूहों में से एक में रखा जाएगा।', back: 'You will be put into one of 3 groups by randomisation.', answer: 'untranslated', why: '“Randomisation” was left in English, and the plain explanation (“by chance”) was lost with it.' },
  { id: 'S8', heading: 'Blood', source: 'Blood samples add up to about 75 mL over the whole study.', forward: 'पूरे अध्ययन में कुल मिलाकर लगभग 75 मि.ली. रक्त लिया जाएगा।', back: 'In the whole study, about 75 mL of blood in total will be taken.', answer: 'none', why: 'Faithful.' },
  { id: 'S9', heading: 'Injury', source: 'If you are injured as a result of taking part, you will receive medical treatment free of charge.', forward: 'यदि भाग लेने के कारण आपको चोट लगती है, तो आपका इलाज किया जाएगा।', back: 'If you are injured because of taking part, you will be treated.', answer: 'omission', why: '“Free of charge” is missing: the participant may think they must pay.' },
]
export function pl10Translation(): Translation {
  return { id: 'T-PL10-hi', docType: 'consent', lang: 'hi', langName: 'Hindi', sourceVersion: '1.0', segments: PL10_SEGMENTS.map(({ answer: _a, why: _w, ...s }) => ({ ...s, status: 'back-translated', note: '' })) }
}

// ---------- Glossary and translation memory ----------
// Translators keep an approved glossary per language (the agreed word for each medical term) and a
// translation memory (segments already approved). PL-T05 flags a source term whose glossary word
// is missing from the translation; PL-T06 flags a segment translated differently from an approved
// translation of the same English text. The starter glossaries were written for this app; a
// qualified translator should review them before any real use.
export interface GlossaryEntry { en: string; term: string; note?: string }
export const STARTER_GLOSSARY: Record<string, GlossaryEntry[]> = {
  mr: [
    { en: 'side effect', term: 'दुष्परिणाम' }, { en: 'placebo', term: 'प्लेसिबो', note: 'explain once: औषध नसलेली गोळी' },
    { en: 'study doctor', term: 'अभ्यासाचे डॉक्टर' }, { en: 'ethics committee', term: 'नीतिमत्ता समिती' },
    { en: 'consent form', term: 'संमतीपत्र' }, { en: 'blood test', term: 'रक्त तपासणी' }, { en: 'tablet', term: 'गोळी' }, { en: 'visit', term: 'भेट' },
  ],
  ta: [
    { en: 'side effect', term: 'பக்க விளைவு' }, { en: 'placebo', term: 'பிளசிபோ', note: 'explain once: மருந்து இல்லாத மாத்திரை' },
    { en: 'study doctor', term: 'ஆய்வு மருத்துவர்' }, { en: 'ethics committee', term: 'நெறிமுறைக் குழு' },
    { en: 'consent form', term: 'ஒப்புதல் படிவம்' }, { en: 'blood test', term: 'இரத்தப் பரிசோதனை' }, { en: 'tablet', term: 'மாத்திரை' }, { en: 'visit', term: 'வருகை' },
  ],
}
export interface TrIssue2 { rule: string; seg: string; text: string }
export function glossaryChecks(t: Translation, glossary: GlossaryEntry[] = [], memory: Translation[] = []): TrIssue2[] {
  const out: TrIssue2[] = []
  for (const s of t.segments) {
    if (!s.forward.trim()) continue
    for (const g of glossary) if (new RegExp(`\\b${g.en.replace(/s$/, '')}s?\\b`, 'i').test(s.source) && !s.forward.includes(g.term)) out.push({ rule: 'PL-T05', seg: s.id, text: `“${s.heading}”: “${g.en}” should be “${g.term}” (glossary).` })
    const prior = memory.filter((m) => m.id !== t.id && m.lang === t.lang).flatMap((m) => m.segments.filter((x) => x.status === 'reviewed' && x.source.trim() === s.source.trim() && x.forward.trim()))
    if (prior.length && !prior.some((x) => x.forward.trim() === s.forward.trim())) out.push({ rule: 'PL-T06', seg: s.id, text: `“${s.heading}”: an approved translation of the same English exists and reads differently.` })
  }
  return out
}

// ---------- Practice: one planted discrepancy per language ----------
// Three short segments per language; one carries a discrepancy. Written for this app (simple,
// everyday sentences); not a validated translation.
type Practice = { id: string; heading: string; source: string; forward: string; back: string; answer: Discrepancy; why: string }
const S1 = 'You will take one tablet every day for 16 weeks.', S2 = 'You can stop taking part at any time.', S3 = 'About 3 in 100 people had a change in a liver blood test.'
export const PRACTICE: Record<string, Practice[]> = {
  te: [
    { id: 'te1', heading: 'Tablets', source: S1, forward: 'మీరు 16 వారాల పాటు ప్రతిరోజూ ఒక మాత్ర తీసుకుంటారు.', back: 'You will take one tablet every day for 16 weeks.', answer: 'none', why: 'Faithful.' },
    { id: 'te2', heading: 'Stopping', source: S2, forward: 'మీరు ఎప్పుడైనా పాల్గొనడం ఆపవచ్చు.', back: 'You can stop taking part at any time.', answer: 'none', why: 'Faithful.' },
    { id: 'te3', heading: 'Liver test', source: S3, forward: 'సుమారు 100 మందిలో 3 మందికి కాలేయ వ్యాధి వచ్చింది.', back: 'About 3 in 100 people got liver disease.', answer: 'meaning', why: 'A change in a blood test became liver disease: the risk sounds far worse.' },
  ],
  kn: [
    { id: 'kn1', heading: 'Tablets', source: S1, forward: 'ನೀವು 6 ವಾರಗಳ ಕಾಲ ಪ್ರತಿದಿನ ಒಂದು ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತೀರಿ.', back: 'You will take one tablet every day for 6 weeks.', answer: 'number', why: '16 weeks became 6.' },
    { id: 'kn2', heading: 'Stopping', source: S2, forward: 'ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಭಾಗವಹಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಬಹುದು.', back: 'You can stop taking part whenever you want.', answer: 'none', why: 'Faithful.' },
    { id: 'kn3', heading: 'Liver test', source: S3, forward: 'ಸುಮಾರು 100 ಜನರಲ್ಲಿ 3 ಜನರಿಗೆ ಯಕೃತ್ತಿನ ರಕ್ತ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.', back: 'About 3 in 100 people had a change in a liver blood test.', answer: 'none', why: 'Faithful.' },
  ],
  bn: [
    { id: 'bn1', heading: 'Tablets', source: S1, forward: 'আপনি ১৬ সপ্তাহ ধরে প্রতিদিন একটি করে ট্যাবলেট খাবেন।', back: 'You will take one tablet each day for 16 weeks.', answer: 'none', why: 'Faithful (Bengali digits ১৬ = 16).' },
    { id: 'bn2', heading: 'Stopping', source: S2, forward: 'আপনি অংশগ্রহণ বন্ধ করতে পারেন।', back: 'You can stop taking part.', answer: 'omission', why: '“At any time” is missing: the right to stop at any moment is a required element.' },
    { id: 'bn3', heading: 'Liver test', source: S3, forward: 'প্রায় ১০০ জনের মধ্যে ৩ জনের লিভারের রক্ত পরীক্ষায় পরিবর্তন দেখা গেছে।', back: 'About 3 in 100 people had a change in the liver blood test.', answer: 'none', why: 'Faithful.' },
  ],
  gu: [
    { id: 'gu1', heading: 'Tablets', source: S1, forward: 'તમે 16 અઠવાડિયા સુધી દરરોજ એક ગોળી લેશો.', back: 'You will take one tablet daily for 16 weeks.', answer: 'none', why: 'Faithful.' },
    { id: 'gu2', heading: 'Stopping', source: S2, forward: 'તમે કોઈપણ સમયે ભાગ લેવાનું બંધ કરી શકો છો.', back: 'You can stop taking part at any time.', answer: 'none', why: 'Faithful.' },
    { id: 'gu3', heading: 'Liver test', source: S3, forward: 'લગભગ 100 માંથી 3 લોકોને લિવરની બીમારી થઈ.', back: 'About 3 in 100 people got a liver illness.', answer: 'meaning', why: 'A blood test change became an illness.' },
  ],
  ml: [
    { id: 'ml1', heading: 'Tablets', source: S1, forward: 'നിങ്ങൾ 6 ആഴ്ചത്തേക്ക് ദിവസവും ഒരു ഗുളിക കഴിക്കും.', back: 'You will take one tablet daily for 6 weeks.', answer: 'number', why: '16 weeks became 6.' },
    { id: 'ml2', heading: 'Stopping', source: S2, forward: 'നിങ്ങൾക്ക് എപ്പോൾ വേണമെങ്കിലും പങ്കാളിത്തം നിർത്താം.', back: 'You can stop taking part whenever you want.', answer: 'none', why: 'Faithful.' },
    { id: 'ml3', heading: 'Liver test', source: S3, forward: 'ഏകദേശം 100 പേരിൽ 3 പേർക്ക് കരളിന്റെ രക്തപരിശോധനയിൽ മാറ്റം കണ്ടു.', back: 'In about 3 of 100 people, a change was seen in the liver blood test.', answer: 'none', why: 'Faithful.' },
  ],
}

// ---------- PL16: Marathi and Tamil with the glossary ----------
export const PL16_SEGMENTS: Record<'mr' | 'ta', Practice[]> = {
  mr: [
    { id: 'M1', heading: 'Tablets', source: S1, forward: 'तुम्ही १६ आठवडे दररोज एक गोळी घ्याल.', back: 'You will take one tablet daily for 16 weeks.', answer: 'none', why: 'Faithful; uses the glossary word गोळी.' },
    { id: 'M2', heading: 'Placebo', source: 'You have a 1 in 3 chance of getting a placebo, a tablet with no medicine in it.', forward: 'तुम्हाला ३ पैकी १ शक्यता आहे की तुम्हाला डमी गोळी मिळेल, ज्यात औषध नसते.', back: 'You have a 1 in 3 chance of getting a dummy tablet, which has no medicine.', answer: 'terminology', why: 'The glossary word for placebo (प्लेसिबो, explained once) was replaced by “डमी गोळी”.' },
    { id: 'M3', heading: 'Side effects', source: 'The most common side effect was a cold.', forward: 'सर्वात सामान्य साइड इफेक्ट सर्दी हा होता.', back: 'The most common side effect was a cold.', answer: 'terminology', why: 'English “साइड इफेक्ट” written in Marathi script instead of the glossary word दुष्परिणाम.' },
    { id: 'M4', heading: 'Visits', source: 'You will come to 8 visits.', forward: 'तुम्ही ६ भेटींसाठी याल.', back: 'You will come for 6 visits.', answer: 'number', why: '8 visits became 6 (६).' },
    { id: 'M5', heading: 'Stopping', source: S2, forward: 'तुम्ही कधीही सहभाग थांबवू शकता.', back: 'You can stop taking part at any time.', answer: 'none', why: 'Faithful.' },
  ],
  ta: [
    { id: 'T1', heading: 'Tablets', source: S1, forward: 'நீங்கள் 16 வாரங்களுக்கு தினமும் ஒரு மாத்திரை எடுத்துக்கொள்வீர்கள்.', back: 'You will take one tablet daily for 16 weeks.', answer: 'none', why: 'Faithful.' },
    { id: 'T2', heading: 'Stopping', source: S2, forward: 'நீங்கள் பங்கேற்பதை நிறுத்தலாம்.', back: 'You can stop taking part.', answer: 'omission', why: '“At any time” is missing.' },
    { id: 'T3', heading: 'Side effects', source: 'The most common side effect was a cold.', forward: 'மிகவும் பொதுவான பக்க விளைவு சளி.', back: 'The most common side effect was a cold.', answer: 'none', why: 'Faithful; uses the glossary word பக்க விளைவு.' },
    { id: 'T4', heading: 'Study doctor', source: 'Tell the study doctor about any health problem.', forward: 'எந்த உடல்நலப் பிரச்சினையையும் டாக்டரிடம் சொல்லுங்கள்.', back: 'Tell the doctor about any health problem.', answer: 'terminology', why: '“Study doctor” became just “doctor” (டாக்டர்), so the reader may tell their own doctor instead; the glossary has ஆய்வு மருத்துவர்.' },
    { id: 'T5', heading: 'Liver test', source: S3, forward: 'சுமார் 100 பேரில் 3 பேருக்கு கல்லீரல் இரத்தப் பரிசோதனையில் மாற்றம் இருந்தது.', back: 'About 3 in 100 people had a change in a liver blood test.', answer: 'none', why: 'Faithful.' },
  ],
}
export function pl16Translations(): Translation[] {
  return (['mr', 'ta'] as const).map((lang) => ({ id: `T-PL16-${lang}`, docType: 'consent', lang, langName: lang === 'mr' ? 'Marathi' : 'Tamil', sourceVersion: '1.0',
    segments: PL16_SEGMENTS[lang].map(({ answer: _a, why: _w, ...s }) => ({ ...s, status: 'back-translated' as SegStatus, note: '' })) }))
}

/** Descriptive measures for a language with no validated readability formula. */
export function descriptive(text: string) {
  const sents = text.split(/(?<=[.!?।])\s+|\n+/).map((x) => x.trim()).filter(Boolean), ws = text.split(/\s+/).filter(Boolean)
  const longest = sents.reduce((m, x) => Math.max(m, x.split(/\s+/).filter(Boolean).length), 0)
  const chars = ws.reduce((n, w) => n + [...w.replace(/[^\p{L}\p{M}]/gu, '')].length, 0)
  return { sentences: sents.length, words: ws.length, wordsPerSentence: sents.length ? Math.round((ws.length / sents.length) * 10) / 10 : 0, longest, charsPerWord: ws.length ? Math.round((chars / ws.length) * 10) / 10 : 0 }
}
