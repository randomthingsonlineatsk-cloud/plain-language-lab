// Rewrite drills: a jargon-heavy passage goes in, the learner rewrites it for a lay reader, and the
// rewrite is scored by rules: readability against the target, jargon removed or explained,
// sentence length, passive voice, and meaning kept. Meaning is checked only for what can be
// listed: the facts that must survive, and claims that must not be added.
import { analyze } from './analyze'
import { findJargon } from '../shared/jargon'

export interface Fact { label: string; re: RegExp }
export interface Passage { id: string; title: string; kind: 'Consent' | 'Leaflet' | 'Lay summary' | 'Assent'; context: string; source: string; target: number; keep: Fact[]; forbid: Fact[]; model: string }

const SAFE: Fact = { label: 'Claims it is safe or risk-free', re: /(?<!\b(?:if|whether)\b.{0,25})\b(?:is|are)\s+(?:completely |totally |very )?safe\b|\bno risks?\b|\brisk-free\b|\bguarantee/i }
export const PASSAGES: Passage[] = [
  { id: 'D1', title: 'Random assignment and placebo', kind: 'Consent', context: 'VERDANT-1 consent form, “What will happen if I take part?”', target: 8,
    source: 'Subjects meeting all inclusion criteria and none of the exclusion criteria will be randomized in a 1:1:1 ratio to receive lumiravostat 25 mg, lumiravostat 10 mg or matching placebo administered orally once daily for a treatment period of 16 weeks. Neither the subject nor the investigator will be aware of treatment allocation.',
    keep: [{ label: 'Three groups, 1 in 3 chance', re: /1 in 3|one in three|three groups/i }, { label: 'What placebo is', re: /placebo[^.]*(no medicine|dummy|nothing in it|no active)|(dummy|no medicine)[^.]*placebo/i }, { label: '16 weeks', re: /16 weeks|sixteen weeks/i }, { label: 'Once a day, by mouth', re: /(once a day|once daily|every day|each day)/i }, { label: 'Nobody knows the group', re: /(neither|nobody|no one|not know|won.t know|will not know)/i }],
    forbid: [SAFE], model: 'You will be put into one of three groups by chance, like rolling a dice. You have a 1 in 3 chance of being in each group. Two groups take lumiravostat (25 mg or 10 mg). The third takes a placebo: a tablet that looks the same but has no medicine in it. You take one tablet by mouth once a day for 16 weeks. Neither you nor the study doctor will know which group you are in.' },
  { id: 'D2', title: 'Liver tests and pregnancy', kind: 'Consent', context: 'VERDANT-1 consent form, “Risks and discomforts”', target: 8,
    source: 'Hepatic enzyme elevations (ALT >3× ULN) were observed in 3% of subjects receiving lumiravostat in Phase 2 studies; these were asymptomatic and resolved upon discontinuation. Upper respiratory tract infections were reported very commonly (12%). The potential for teratogenicity has been identified in nonclinical studies; therefore WOCBP must utilize highly effective contraception.',
    keep: [{ label: 'Liver', re: /liver/i }, { label: '3 in 100', re: /3 in 100|3%|three in 100|about 1 in 33/i }, { label: 'Went away after stopping', re: /(went away|got better|back to normal|returned to normal|resolved)[^.]*stop|stop[^.]*(went away|got better|normal)/i }, { label: 'Colds or chest infections, about 12 in 100', re: /12 in 100|12%|about 1 in 8/i }, { label: 'Could harm an unborn baby', re: /unborn baby|harm (a|the) baby|baby/i }, { label: 'Birth control', re: /contracepti|birth control/i }],
    forbid: [SAFE], model: 'In earlier studies, about 3 in 100 people who took lumiravostat had higher results on a liver blood test. They had no symptoms, and the results went back to normal when they stopped the medicine. About 12 in 100 people had a cold or another nose, throat or chest infection. Tests in animals suggest the medicine could harm an unborn baby. If you could become pregnant, you must use effective birth control.' },
  { id: 'D3', title: 'Leaving the study', kind: 'Consent', context: 'VERDANT-1 consent form, “Taking part is voluntary”', target: 8,
    source: 'Participation in this study is entirely voluntary. You may withdraw your consent at any time without penalty or loss of benefits to which you are otherwise entitled. Should you elect to discontinue, you will be requested to complete an early termination visit to ensure your safety.',
    keep: [{ label: 'It is your choice', re: /choice|choose|voluntary|up to you|do not have to|don.t have to/i }, { label: 'Stop at any time', re: /any time/i }, { label: 'Your care will not change', re: /(not|won.t) (affect|change)|still (get|have|receive)|no penalty/i }, { label: 'A last visit for safety', re: /(last|final|one more) visit/i }],
    forbid: [SAFE], model: 'It is your choice to take part. You can stop at any time. If you stop, your care will not change and you will not lose anything you are entitled to. We will ask you to come for one last visit to check that you are well.' },
  { id: 'D4', title: 'Blood tests', kind: 'Consent', context: 'VERDANT-1 consent form, “What will happen if I take part?”', target: 8,
    source: 'At each scheduled visit, venipuncture will be performed for hematology, clinical chemistry and pharmacokinetic sampling. The cumulative blood volume over the study duration will not exceed 75 mL.',
    keep: [{ label: 'Blood from a vein or the arm', re: /blood/i }, { label: 'At the visits', re: /visit/i }, { label: '75 mL or about 5 tablespoons', re: /75 ?mL|5 tablespoons|five tablespoons/i }, { label: 'What the tests are for', re: /(check|test|measure)[^.]*(health|liver|kidney|blood|medicine)/i }],
    forbid: [SAFE], model: 'At each visit, a nurse will take some blood from a vein in your arm. The blood is used to check your health and to measure how much medicine is in your body. Over the whole study we will take no more than 75 mL, about 5 tablespoons.' },
  { id: 'D5', title: 'Who should not take it', kind: 'Leaflet', context: 'Ostrevia package leaflet, section 2', target: 8,
    source: 'Do not take Ostrevia if you are hypersensitive to lumiravostat or any of the excipients listed in section 6. Concomitant administration with strong CYP3A inhibitors is contraindicated.',
    keep: [{ label: 'Do not take', re: /do not take|don.t take/i }, { label: 'Allergic to it', re: /allerg/i }, { label: 'Other ingredients, section 6', re: /section 6/i }, { label: 'Some other medicines', re: /(other|some|certain) medicines/i }],
    forbid: [SAFE], model: 'Do not take Ostrevia:\n• if you are allergic to lumiravostat or any of the other ingredients of this medicine (listed in section 6);\n• if you take certain other medicines, such as some medicines for fungal infections or HIV. Ask your doctor or pharmacist if you are not sure.' },
  { id: 'D6', title: 'A phase 2 result', kind: 'Lay summary', context: 'Lay summary of HRP-201 (illustrative numbers)', target: 8,
    source: 'The primary endpoint was met: the proportion of participants achieving IGA-CHE treatment success at Week 12 was 38.2% in the lumiravostat 25 mg arm versus 11.9% in the placebo arm (difference 26.3%; 95% CI 12.4 to 40.2; p<0.001).',
    keep: [{ label: 'About 38 in 100 on 25 mg', re: /38 in 100|38%|about 4 in 10/i }, { label: 'About 12 in 100 on placebo', re: /12 in 100|12%|about 1 in 8|11\.9/i }, { label: 'At week 12', re: /12 weeks|week 12/i }, { label: 'What success means', re: /clear|almost clear/i }],
    forbid: [{ label: 'A p-value in lay text', re: /p\s*[<=>]\s*0?\.\d/i }, { label: 'Promotional or overclaiming words', re: /\b(proves?|proven|cure[sd]?|breakthrough|miracle|amazing)\b/i }, SAFE],
    model: 'After 12 weeks, the hands of about 38 in 100 people who took lumiravostat 25 mg were clear or almost clear. This happened for about 12 in 100 people who took the placebo. One study alone cannot answer every question about a medicine.' },
  { id: 'D7', title: 'Assent for a teenager', kind: 'Assent', context: 'Written assent, ages 12 to 17', target: 6,
    source: 'You are being asked to participate in a research study evaluating the efficacy and safety of an investigational agent for the treatment of chronic hand eczema. Your parent or legal guardian has provided permission; however, your participation is contingent upon your own agreement, and you may decline without repercussion.',
    keep: [{ label: 'It is research', re: /research|study/i }, { label: 'A new medicine', re: /new medicine|not yet approved|being tested/i }, { label: 'Parent asked too', re: /parent/i }, { label: 'You can say no', re: /say no|don.t have to|do not have to|your choice/i }],
    forbid: [SAFE], model: 'This is a research study. We are testing a new medicine for hand eczema to see if it works and is safe. Your parent has said you can take part, but it is your choice. You can say no, and no one will be upset with you.' },
  { id: 'D8', title: 'Low blood sugar', kind: 'Consent', context: 'GLV-12-301 consent form, “Risks and discomforts”', target: 8,
    source: 'Hypoglycaemic episodes may occur, particularly when GLV-12 is co-administered with sulfonylureas. Symptoms include diaphoresis, tremor, tachycardia and confusion.',
    keep: [{ label: 'Low blood sugar', re: /low blood sugar/i }, { label: 'More likely with some other diabetes medicines', re: /(other|some) (diabetes )?medicines|sulfonylurea/i }, { label: 'Sweating', re: /sweat/i }, { label: 'Shaking', re: /shak|trembl/i }, { label: 'Fast heartbeat', re: /fast (heart|pulse)|heart (beats|racing|pounding)/i }, { label: 'Confusion', re: /confus/i }],
    forbid: [SAFE], model: 'GLV-12 can make your blood sugar go too low. This is more likely if you also take some other diabetes medicines. Signs of low blood sugar are sweating, shaking, a fast heartbeat and feeling confused.' },
]

