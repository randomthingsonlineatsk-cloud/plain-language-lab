// The document editor: the consent form and its variants, section by section, with the element
// checklist for each region and the readability of the whole document.
import { useState } from 'react'
import { useStore } from '../state'
import { sectionsOf, textOf, docChecks } from '../domain/project'
import { DOC_TYPES, type DocType } from '../domain/types'
import { REGION_NAMES, GAP, SITE, type Region } from '../shared/consent'
import { analyze } from '../domain/analyze'
import { Panel, Pill, Tabs } from './ui'
import { ReadabilityPanel } from './Readability'

export default function Documents({ initial = 'consent' as DocType }) {
  const { p, act } = useStore()
  const [type, setType] = useState<DocType>(initial)
  const secs = sectionsOf(p!, type), doc = p!.docs[type], target = p!.targets[type] ?? 8
  const isConsent = type === 'consent' || type === 'representative'
  const checks = isConsent ? docChecks(p!, type) : []
  const set = (id: string, v: string) => act((x) => { x.docs[type].edits[id] = v; x.docs[type].reviewed = x.docs[type].reviewed.filter((r) => r !== id) })
  const reset = (id: string) => act((x) => { delete x.docs[type].edits[id] })
  const toggleReviewed = (id: string) => act((x) => { const r = x.docs[type].reviewed; x.docs[type].reviewed = r.includes(id) ? r.filter((y) => y !== id) : [...r, id] })
  return (
    <div className="space-y-3">
      <Tabs tabs={DOC_TYPES.map((d) => ({ id: d.id, label: d.name }))} value={type} onChange={setType} />
      <div className="grid lg:grid-cols-[1fr_24rem] gap-4">
        <Panel title={DOC_TYPES.find((d) => d.id === type)!.name} sub={`Version ${doc.version} · drafted from the study, then edited. “Regenerate” returns a section to the drafted text. Marked gaps are for you; site details are for the site.`}>
          <div className="space-y-4">{secs.map((s) => {
            const a = analyze(s.text, target), edited = s.id in doc.edits, reviewed = doc.reviewed.includes(s.id)
            return (
              <div key={s.id}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <b>{s.heading}</b>
                  {s.text.includes(GAP) && <Pill tone="amber">to write</Pill>}
                  {s.text.includes(SITE) && <Pill>site completes</Pill>}
                  <Pill tone={edited ? 'blue' : 'grey'}>{edited ? 'edited' : 'drafted'}</Pill>
                  {reviewed && <Pill tone="green">reviewed</Pill>}
                  <span className={`text-[11px] font-mono ${a.grade <= target ? 'text-lab-cdsco' : 'text-lab-amber'}`}>grade {a.grade}</span>
                  <span className="ml-auto flex gap-2 text-[11px]">{edited && <button className="underline text-lab-text-muted" onClick={() => reset(s.id)}>regenerate</button>}<button className="underline text-lab-text-muted" onClick={() => toggleReviewed(s.id)}>{reviewed ? 'unmark' : 'mark reviewed'}</button></span>
                </div>
                <textarea aria-label={s.heading} className="w-full min-h-24 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm mt-1" value={s.text} onChange={(e) => set(s.id, e.target.value)} />
              </div>)
          })}</div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Readability of the whole document"><ReadabilityPanel text={textOf(secs)} target={target} compact /></Panel>
          {isConsent ? <Checklist checks={checks} regions={p!.regions} /> : <Panel title="Assent checks" sub="Assent has no fixed element list; these are the points ethics committees look for."><AssentChecks text={textOf(secs)} young={type === 'assent-7-11'} target={target} /></Panel>}
        </div>
      </div>
    </div>
  )
}

function Checklist({ checks, regions }: { checks: ReturnType<typeof docChecks>; regions: Region[] }) {
  return <>{regions.map((r) => { const cs = checks.filter((c) => c.el.region === r), ok = cs.filter((c) => c.ok).length
    return (
      <Panel key={r} title={REGION_NAMES[r]} right={<Pill tone={ok === cs.length ? 'green' : 'amber'}>{`${ok}/${cs.length}`}</Pill>}>
        <ul className="text-xs space-y-1">{cs.map((c) => <li key={c.el.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} <span className="font-mono text-lab-text-muted">{c.el.cite}</span> {c.el.label}{!c.ok && <i className="block pl-4 text-lab-text-muted">{c.why}</i>}</li>)}</ul>
        {r === 'KEY' && <p className="text-[11px] text-lab-text-muted">US: proposed for FDA-regulated trials (2022 proposed rule, 2024 draft guidance); required under the Common Rule for federally funded research. Not counted in the US checklist.</p>}
      </Panel>)
  })}</>
}

export function assentPoints(text: string, young: boolean, target: number) {
  const g = analyze(text, target).grade
  return [
    { label: `Reading level grade ${target} or below (now ${g})`, ok: g <= target },
    { label: 'Says the child can say no', ok: /say no|don.t have to|do not have to|your choice/i.test(text) },
    { label: young ? 'No adult-only words' : 'Can refuse even if a parent agrees', ok: young ? !/insurance|compensat|regulat|legally|contingent|investigational/i.test(text) : /even if|your choice/i.test(text) },
    { label: 'Says what will happen (visits, medicine, blood)', ok: /visit|come to see/i.test(text) && /medicine/i.test(text) },
    { label: 'Invites questions', ok: /question|ask/i.test(text) },
    { label: young ? 'Records the child’s answer' : 'A place for the young person to sign', ok: young ? /yes \/ no|said yes/i.test(text) : /your name|signature/i.test(text) },
  ]
}
function AssentChecks({ text, young, target }: { text: string; young: boolean; target: number }) {
  return <ul className="text-xs space-y-1">{assentPoints(text, young, target).map((x) => <li key={x.label} className={x.ok ? '' : 'text-lab-amber'}>{x.ok ? '✓' : '✗'} {x.label}</li>)}</ul>
}
