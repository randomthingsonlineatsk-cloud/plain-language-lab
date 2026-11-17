import { describe, expect, test } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { exampleProject, laySections, readFile, projectFile } from '../src/domain/project'
import { startMission, grade, PL9_ITEMS } from '../src/domain/missions'
import { LEAFLET_EXAMPLES, sectionsWith, reviewLeaflet, readLeafletFile, KEY_MESSAGES } from '../src/domain/leaflet'
import { runRound, verdict, EU_QUESTIONS, textHash } from '../src/domain/usertest'
import { layChecks, readReportingEvent } from '../src/shared/laysummary'
import RES from '../src/domain/results.json'

describe('shared lay summary module', () => {
  test('matches the Protocol Builder copy', () => {
    if (!existsSync('../protocol-builder/src/shared/laysummary.ts')) return
    expect(readFileSync('src/shared/laysummary.ts', 'utf8')).toBe(readFileSync('../protocol-builder/src/shared/laysummary.ts', 'utf8'))
  })
  test('reads both studies’ results and drafts the results in plain numbers', () => {
    const r = readReportingEvent((RES as any)['HRP-301'])
    expect(r.groups).toEqual(['Placebo', 'Lumiravostat 10 mg', 'Lumiravostat 25 mg'])
    expect(r.primary!.kind).toBe('binary'); expect(r.primary!.values[0].n).toBe(15)
    const g = readReportingEvent((RES as any)['GLV-12-301']); expect(g.primary!.kind).toBe('continuous')
    const s = laySections(exampleProject('HRP-301'))
    expect(s.find((x) => x.id === 'results')!.text).toMatch(/about 20 in 100[\s\S]*could be due to chance/)
    expect(layChecks(s).find((c) => c.id === 'PL-L10')!.ok).toBe(true)
    expect(() => readReportingEvent({} as any)).toThrow()
  })
})

describe('leaflet and user test', () => {
  const f = LEAFLET_EXAMPLES['ostrevia-pl-eu']
  test('the clean leaflet keeps every key message and has no number problems', () => {
    const r = reviewLeaflet(f, sectionsWith(f, {}))
    expect(r.messages.filter((m) => !m.ok).map((m) => m.m.id)).toEqual([])
    expect(r.numbers).toEqual([]); expect(r.grade).toBeLessThanOrEqual(8)
    const us = LEAFLET_EXAMPLES['ostrevia-mg-us']; expect(reviewLeaflet(us, sectionsWith(us, {})).messages.filter((m) => !m.ok).map((m) => m.m.id)).toEqual([])
  })
  test('user test: deterministic, needs two rounds on the same text, the clean leaflet usually passes', () => {
    const secs = sectionsWith(f, {})
    expect(runRound(secs, EU_QUESTIONS, 1).results).toEqual(runRound(secs, EU_QUESTIONS, 1).results)
    expect(verdict([runRound(secs, EU_QUESTIONS, 1)], EU_QUESTIONS, secs).ready).toBe(false)
    let pass = 0
    for (let k = 1; k < 20; k += 2) if (verdict([runRound(secs, EU_QUESTIONS, k), runRound(secs, EU_QUESTIONS, k + 1)], EU_QUESTIONS, secs).pass) pass++
    expect(pass).toBeGreaterThanOrEqual(7)
    const changed = sectionsWith(f, { pl3: 'Take one tablet a day.' }); expect(textHash(changed)).not.toBe(textHash(secs))
  })
  test('a leaflet file from the Labelling Workbench imports; other files are refused', () => {
    expect(readLeafletFile(JSON.stringify(f)).sections.length).toBe(f.sections.length)
    expect(() => readLeafletFile('{"kind":"labelling-workbench/project"}')).toThrow(/leaflet/)
    expect(KEY_MESSAGES.eu.length).toBeGreaterThan(10)
  })
  test('project file keeps leaflet edits and the lay summary', () => {
    const p = exampleProject('HRP-301'); p.leaflet!.edits.pl3 = 'Take one tablet a day.'; p.lay.edits.comments = 'X'
    const q = readFile(projectFile(p)); expect(q.leaflet!.edits.pl3).toBe('Take one tablet a day.'); expect(q.lay.edits.comments).toBe('X')
    expect(exampleProject('GLV-12-301').leaflet).toBeNull()
  })
})

describe('missions PL6 to PL9', () => {
  test('PL6: the SmPC-language leaflet fails, the clean leaflet passes', () => {
    const p = startMission('PL6'); expect(grade(p).passed).toBe(false)
    p.leaflet!.edits = {}; const g = grade(p); expect(g.detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
  })
  test('PL7: full questions, revision, two passing rounds', () => {
    const p = startMission('PL7'); expect(grade(p).passed).toBe(false)
    const L = p.leaflet!, hard = sectionsWith(L.file, L.edits)
    L.rounds.push({ ...runRound(hard, EU_QUESTIONS, 0, true) }, runRound(hard, EU_QUESTIONS.slice(0, 7), 1))
    L.edits = {}; L.questions = EU_QUESTIONS
    const secs = sectionsWith(L.file, {})
    let k = 2; while (k < 40) { const r = [runRound(secs, L.questions, k), runRound(secs, L.questions, k + 1)]; if (verdict(r, L.questions, secs).pass) { L.rounds.push(...r); break } k += 2 }
    expect(grade(p).detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
  })
  test('PL8: empty results fail; the drafted results pass after the gaps are filled', () => {
    const p = startMission('PL8'); expect(grade(p).passed).toBe(false)
    p.lay.edits = {
      sponsor: 'Halcyon Ridge Pharmaceuticals (fictional), 1 Harbour Row, Dublin, Ireland. Contact: trials@example.org.',
      general: 'The main aim was to find out if lumiravostat clears hand eczema better than placebo. The trial took place in Canada, Germany, India and the United States from March 2026 to February 2027.',
      reactions: 'About 53 in 100 people on placebo, 57 in 100 on the 10 mg dose and 63 in 100 on the 25 mg dose had at least one health problem. The most common were head pain and colds. The doctors thought most were not caused by the medicine. No one had a serious side effect.',
      comments: 'The sponsor thinks the results are promising but small. The results of one trial alone do not answer every question about a medicine.',
      followup: 'A longer trial is planned.',
      more: 'ClinicalTrials.gov and the EU clinical trials database, searching for the numbers in section 1.',
    }
    const g = grade(p); expect(g.detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
  })
  test('PL9: honest rewrites score 100', () => {
    const p = startMission('PL9')
    p.mission!.answers = { 'num:N1': 'A serious flare happened to about 8 in 100 people on placebo and 4 in 100 people on lumiravostat.', 'num:N2': 'Shingles was uncommon: it affected about 6 in 1,000 people.', 'num:N3': 'Treatment worked for about 38 in 100 people on the medicine and 12 in 100 on placebo: 26 more in every 100.', 'num:N4': 'The difference is unlikely to be due to chance, but one trial alone cannot show for certain that the medicine works.', 'num:N5': 'A cold affected about 12 in 100 people, and acne fewer than 1 in 100.' }
    expect(grade(p).detail.filter((d) => d.got < d.of).map((d) => d.label)).toEqual([])
    expect(PL9_ITEMS.length).toBe(5)
  })
})
