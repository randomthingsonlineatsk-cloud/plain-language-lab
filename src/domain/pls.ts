// Plain-language summary of a journal publication: separate from the regulatory lay summary,
// written by medical-communications teams to sit with the article. It follows common
// recommendations for publication summaries: a plain title, what the study asked and did, the
// results in numbers people use, what they mean and their limits, who funded and wrote it, and
// where to find the article; a short graphical abstract of three panels. Fictional article.
import { analyze } from './analyze'
import { unexplained } from './literacy'
import { numberChecks } from './risk'

export const PLS_SOURCE = {
  citation: 'Varga L, Okafor N, Deshmukh R, et al. Lumiravostat for moderate-to-severe chronic hand eczema (VERDANT-1): a randomised, double-blind, placebo-controlled, phase 3 trial. J Fict Dermatol 2027; 14: 101–112. doi:10.0000/jfd.2027.0001 (fictional).',
  abstract: `Background: Chronic hand eczema (CHE) inadequately controlled with topical corticosteroids has few oral options. Lumiravostat is an oral, reversible STRK1 kinase inhibitor.
Methods: In this multicentre, double-blind, placebo-controlled phase 3 trial in Canada, Germany, India and the USA, adults with moderate-to-severe CHE were randomised 1:1:1 to lumiravostat 25 mg, lumiravostat 10 mg or placebo once daily for 16 weeks. The primary endpoint was IGA-CHE treatment success (score 0 or 1 with a ≥2-point improvement) at week 16.
Findings: 324 participants were randomised. IGA-CHE success at week 16 was achieved by 38.2% (25 mg), 27.5% (10 mg) and 11.9% (placebo); difference versus placebo 26.3 percentage points (95% CI 15.1–37.5; p<0.001) for 25 mg and 15.6 (95% CI 4.9–26.3; p=0.004) for 10 mg. Adverse events occurred in 63%, 57% and 53% respectively; the most common were nasopharyngitis and headache. ALT >3×ULN occurred in 3% of lumiravostat-treated participants and resolved after interruption. No deaths occurred.
Interpretation: Lumiravostat 25 mg was superior to placebo for CHE over 16 weeks with an acceptable safety profile; longer trials are needed.
Funding: Halcyon Ridge Pharmaceuticals (fictional). Three authors are employees of the sponsor.`,
}

/** An article opened from the Reporting Guideline Navigator replaces PLS_SOURCE for this draft. */
export interface PlsArticle { study: string; citation: string; abstract: string; funder: string; from: 'reporting-guideline-navigator' }
export interface PlsDraft { title: string; sections: Record<string, string>; panels: { question: string; did: string; found: string }; source?: PlsArticle }
export const RGN_SOURCE_FORMAT = 'reporting-guideline-navigator/pls-source'
export const PUBLICATION_SUMMARY_FORMAT = 'plain-language-lab/publication-summary'
export const articleOf = (d: PlsDraft) => d.source ?? { study: 'HRP-301', citation: PLS_SOURCE.citation, abstract: PLS_SOURCE.abstract, funder: 'Halcyon Ridge Pharmaceuticals', from: undefined }
/** Read the article file the Reporting Guideline Navigator gives for its plain language summary. */
export function readRgnSource(j: unknown): PlsArticle {
  const o = j as Record<string, unknown>
  if (!o || o.format !== RGN_SOURCE_FORMAT) throw new Error('This is not an article file from the Reporting Guideline Navigator (its Plain language summary page gives one).')
  for (const k of ['study', 'citation', 'abstract', 'funder']) if (typeof o[k] !== 'string' || !(o[k] as string).trim()) throw new Error(`The article file has no ${k}.`)
  return { study: o.study as string, citation: o.citation as string, abstract: o.abstract as string, funder: o.funder as string, from: 'reporting-guideline-navigator' }
}
export const PLS_SECTIONS = [
  { id: 'about', heading: 'What is this summary about?' },
  { id: 'did', heading: 'What did the researchers do?' },
  { id: 'found', heading: 'What did they find?' },
  { id: 'mean', heading: 'What do the results mean?' },
  { id: 'who', heading: 'Who paid for and wrote the study?' },
  { id: 'more', heading: 'Where can I read the full article?' },
]
export const blankPls = (): PlsDraft => ({ title: '', sections: Object.fromEntries(PLS_SECTIONS.map((s) => [s.id, ''])), panels: { question: '', did: '', found: '' } })
export const PLS_WORD_LIMIT = 300, PANEL_WORD_LIMIT = 25
const words = (s: string) => s.split(/\s+/).filter(Boolean).length
export const plsText = (d: PlsDraft) => [d.title, ...PLS_SECTIONS.map((s) => d.sections[s.id] ?? '')].join('\n')

