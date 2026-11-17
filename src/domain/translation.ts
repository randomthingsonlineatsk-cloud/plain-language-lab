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
