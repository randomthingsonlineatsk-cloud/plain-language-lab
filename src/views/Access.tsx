// Language-access and format plan per site, from the enrolment plan and the site profiles.
import { useStore } from '../state'
import { SITE_PROFILES, LANG_NAMES, requiredPlan, planIssues, siteTargets, SHARE_MIN, PEOPLE_MIN, type SitePlan } from '../domain/access'
import { download } from '../domain/store'
import { Btn, Panel, Pill } from './ui'

const blank = (): SitePlan => ({ languages: [], others: '', largePrint: false, easyRead: false, audio: false, witness: false })
export default function Access() {
  const { p, act } = useStore()
  const t = siteTargets(p!), plan = p!.access ?? {}, issues = planIssues(p!, plan), mission = p!.mission?.id === 'PL18'
  const upd = (site: string, fn: (x: SitePlan) => void) => act((x) => { x.access ??= {}; x.access[site] ??= blank(); fn(x.access[site]) })
  const sites = SITE_PROFILES.filter((s) => s.site in t)
  const csv = () => ['Site,Expected participants,Translations,Other languages,Large print,Easy Read,Audio,Impartial witness', ...sites.map((s) => { const m = plan[s.site] ?? blank(); return [s.site, t[s.site], m.languages.map((l) => LANG_NAMES[l]).join('; '), m.others, m.largePrint, m.easyRead, m.audio, m.witness].join(',') })].join('\n')
  return (
    <div className="space-y-4">
      <Panel title="Language access and formats" sub={`Participants per site come from the enrolment plan${p!.enrolment?.countryPct ? ' in your Protocol Builder file' : ' (shared evenly by country, as the Protocol Builder does by default)'}; the language, reading and age profiles are fictional site data. Planning rule: a full translation for any language expected in ${SHARE_MIN}% or more of a site’s participants, or ${PEOPLE_MIN} or more people.`}
        right={<div className="flex gap-2">{!mission && <Btn tone="grey" onClick={() => act((x) => { x.access = requiredPlan(x) })}>Fill from the planning rule</Btn>}<Btn tone="grey" onClick={() => download('language-access-plan.csv', csv(), 'text/csv')}>Download (CSV)</Btn></div>}>
        <p className="text-xs text-lab-text-muted">Consent must be in a language the participant understands (ICH E6(R3); 21 CFR 50.20; EU CTR Article 29(2); India’s NDCT Rules). In the US, an unexpected language can use the short form with an interpreter and a witness (21 CFR 50.27(b)(2)).</p>
      </Panel>
      <div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-2 gap-4">{sites.map((s) => { const m = plan[s.site] ?? blank(), mine = issues.filter((i) => i.site === s.site)
        return <Panel key={s.site} title={`${s.site} · ${s.country}`} sub={`About ${t[s.site]} participants expected · low literacy ${s.lowLiteracy}% · aged 65 or over ${s.older}%`} right={!mission && (mine.length ? <Pill tone="amber">{`${mine.length} to fix`}</Pill> : <Pill tone="green">matches the rule</Pill>)}>
          <table className="text-xs w-full"><thead><tr className="text-left text-lab-text-muted"><th>Language</th><th className="text-right">Share</th><th className="text-right">People</th><th className="text-right">Consent form</th></tr></thead>
            <tbody>{Object.entries(s.languages).map(([l, pct]) => <tr key={l} className="border-t border-lab-line/60"><td>{LANG_NAMES[l]}</td><td className="text-right">{pct}%</td><td className="text-right">{Math.round((t[s.site] * pct) / 100)}</td>
              <td className="text-right">{l === 'other' ? '—' : <input type="checkbox" aria-label={`Consent form in ${LANG_NAMES[l]} at ${s.site}`} checked={m.languages.includes(l)} onChange={(e) => upd(s.site, (x) => { x.languages = e.target.checked ? [...x.languages, l] : x.languages.filter((y) => y !== l) })} />}</td></tr>)}</tbody></table>
          <fieldset className="text-xs space-y-1"><legend className="text-lab-text-muted">Other languages</legend>
            {([['short-form', 'Short form, interpreter and witness (US)'], ['interpreter', 'Qualified interpreter and impartial witness; translate if people enrol']] as const).map(([v, l]) => <label key={v} className="flex gap-2"><input type="radio" name={`others-${s.site}`} checked={m.others === v} onChange={() => upd(s.site, (x) => { x.others = v })} />{l}</label>)}</fieldset>
          <div className="flex flex-wrap gap-3 text-xs">{([['largePrint', 'Large print'], ['easyRead', 'Easy Read'], ['audio', 'Audio version'], ['witness', 'Impartial witness for people who cannot read']] as const).map(([k, l]) => <label key={k} className="flex gap-1"><input type="checkbox" checked={m[k]} onChange={(e) => upd(s.site, (x) => { x[k] = e.target.checked })} />{l}</label>)}</div>
          {!mission && mine.length > 0 && <ul className="text-xs text-lab-amber list-disc pl-4">{mine.map((i, k) => <li key={k}>{i.text}</li>)}</ul>}
        </Panel> })}</div>
    </div>
  )
}