export interface PlsCheck { id: string; label: string; ok: boolean; why: string }
export function plsChecks(d: PlsDraft): PlsCheck[] {
  const body = PLS_SECTIONS.map((s) => d.sections[s.id] ?? '').join('\n'), all = plsText(d), w = words(body), g = analyze(all).grade
  const nums = numberChecks(all), jar = unexplained(all), sec = (id: string) => d.sections[id] ?? ''
  const c = (id: string, label: string, ok: boolean, why = ''): PlsCheck => ({ id, label, ok, why })
  const panelLong = (['question', 'did', 'found'] as const).filter((k) => !d.panels[k].trim() || words(d.panels[k]) > PANEL_WORD_LIMIT)
  return [
    c('PLS1', 'A plain title (no abbreviations, 15 words or fewer)', !!d.title.trim() && words(d.title) <= 15 && !/\b[A-Z]{2,}\b|\d+\s?mg/.test(d.title), d.title ? '' : 'No title yet.'),
    c('PLS2', 'Every section written', PLS_SECTIONS.every((s) => sec(s.id).trim().length > 20), `Missing: ${PLS_SECTIONS.filter((s) => sec(s.id).trim().length <= 20).map((s) => s.heading).join('; ') || 'none'}.`),
    c('PLS3', `${PLS_WORD_LIMIT} words or fewer`, w > 0 && w <= PLS_WORD_LIMIT, `${w} words.`),
    c('PLS4', 'Grade 8 or below', g <= 8, `Grade ${g}.`),
    c('PLS5', 'Results in natural frequencies, no p-values or relative risks alone', /\d+\s+(in|out of)\s+(every\s+)?\d+/i.test(sec('found')) && !nums.some((n) => ['PL-N01', 'PL-N02', 'PL-N05'].includes(n.rule)), nums.map((n) => n.rule).join(', ')),
    c('PLS6', 'Side effects as well as benefits', /side effect|health problem|unwanted/i.test(sec('found')), ''),
    c('PLS7', 'States the limits (one study, 16 weeks, longer studies needed)', /\b(16 weeks|longer|one study|limit|not know|more research)\b/i.test(sec('mean')), ''),
    c('PLS8', 'Names the funder and says sponsor employees were authors', sec('who').toLowerCase().includes(articleOf(d).funder.split(/\s+/)[0].toLowerCase()) && /employ|work(ed)? for/i.test(sec('who')), ''),
    c('PLS9', 'Gives the article reference or DOI', /doi|10\.0000|J Fict|journal/i.test(sec('more')), ''),
    c('PLS10', 'No promotional words (breakthrough, miracle, cure, game-changer, superior)', !/breakthrough|miracle|\bcures?\b|game.?changer|superior|revolutionary/i.test(all), ''),
    c('PLS11', 'No unexplained medical words', !jar.length, jar.length ? `Unexplained: ${[...new Set(jar.map((j) => j.word))].slice(0, 5).join(', ')}.` : ''),
    c('PLS12', `Graphical abstract: three panels, each ${PANEL_WORD_LIMIT} words or fewer`, !panelLong.length, panelLong.length ? `Fix: ${panelLong.join(', ')}.` : ''),
  ]
}

/** The finished summary, for the Reporting Guideline Navigator's submission pack (mission RG16). */
export function publicationSummary(d: PlsDraft) {
  const a = articleOf(d), checks = plsChecks(d), body = PLS_SECTIONS.map((s) => d.sections[s.id] ?? '').join('\n')
  return {
    format: PUBLICATION_SUMMARY_FORMAT, schema: 1, exportedUtc: new Date().toISOString(), study: a.study, citation: a.citation, title: d.title,
    sections: Object.fromEntries(PLS_SECTIONS.map((s) => [s.heading, d.sections[s.id] ?? ''])), panels: { ...d.panels },
    checks: { total: checks.length, failed: checks.filter((c) => !c.ok).map((c) => c.id) }, words: words(body), grade: analyze(plsText(d)).grade,
  }
}
