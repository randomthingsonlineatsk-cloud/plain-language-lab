import { describe, expect, test } from 'vitest'
import { startMission, grade, PANEL_SCOPE } from '../src/domain/missions'
import { sectionsOf, laySections } from '../src/domain/project'
import { CDC_ITEMS, PEMAT_ITEMS, PL13_KEY, cdcScore, pematScores, hints, type Rating } from '../src/domain/literacy'
import { panelStatus, panelComments, PERSONAS } from '../src/domain/panel'
import { easyReadChecks, audioScriptFrom, audioChecks } from '../src/domain/easyread'
import { glossaryChecks, PRACTICE, PL16_SEGMENTS, descriptive, asciiDigits, numbersIn } from '../src/domain/translation'
import { plsChecks } from '../src/domain/pls'
import { requiredPlan, planIssues, siteTargets } from '../src/domain/access'
import { CONSENT_EDITS } from './journey.fixture'

const fails = (lines: { label: string; got: number; of: number }[]) => lines.filter((d) => d.got < d.of - 0.01).map((d) => d.label)

describe('health-literacy scorecard', () => {
  test('scores follow the official arithmetic: CDC points over applicable items; PEMAT agree over non-N/A', () => {
    const r: Record<string, Rating> = Object.fromEntries(CDC_ITEMS.map((i) => [i.id, i.reverse ? 'no' : 'yes']))
    expect(cdcScore(r)).toBe(100)
    expect(cdcScore({ ...r, C17: 'yes' })).toBe(95)
    expect(cdcScore({ ...r, C12: 'na', C13: 'na', C14: 'na', C1: 'no' })).toBe(Math.round(100 * 16 / 17))
    const key = Object.fromEntries(Object.entries(PL13_KEY).map(([k, v]) => [k, v.r]))
    expect(cdcScore(key)).toBe(10) // items C5 and C12 of 20
    expect(pematScores(key)).toEqual({ understandability: 10, actionability: 17 })
    expect(PEMAT_ITEMS.map((i) => i.id)).not.toContain('P13')
  })
  test('hints measure what the text shows', () => {
    const h = hints('Information\nSubjects will be dosed. ALT elevations represented a relative increase of 50%.')
    expect(h.P21.rating).toBe('no'); expect(h.C17.rating).toBe('yes'); expect(h.P4.rating).toBe('no')
  })
  test('PL13: reference ratings and a plain rewrite pass; the start fails', () => {
    const p = startMission('PL13'); expect(grade(p).passed).toBe(false)
    p.scorecards!.pl13 = { cdc: Object.fromEntries(CDC_ITEMS.map((i) => [i.id, PL13_KEY[i.id].r])), pemat: Object.fromEntries(PEMAT_ITEMS.map((i) => [i.id, PL13_KEY[i.id].r])) }
    p.mission!.answers.pl13text = 'Your study visits\nYou will come to the clinic every 4 weeks while you take the tablets.\nAt each visit, the study team will:\n- take a little blood, about 1 tablespoon, to check your liver\n- check your heart rate\n- look at your hands and ask how itchy they are\nIn earlier studies, about 3 in 100 people had a change in a liver blood test. It got better when they stopped the tablets.\nIf you feel unwell, call the study team on [phone number].'
    expect(fails(grade(p).detail)).toEqual([])
  })
})

describe('patient panel', () => {
  test('five personas comment on the generated draft; ids are stable', () => {
    const p = startMission('PL14'); expect(PERSONAS).toHaveLength(5)
    const c = p.panel!.comments; expect(c.length).toBeGreaterThanOrEqual(6); expect(new Set(c.map((x) => x.id)).size).toBe(c.length)
    expect(new Set(c.map((x) => x.persona)).size).toBeGreaterThanOrEqual(3)
    expect(panelComments(sectionsOf(p, 'consent').filter((x) => PANEL_SCOPE.includes(x.id))).map((x) => x.id)).toEqual(c.map((x) => x.id))
    expect(grade(p).passed).toBe(false)
  })
  test('PL14: revising the sections closes comments; kept ones need a reason', () => {
    const p = startMission('PL14')
    p.docs.consent.edits = { key: CONSENT_EDITS.key, what: CONSENT_EDITS.what, risks: CONSENT_EDITS.risks + ' Tell the study doctor about all your other medicines, because some may not mix well with the study tablets.' }
    for (const r of panelStatus(p.panel!, sectionsOf(p, 'consent'))) if (r.state === 'open') p.panel!.resolutions[r.c.id] = { action: 'kept', note: 'Kept: covered in another section of the form.', by: 'tester', utc: '2026-11-17T10:00:00Z' }
    const rows = panelStatus(p.panel!, sectionsOf(p, 'consent'))
    expect(rows.every((r) => r.state !== 'open')).toBe(true)
    expect(fails(grade(p).detail)).toEqual([])
  })
})