export interface DrillScore { score: number; lines: { label: string; got: number; of: number; note?: string }[]; grade: number; kept: { label: string; ok: boolean }[]; forbidden: string[] }
const passive = (t: string) => analyze(t).problems.filter((p) => p.kind === 'passive').length

export function scoreRewrite(p: Passage, text: string): DrillScore {
  const a0 = analyze(p.source, p.target), a = analyze(text, p.target)
  const g0 = a0.grade, g = a.grade
  const read = g <= p.target ? 1 : g0 <= p.target ? 0 : Math.max(0, Math.min(1, (g0 - g) / (g0 - p.target)))
  const j0 = findJargon(p.source).map((j) => j.word.toLowerCase())
  // A term counts as explained when the same sentence goes on to say what it is.
  const explained = (w: string) => new RegExp(`${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:[(–—:,]|\\b(?:means|which|that|with|is a|is an|looks)\\b)[^.]{3,}`, 'i').test(text)
  const left = findJargon(text).filter((j) => j0.includes(j.word.toLowerCase()) && !explained(j.word))
  const jar = j0.length ? 1 - left.length / j0.length : 1
  const long = a.sentenceList.length ? a.sentenceList.filter((s) => s.words <= 20).length / a.sentenceList.length : 0
  const pv = passive(text), pas = pv <= 1 ? 1 : Math.max(0, 1 - (pv - 1) / 3)
  const kept = p.keep.map((f) => ({ label: f.label, ok: f.re.test(text) }))
  const keepFrac = kept.filter((k) => k.ok).length / kept.length
  const forbidden = p.forbid.filter((f) => f.re.test(text)).map((f) => f.label)
  const lines = [
    { label: `Reading level: grade ${g} (target ${p.target}, original ${g0})`, got: Math.round(30 * read), of: 30 },
    { label: `Jargon removed or explained (${j0.length - left.length} of ${j0.length})`, got: Math.round(20 * jar), of: 20, note: left.length ? `Still unexplained: ${left.map((j) => j.word).join(', ')}` : undefined },
    { label: `Sentences of 20 words or fewer (${Math.round(long * 100)}%)`, got: Math.round(15 * long), of: 15 },
    { label: `Passive voice (${pv})`, got: Math.round(10 * pas), of: 10 },
    { label: `Facts kept (${kept.filter((k) => k.ok).length} of ${kept.length})`, got: Math.round(25 * keepFrac), of: 25 },
  ]
  if (forbidden.length) lines.push({ label: `Claims that must not be added: ${forbidden.join('; ')}`, got: -10 * forbidden.length, of: 0 })
  let score = Math.max(0, lines.reduce((n, l) => n + l.got, 0))
  if (!text.trim() || a.words < 8) score = 0
  if (keepFrac < 0.5) score = Math.min(score, 40)
  return { score: Math.min(100, score), lines, grade: g, kept, forbidden }
}
