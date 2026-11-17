// Versions, ethics committee submissions and approvals, site use, flags, the amendment from the
// Protocol Builder, and the consent-version file for the CDM Console.
import { useState } from 'react'
import { useStore } from '../state'
import { DOC_TYPES, type DocType } from '../domain/types'
import { issueVersion, submit, approve, versionFlags, cdmConsentFile } from '../domain/versions'
import { sectionsOf } from '../domain/project'
import { reconsentDecision, consentSections, wordDiff, type DocSection } from '../shared/consent'
import { download } from '../domain/store'
import { Btn, Panel, Pill, Select, inputCls } from './ui'

const today = () => new Date().toISOString().slice(0, 10)
function Diff({ a, b }: { a: DocSection[]; b: DocSection[] }) {
  const ch = b.map((s) => ({ s, o: a.find((x) => x.id === s.id) })).filter(({ s, o }) => (o?.text ?? '') !== s.text)
  if (!ch.length) return <p className="text-xs text-lab-text-muted">No changes.</p>
  return <div className="space-y-2">{ch.map(({ s, o }) => <div key={s.id} className="text-xs"><b>{s.heading}</b><p>{wordDiff(o?.text ?? '', s.text).map((g, i) => <span key={i} className={g.t === '+' ? 'bg-lab-cdsco/25' : g.t === '-' ? 'line-through text-lab-red' : ''}>{g.s}</span>)}</p></div>)}</div>
}

function Amendment() {
  const { p, act } = useStore()
  const am = p!.amendment
  if (!am) return null
  const r = reconsentDecision(consentSections(am.prevFacts), consentSections(p!.facts), am.safetyRights)
  return (
    <Panel title={`Protocol amendment (version ${am.number})`} sub={am.reason || 'From the Protocol Builder.'} right={am.decision ? <Pill tone={am.decision === r.needed ? 'green' : 'amber'}>{`Your decision: ${am.decision}`}</Pill> : undefined}>
      <p className="text-sm">The consent form drafted from the previous protocol and from the amended one, compared. What do current participants need?</p>
      <div className="flex flex-wrap gap-2">{(['Re-consent', 'Inform', 'None'] as const).map((d) => <Btn key={d} tone={am.decision === d ? 'solid' : 'grey'} onClick={() => act((x) => { x.amendment!.decision = d })}>{d === 'Re-consent' ? 'Re-consent current participants' : d === 'Inform' ? 'Inform them at the next visit' : 'No action'}</Btn>)}</div>
      {am.decision && <div className="text-sm rounded border border-lab-line/60 p-2"><p><b>The rule says: {r.needed}.</b> {r.reason}</p>{r.steps.length > 0 && <ol className="list-decimal pl-5 text-xs mt-1 space-y-0.5">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>}</div>}
      <details className="text-sm"><summary className="cursor-pointer text-lab-text-muted">What changes in the drafted consent form ({r.changes.length} section{r.changes.length === 1 ? '' : 's'})</summary><Diff a={consentSections(am.prevFacts)} b={consentSections(p!.facts)} /></details>
    </Panel>
  )
}

