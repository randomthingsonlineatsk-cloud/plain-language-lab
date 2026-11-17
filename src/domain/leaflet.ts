// Patient leaflets from the Labelling Workbench: the EU package leaflet and the US Medication Guide
// of Ostrevia, or any leaflet exported from that app (“Leaflet for the Plain Language Lab”). The
// headings and order stay as the Labelling Workbench set them; here the text is rewritten, its
// numbers checked, its key safety messages kept, and it is user-tested.
import LEAFLETS from './leaflets.json'
import { numberChecks, type NumberIssue } from './risk'
import { analyze } from './analyze'
import { findJargon } from '../shared/jargon'

export interface LeafletSection { num: string; heading: string; depth: number; text: string }
export interface LeafletFile { kind: 'labelling-workbench/patient-leaflet'; schema: number; region: 'eu' | 'us'; docKind: 'pl' | 'mg'; title: string; product: { brand: string; inn: string; form: string; strengths: string[]; manufacturer: string }; sections: LeafletSection[] }
export const LEAFLET_EXAMPLES = LEAFLETS as unknown as Record<string, LeafletFile>

export function readLeafletFile(text: string): LeafletFile {
  let j: LeafletFile
  try { j = JSON.parse(text) } catch { throw new Error('This is not a JSON file.') }
  if (j.kind !== 'labelling-workbench/patient-leaflet' || !Array.isArray(j.sections)) throw new Error('This is not a leaflet file. In the Labelling Workbench, open a package leaflet or Medication Guide, then Export, “Leaflet for the Plain Language Lab”.')
  return j
}

export interface KeyMessage { id: string; label: string; re: RegExp }
/** The safety and use messages a reader must be able to find and act on (Ostrevia; matched loosely so a plain rewrite still counts). */
export const KEY_MESSAGES: Record<'eu' | 'us', KeyMessage[]> = {
  eu: [
    { id: 'allergy', label: 'Do not take it if allergic to it or its ingredients', re: /allerg/i },
    { id: 'tb', label: 'Do not take it with active TB or another serious infection', re: /(tuberculosis|\bTB\b)[\s\S]*(serious infection|infection)/i },
    { id: 'pregnant', label: 'Do not take it if pregnant: it may harm the unborn baby', re: /pregnan[\s\S]{0,120}(unborn|baby)|(unborn|baby)[\s\S]{0,120}pregnan/i },
    { id: 'contraception', label: 'Contraception during treatment and for 4 weeks after', re: /(contracepti|birth control)[\s\S]{0,80}4 weeks|4 weeks[\s\S]{0,80}(contracepti|birth control)/i },
    { id: 'breastfeed', label: 'No breast-feeding during treatment and for 4 days after', re: /breast-?feed[\s\S]{0,80}4 days/i },
    { id: 'bloodtests', label: 'Blood tests before and during treatment', re: /blood tests?/i },
    { id: 'infection', label: 'Tell the doctor straight away about signs of a serious infection', re: /fever[\s\S]{0,80}(chills|cough)/i },
    { id: 'clot', label: 'Signs of a blood clot: leg pain or swelling, chest pain, sudden breathlessness', re: /leg pain[\s\S]{0,60}chest pain/i },
    { id: 'dose', label: 'One 10 mg tablet once a day', re: /10 mg[\s\S]{0,40}once a day|once a day[\s\S]{0,40}10 mg|one tablet[\s\S]{0,30}(once a day|each day|every day)/i },
    { id: 'missed', label: 'Missed dose: no double dose', re: /double dose|two doses|2 doses|twice/i },
    { id: 'overdose', label: 'Too much: talk to a doctor or pharmacist straight away', re: /(more|too much)[\s\S]{0,80}(doctor|pharmacist)/i },
    { id: 'children', label: 'Not for children and adolescents under 18', re: /under 18|children and adolescents/i },
    { id: 'reach', label: 'Keep out of the sight and reach of children', re: /reach of children/i },
  ],
  us: [
    { id: 'infection', label: 'Serious infections: tell the provider about fever, chills, cough', re: /infection[\s\S]{0,200}fever/i },
    { id: 'cancer', label: 'Cancer has happened; tell the provider about past cancer', re: /cancer/i },
    { id: 'clot', label: 'Blood clots: stop and get help for leg pain, chest pain, breathlessness', re: /blood clot[\s\S]{0,200}(leg pain|chest pain)/i },
    { id: 'allergy', label: 'Do not take it if allergic', re: /allerg/i },
    { id: 'pregnant', label: 'May harm an unborn baby; birth control for 4 weeks after', re: /(unborn|baby)[\s\S]{0,120}4 weeks|4 weeks[\s\S]{0,120}(unborn|baby)/i },
    { id: 'breastfeed', label: 'No breastfeeding during treatment and for 4 days after', re: /breastfeed[\s\S]{0,80}4 days/i },
    { id: 'dose', label: 'Once a day, swallowed whole', re: /(1 time|once) (each|a) day[\s\S]{0,120}whole|whole[\s\S]{0,120}(1 time|once) (each|a) day/i },
    { id: 'missed', label: 'Missed dose: not 2 doses the same day', re: /2 doses|two doses|double/i },
    { id: 'reach', label: 'Keep out of the reach of children', re: /reach of children/i },
  ],
}