describe('Easy Read and audio', () => {
  test('the draft from the consent form fails; a real Easy Read version passes', () => {
    const p = startMission('PL15'); expect(grade(p).passed).toBe(false)
    p.easyRead = { fontPt: 16, audio: '', lines: [
      { text: 'This is about a research study.', picture: 'question' }, { text: 'You can choose to take part or not.', picture: 'check' },
      { text: 'We want to see if a new medicine helps sore hands.', picture: 'hand' }, { text: 'You will take 1 tablet each day.', picture: 'pill' },
      { text: 'You will do this for 16 weeks.', picture: 'calendar' }, { text: 'Some people get a tablet with no medicine in it.', picture: 'pill' },
      { text: 'You may feel unwell or get a cold.', picture: 'warning' }, { text: 'You can stop at any time.', picture: 'stop' },
      { text: 'Ask the study doctor if you have questions.', picture: 'doctor' }] }
    p.easyRead.audio = audioScriptFrom(p.easyRead)
    expect(easyReadChecks(p.easyRead).filter((c) => !c.ok).map((c) => c.id)).toEqual([])
    expect(audioChecks(p.easyRead.audio).filter((c) => !c.ok).map((c) => c.id)).toEqual([])
    expect(fails(grade(p).detail)).toEqual([])
  })
})

describe('translation glossary, memory and practice', () => {
  test('practice sets: three segments a language, one planted discrepancy each; numbers in native digits are read', () => {
    for (const [lang, segs] of Object.entries(PRACTICE)) { expect(segs, lang).toHaveLength(3); expect(segs.filter((x) => x.answer !== 'none'), lang).toHaveLength(1) }
    expect(Object.keys(PRACTICE).sort()).toEqual(['bn', 'gu', 'kn', 'ml', 'te'])
    for (const segs of Object.values(PRACTICE)) for (const s of segs) if (s.answer === 'none') expect(numbersIn(s.forward)).toEqual(numbersIn(s.source))
    expect(asciiDigits('১৬')).toBe('16')
    expect(descriptive('एक वाक्य। दूसरा वाक्य है।')).toMatchObject({ sentences: 2, words: 5 })
  })
  test('PL16: classify, note and correct to the glossary', () => {
    const p = startMission('PL16'); expect(grade(p).passed).toBe(false)
    expect(p.translations.flatMap((t) => glossaryChecks(t, p.glossary![t.lang]).map((i) => i.seg)).sort()).toEqual(['M2', 'M3', 'T4'])
    const fix: Record<string, string> = { M2: 'तुम्हाला ३ पैकी १ शक्यता आहे की तुम्हाला प्लेसिबो (औषध नसलेली गोळी) मिळेल.', M3: 'सर्वात सामान्य दुष्परिणाम सर्दी हा होता.', M4: 'तुम्ही ८ भेटींसाठी याल.', T2: 'நீங்கள் எப்போது வேண்டுமானாலும் பங்கேற்பதை நிறுத்தலாம்.', T4: 'எந்த உடல்நலப் பிரச்சினையையும் ஆய்வு மருத்துவர் அவர்களிடம் சொல்லுங்கள்.' }
    for (const t of p.translations) for (const s of t.segments) {
      const ans = PL16_SEGMENTS[t.lang as 'mr' | 'ta'].find((x) => x.id === s.id)!.answer
      s.discrepancy = ans; s.note = ans === 'none' ? '' : 'Corrected with the translator and the glossary.'; if (fix[s.id]) s.forward = fix[s.id]
    }
    expect(fails(grade(p).detail)).toEqual([])
  })
})

describe('publication summary', () => {
  test('PL17: an empty draft fails; a plain summary passes every check', () => {
    const p = startMission('PL17'); expect(grade(p).passed).toBe(false)
    p.pls = { title: 'A new tablet for long-lasting hand eczema', panels: { question: 'Does a new tablet help hand eczema that creams have not cleared?', did: '324 adults took the new tablet or a dummy tablet for 16 weeks.', found: 'Skin cleared in 38 in 100 people on the higher dose and 12 in 100 on the dummy tablet.' }, sections: {
      about: 'This is a summary of a research article about lumiravostat, a new tablet for hand eczema. Hand eczema makes the skin on the hands red, dry and itchy. In these people, creams had not cleared it.',
      did: 'The researchers asked 324 adults with hand eczema in Canada, Germany, India and the United States to take part. By chance, each person got lumiravostat 25 mg, lumiravostat 10 mg or a dummy tablet with no medicine in it, for 16 weeks. Nobody knew who got which tablet.',
      found: 'After 16 weeks, the skin on the hands was clear or almost clear in about 38 in 100 people on 25 mg, 28 in 100 people on 10 mg and 12 in 100 people on the dummy tablet. About 63 in 100 people on 25 mg, 57 in 100 on 10 mg and 53 in 100 on the dummy tablet had a side effect or other health problem. The most common were colds and headache. About 3 in 100 people on lumiravostat had a change in a liver blood test. It got better after they stopped the tablets.',
      mean: 'Lumiravostat helped more people than the dummy tablet. This was one study, and it lasted 16 weeks. Longer studies are needed to know if it keeps working and stays safe.',
      who: 'Halcyon Ridge Pharmaceuticals paid for the study. Three of the writers work for the company.',
      more: 'Varga L and others, Journal of Fictional Dermatology, 2027, doi:10.0000/jfd.2027.0001.' } }
    expect(plsChecks(p.pls).filter((c) => !c.ok).map((c) => `${c.id} ${c.why}`)).toEqual([])
    expect(grade(p).score).toBe(100)
  })
})