export default function Versions() {
  const { p, act } = useStore()
  const V = p!.versions
  const [type, setType] = useState<DocType>('consent')
  const [summary, setSummary] = useState('')
  const [cmp, setCmp] = useState<string>('')
  const [sub, setSub] = useState({ committee: V.committees[0]?.id ?? '', version: '', date: today() })
  const [app, setApp] = useState({ committee: V.committees[0]?.id ?? '', version: '', date: today(), decision: 'approved' as const })
  const [use, setUse] = useState({ site: V.committees[0]?.sites[0] ?? '', version: '', from: today() })
  const hist = V.history[type], flags = versionFlags(p!)
  const issuedOpts = [{ value: '', label: '(version)' }, ...hist.map((h) => ({ value: h.version, label: `version ${h.version} (${h.date})` }))]
  const comOpts = V.committees.map((c) => ({ value: c.id, label: c.name }))
  const cmpRec = hist.find((h) => h.version === cmp)
  return (
    <div className="space-y-4">
      <Amendment />
      {flags.length > 0 && <Panel title="Flags" className="border-lab-amber/60"><ul className="text-sm space-y-1">{flags.map((f) => <li key={f.id}><span className="text-lab-amber">⚑</span> {f.text} <i className="text-lab-text-muted">{f.fix}</i></li>)}</ul></Panel>}
      <div className="flex flex-wrap gap-2 items-center"><span className="text-sm">Document:</span><Select aria-label="Document" className="max-w-xs" value={type} onChange={(e) => setType(e.target.value as DocType)} options={DOC_TYPES.map((d) => ({ value: d.id, label: d.name }))} /></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Versions" sub={`The draft you are editing is version ${p!.docs[type].version}. Issuing it freezes the text and starts the next version.`}>
          <table className="text-sm w-full"><tbody>{hist.map((h) => <tr key={h.version} className="border-t border-lab-line/60"><td className="py-1 font-mono">{h.version}</td><td>{h.date}</td><td className="text-xs">{h.summary}</td></tr>)}<tr className="border-t border-lab-line/60"><td className="py-1 font-mono">{p!.docs[type].version}</td><td colSpan={2}><Pill tone="blue">draft</Pill></td></tr></tbody></table>
          <label className="text-xs block">What changed in this version<input className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="For example: amendment 1, hair thinning added to the risks" /></label>
          <Btn onClick={() => { if (act((x) => issueVersion(x, type, summary))) setSummary('') }}>{`Issue version ${p!.docs[type].version}`}</Btn>
          {hist.length > 0 && <div className="space-y-1"><label className="text-xs flex gap-2 items-center">Compare the draft with<Select aria-label="Compare with" className="max-w-[12rem]" value={cmp} onChange={(e) => setCmp(e.target.value)} options={issuedOpts} /></label>{cmpRec && <Diff a={cmpRec.sections} b={sectionsOf(p!, type)} />}</div>}
        </Panel>
        <Panel title="Ethics committees" sub="Submit issued versions, record each committee’s decision, and record which version each site uses from which date.">
          <table className="text-xs w-full"><thead><tr className="text-left text-lab-text-muted"><th>Committee</th><th>Submitted</th><th>Approved</th><th>Sites (version in use)</th></tr></thead>
            <tbody>{V.committees.map((c) => <tr key={c.id} className="border-t border-lab-line/60 align-top"><td className="py-1">{c.name}</td>
              <td>{V.submissions.filter((s) => s.committee === c.id).flatMap((s) => s.docs.filter((d) => d.type === type).map((d) => `${d.version}${d.language !== 'en' ? ` ${d.language}` : ''} (${s.date})`)).join(', ') || '—'}</td>
              <td>{V.approvals.filter((a) => a.committee === c.id && a.type === type).map((a) => `${a.version}${a.language !== 'en' ? ` ${a.language}` : ''} ${a.decision === 'approved' ? '' : `(${a.decision})`} ${a.date}`).join(', ') || '—'}</td>
              <td>{c.sites.map((st) => { const u = V.uses.filter((x) => x.site === st && x.type === type).sort((a, b) => b.from.localeCompare(a.from))[0]; return <div key={st}>{st}: {u ? `${u.version} from ${u.from}` : '—'}</div> })}</td></tr>)}</tbody></table>
          <div className="grid sm:grid-cols-4 gap-1 items-end text-xs"><Select aria-label="Committee to submit to" value={sub.committee} onChange={(e) => setSub({ ...sub, committee: e.target.value })} options={comOpts} /><Select aria-label="Version to submit" value={sub.version} onChange={(e) => setSub({ ...sub, version: e.target.value })} options={issuedOpts} /><input type="date" aria-label="Submission date" className={inputCls} value={sub.date} onChange={(e) => setSub({ ...sub, date: e.target.value })} /><Btn tone="grey" disabled={!sub.version} onClick={() => act((x) => submit(x, sub.committee, [{ type, language: 'en', version: sub.version }, ...x.translations.filter((t) => t.docType === type && t.sourceVersion === sub.version && t.certificate).map((t) => ({ type, language: t.lang, version: sub.version }))], '', sub.date))}>Submit</Btn></div>
          <div className="grid sm:grid-cols-5 gap-1 items-end text-xs"><Select aria-label="Approving committee" value={app.committee} onChange={(e) => setApp({ ...app, committee: e.target.value })} options={comOpts} /><Select aria-label="Version approved" value={app.version} onChange={(e) => setApp({ ...app, version: e.target.value })} options={issuedOpts} /><input type="date" aria-label="Decision date" className={inputCls} value={app.date} onChange={(e) => setApp({ ...app, date: e.target.value })} /><Select aria-label="Decision" value={app.decision} onChange={(e) => setApp({ ...app, decision: e.target.value as typeof app.decision })} options={[{ value: 'approved', label: 'approved' }, { value: 'approved with conditions', label: 'approved with conditions' }, { value: 'not approved', label: 'not approved' }]} /><Btn tone="grey" disabled={!app.version} onClick={() => act((x) => approve(x, { committee: app.committee, type, language: 'en', version: app.version, date: app.date, decision: app.decision }))}>Record</Btn></div>
          <div className="grid sm:grid-cols-4 gap-1 items-end text-xs"><Select aria-label="Site" value={use.site} onChange={(e) => setUse({ ...use, site: e.target.value })} options={V.committees.flatMap((c) => c.sites).map((s) => ({ value: s, label: s }))} /><Select aria-label="Version used" value={use.version} onChange={(e) => setUse({ ...use, version: e.target.value })} options={issuedOpts} /><input type="date" aria-label="In use from" className={inputCls} value={use.from} onChange={(e) => setUse({ ...use, from: e.target.value })} /><Btn tone="grey" disabled={!use.version} onClick={() => act((x) => { x.versions.uses.push({ site: use.site, type, language: 'en', version: use.version, from: use.from }) })}>Site uses it</Btn></div>
          <p className="text-xs text-lab-text-muted">“Submit” also sends the certified translations made from that version.</p>
          <Btn tone="grey" onClick={() => download(`${(p!.facts.protocolId || 'study').replace(/\W+/g, '_')}_consent-versions.json`, JSON.stringify(cdmConsentFile(p!), null, 2))}>Download the consent versions for the CDM Console</Btn>
        </Panel>
      </div>
    </div>
  )
}
