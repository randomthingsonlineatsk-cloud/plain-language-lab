// Language-access and format plan: which consent languages and formats each site needs, from the
// enrolment plan (participants per country, from the Protocol Builder) and each site's expected
// languages, reading and age profile (fictional site data). Consent must be in a language the
// participant understands (ICH E6(R3); 21 CFR 50.20; EU CTR Article 29(2); India's NDCT Rules
// 2019). In the US, the short form with an interpreter and a witness is allowed for an
// unexpected language (21 CFR 50.27(b)(2)); the app's planning rule asks for a full translation
// for any language expected in 5% or more of a site's participants, or 5 or more people.
// US diversity action plans (FDORA 2022) apply only once FDA finalises its guidance.
import type { Project } from './types'

export interface SiteProfile { site: string; country: string; languages: Record<string, number>; lowLiteracy: number; older: number }
export const LANG_NAMES: Record<string, string> = { en: 'English', es: 'Spanish', pt: 'Portuguese', de: 'German', tr: 'Turkish', mr: 'Marathi', hi: 'Hindi', gu: 'Gujarati', fr: 'French', pa: 'Punjabi', ta: 'Tamil', other: 'Other languages' }
/** Expected share of participants (%) by first language, low literacy and age 65+, per site. Fictional. */
export const SITE_PROFILES: SiteProfile[] = [
  { site: 'Site 101 Boston', country: 'United States', languages: { en: 78, es: 15, pt: 4, other: 3 }, lowLiteracy: 8, older: 18 },
  { site: 'Site 102 Denver', country: 'United States', languages: { en: 76, es: 21, other: 3 }, lowLiteracy: 11, older: 12 },
  { site: 'Site 201 Hamburg', country: 'Germany', languages: { de: 84, tr: 9, en: 4, other: 3 }, lowLiteracy: 6, older: 22 },
  { site: 'Site 301 Pune', country: 'India', languages: { mr: 58, hi: 27, en: 12, other: 3 }, lowLiteracy: 18, older: 9 },
  { site: 'Site 302 Mumbai', country: 'India', languages: { mr: 38, hi: 34, gu: 14, en: 11, other: 3 }, lowLiteracy: 12, older: 11 },
  { site: 'Site 401 Toronto', country: 'Canada', languages: { en: 82, fr: 8, pa: 4, ta: 3, other: 3 }, lowLiteracy: 7, older: 20 },
]
export const SHARE_MIN = 5, PEOPLE_MIN = 5

export interface SitePlan { languages: string[]; others: 'short-form' | 'interpreter' | ''; largePrint: boolean; easyRead: boolean; audio: boolean; witness: boolean }
export type AccessPlan = Record<string, SitePlan>

/** Participants expected at each site: the country target from the enrolment plan, shared evenly by its sites. */
export function siteTargets(p: Project): Record<string, number> {
  const cs = [...new Set(SITE_PROFILES.map((s) => s.country))].filter((c) => p.facts.countries.some((x) => x.replace(/^the /i, '') === c))
  const w = p.enrolment?.countryPct ?? {}, even = cs.length ? 100 / cs.length : 0, tot = cs.reduce((n, c) => n + (w[c] ?? even), 0) || 1
  const out: Record<string, number> = {}
  for (const c of cs) { const sites = SITE_PROFILES.filter((s) => s.country === c), n = (p.facts.participants * (w[c] ?? even)) / tot; for (const s of sites) out[s.site] = Math.round(n / sites.length) }
  return out
}

/** What the planning rule asks for at each site. */
export function requiredPlan(p: Project): AccessPlan {
  const t = siteTargets(p), out: AccessPlan = {}
  for (const s of SITE_PROFILES) {
    if (!(s.site in t)) continue
    const n = t[s.site]
    const languages = Object.entries(s.languages).filter(([l, pct]) => l !== 'other' && (pct >= SHARE_MIN || Math.round((n * pct) / 100) >= PEOPLE_MIN)).map(([l]) => l).sort()
    out[s.site] = { languages, others: s.country === 'United States' ? 'short-form' : 'interpreter', largePrint: s.older >= 15, easyRead: s.lowLiteracy >= 10, audio: s.lowLiteracy >= 15, witness: s.country === 'India' || s.lowLiteracy >= 10 }
  }
  return out
}

export interface AccessIssue { site: string; text: string }
export function planIssues(p: Project, plan: AccessPlan): AccessIssue[] {
  const need = requiredPlan(p), out: AccessIssue[] = []
  for (const [site, r] of Object.entries(need)) {
    const mine = plan[site] ?? { languages: [], others: '', largePrint: false, easyRead: false, audio: false, witness: false }
    const missing = r.languages.filter((l) => !mine.languages.includes(l)), extra = mine.languages.filter((l) => !r.languages.includes(l))
    if (missing.length) out.push({ site, text: `Translate the consent into ${missing.map((l) => LANG_NAMES[l]).join(', ')}: expected in ${SHARE_MIN}% or more of participants, or ${PEOPLE_MIN} or more people.` })
    if (extra.length) out.push({ site, text: `${extra.map((l) => LANG_NAMES[l]).join(', ')} is below the planning threshold here: plan for it with ${r.others === 'short-form' ? 'the short form and an interpreter' : 'an interpreter and an impartial witness'} instead (a translation can follow if people enrol).` })
    if (mine.others !== r.others) out.push({ site, text: r.others === 'short-form' ? 'For other languages in the US: the short form, an interpreter and a witness (21 CFR 50.27(b)(2)).' : 'For other languages here: a qualified interpreter and an impartial witness, then a translation if people enrol.' })
    for (const [k, label] of [['largePrint', 'large print (15% or more aged 65 or over)'], ['easyRead', 'an Easy Read version (10% or more with low literacy)'], ['audio', 'an audio version (15% or more with low literacy)'], ['witness', 'an impartial witness for people who cannot read (India; or 10% or more with low literacy)']] as const)
      if (mine[k] !== r[k]) out.push({ site, text: r[k] ? `Add ${label}.` : `Not needed by the planning rule: ${label}.` })
  }
  return out
}