describe('language-access plan', () => {
  test('site targets come from the enrolment plan; the planning rule gives each site its languages and formats', () => {
    const p = startMission('PL18'), t = siteTargets(p)
    expect(Object.keys(t)).toHaveLength(6); expect(t['Site 101 Boston']).toBe(41)
    const r = requiredPlan(p)
    expect(r['Site 101 Boston'].languages).toEqual(['en', 'es']); expect(r['Site 101 Boston'].others).toBe('short-form')
    expect(r['Site 302 Mumbai'].languages).toEqual(['en', 'gu', 'hi', 'mr'])
    expect(r['Site 401 Toronto'].languages).toEqual(['en', 'fr']); expect(r['Site 201 Hamburg'].languages).toEqual(['de', 'tr'])
    expect(r['Site 301 Pune']).toMatchObject({ easyRead: true, audio: true, witness: true, largePrint: false })
    p.enrolment = { countryPct: { 'United States': 70, Germany: 10, India: 10, Canada: 10 } }
    expect(requiredPlan(p)['Site 101 Boston'].languages).toEqual(['en', 'es', 'pt']) // 4% of 113 is 5 people
    expect(grade(startMission('PL18')).passed).toBe(false)
    const q = startMission('PL18'); q.access = requiredPlan(q); expect(planIssues(q, q.access)).toEqual([]); expect(grade(q).score).toBe(100)
  })
})

describe('GLV-12-301 lay summary', () => {
  test('PL19: the gaps fail; a written summary with the HbA1c changes passes', () => {
    const p = startMission('PL19'); expect(grade(p).passed).toBe(false)
    expect(p.lay.results?.study).toBe('GLV-12-301')
    p.lay.edits = { ...p.lay.edits,
      sponsor: 'Glyvant Pharmaceuticals (fictional), 40 Canal Street, Boston, MA, United States. Contact: trials@example.org.',
      general: 'The main aim was to find out if GLV-12 lowers average blood sugar more than placebo after 26 weeks, in adults with type 2 diabetes whose blood sugar stayed high on metformin. The trial took place at hospitals in several countries in 2026 and 2027.',
      results: 'HbA1c is a blood test that shows your average blood sugar over the last 2 to 3 months. After 26 weeks, it fell by about 0.1 points on placebo, 0.7 points on GLV-12 5 mg and 0.8 points on GLV-12 10 mg. So both doses lowered blood sugar more than placebo. We can be fairly sure the extra fall was between about 0.5 and 0.8 points.',
      reactions: 'About 85 in 100 people on placebo, 63 in 100 on 5 mg and 81 in 100 on 10 mg had at least one health problem during the trial. The doctors thought most were not caused by the medicine.',
      comments: 'The sponsor thinks the results are useful. The results of one trial alone do not answer every question about a medicine.',
      followup: 'Longer trials are planned.', more: 'ClinicalTrials.gov and the EU clinical trials database, searching for the numbers in section 1.' }
    const g = grade(p); expect(fails(g.detail)).toEqual([])
    void laySections
  })
})

import { readFileSync as _read } from 'node:fs'
import { readResultsFile } from '../src/domain/csrresults'
describe('lay results from the CSR & Narrative Studio', () => {
  test('the Studio’s lay results file reads like the ARS file it carries', () => {
    const text = _read(new URL('./fixtures/csr-lay-results-hrp-301.json', import.meta.url), 'utf8')
    const r = readResultsFile(text, 'csr-lay.json')
    expect(r.fromCsr).toBe(true)
    expect(r.source).toMatch(/^CSR & Narrative Studio: HRP-301 clinical study report, version 1, not yet approved/)
    expect(r.results.study).toBe('HRP-301')
    expect(r.results.primary?.diffs.find((x) => x.group === 'Lumiravostat 25 mg')?.est).toBeCloseTo(11.25, 1)
    expect(r.results.ae?.top.length).toBe(5)
    expect(() => readResultsFile('{"format":"csr-studio/lay-results","schema":2}', 'x.json')).toThrow(/newer/)
  })
})