export const sectionsWith = (f: LeafletFile, edits: Record<string, string>) => f.sections.map((s) => ({ ...s, text: edits[s.num] ?? s.text }))
export const leafletText = (secs: LeafletSection[]) => secs.map((s) => `${s.heading}\n${s.text}`).join('\n\n')

export interface LeafletReview { grade: number; perSection: { num: string; heading: string; grade: number; words: number; jargon: number }[]; messages: { m: KeyMessage; ok: boolean }[]; numbers: NumberIssue[]; jargon: number }
export function reviewLeaflet(f: LeafletFile, secs: LeafletSection[]): LeafletReview {
  const text = leafletText(secs)
  const perSection = secs.filter((s) => s.text.trim()).map((s) => { const a = analyze(s.text); return { num: s.num, heading: s.heading, grade: a.grade, words: a.words, jargon: findJargon(s.text).length } })
  return { grade: analyze(secs.map((s) => s.text).join('\n')).grade, perSection, messages: KEY_MESSAGES[f.region].map((m) => ({ m, ok: m.re.test(text) })), numbers: numberChecks(secs.map((s) => s.text).join('\n')).filter((n) => n.rule === 'PL-N04' || n.rule === 'PL-N02'), jargon: findJargon(text).length }
}

// PL6's starting point: the EU leaflet after a regulatory writer “tightened” it in SmPC language.
export const PL6_EDITS: Record<string, string> = {
  'pl2.2': 'Consult your physician or pharmacist prior to initiation of Ostrevia if you: have an active infection or a predisposition to recurrent infections, as lumiravostat-mediated immunomodulation attenuates host defence mechanisms; have a history of tuberculosis or exposure thereto, in which case screening will be undertaken prior to initiation; have a history of malignancy or new cutaneous lesions; have a history of venous thromboembolism; have hepatic impairment. Immediate medical consultation is necessitated upon manifestation of pyrexia, rigors, cough, lower-limb pain or oedema, thoracic pain or acute dyspnoea. Haematological and biochemical monitoring will be performed prior to and during treatment.',
  'pl2.6': 'Ostrevia is contraindicated in pregnancy owing to the potential for embryo-fetal toxicity. Women of childbearing potential must utilise highly effective contraception throughout treatment and for 4 weeks subsequent to the final dose. Lactation should be discontinued during treatment and for 4 days subsequent to the final dose.',
  'pl3': 'Always take this medicine exactly as your doctor or pharmacist has told you. The recommended posology is 10 mg administered orally once daily, which may be titrated to 25 mg once daily following 12 weeks of treatment at the discretion of the prescriber. Tablets are to be swallowed whole irrespective of food intake.',
  'pl4': 'Like all medicines, this medicine can cause side effects, although not everybody gets them. Serious adverse reactions necessitating immediate medical attention include manifestations of serious infection (pyrexia, rigors, cough, dysuria) and thromboembolic events (lower-limb pain or oedema, thoracic pain, acute dyspnoea). Very common (may affect more than 1 in 10 people): common cold. Common (may affect up to 1 in 10 people): headache, nausea, acne, herpes zoster, laboratory abnormalities. Uncommon (may affect up to 1 in 100 people): pneumonia, cellulitis, venous thromboembolism.',
}
