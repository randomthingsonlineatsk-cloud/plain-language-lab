// The mission bar above a mission project: the brief, the steps, mission-specific answers, submit
// and the graded lines.
import { useStore } from '../state'
import { missionById, grade, PL5_CASES, PL5_CHECKLIST, PL9_ITEMS } from '../domain/missions'
import { numberChecks } from '../domain/risk'
import { PASSAGES } from '../domain/drills'
import { Btn, Panel, Pill, Select } from './ui'
import { DrillCard } from './Drills'
import { useNav } from '../nav'

export default function MissionBar() {
  const { p, act, record } = useStore()
  const nav = useNav()
  const r = p?.mission
  if (!p || !r) return null
  const m = missionById(r.id), g = grade(p)
  const submit = () => { act((x) => { const gg = grade(x); x.mission!.submittedUtc = new Date().toISOString(); x.mission!.score = gg.score; x.mission!.detail = gg.detail }); record((pr) => { const best = pr.missions[r.id]?.score ?? 0; if (g.score >= best) pr.missions[r.id] = { score: g.score, utc: new Date().toISOString() } }) }
  return (
    <Panel className="mb-4 border-lab-ema/60" title={`Mission ${m.id}: ${m.title}`} sub={`Pass ${m.pass} · expert ${m.expert}`} right={r.submittedUtc ? <Pill tone={g.expert ? 'green' : g.passed ? 'blue' : 'red'}>{`${r.score} · ${g.expert ? 'expert' : g.passed ? 'passed' : 'not yet'}`}</Pill> : <Btn onClick={submit}>Submit</Btn>}>
      <p className="text-sm">{m.brief}</p>
      <ol className="list-decimal pl-5 text-sm space-y-0.5">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {(m.kind === 'consent' || m.kind === 'key') && <Btn tone="grey" onClick={() => nav.go('documents')}>Open the consent form</Btn>}
      {m.kind === 'assent' && <Btn tone="grey" onClick={() => nav.go('documents', 'assent-7-11')}>Open the assent forms</Btn>}
      {m.kind === 'leaflet' && <Btn tone="grey" onClick={() => nav.go('leaflet')}>Open the leaflet</Btn>}
      {m.kind === 'usertest' && <span className="flex gap-2"><Btn tone="grey" onClick={() => nav.go('usertest')}>Open the user test</Btn><Btn tone="grey" onClick={() => nav.go('leaflet')}>Open the leaflet</Btn></span>}
      {m.kind === 'translation' && <Btn tone="grey" onClick={() => nav.go('translations')}>Open the Hindi translation</Btn>}
      {m.kind === 'amendment' && <span className="flex gap-2"><Btn tone="grey" onClick={() => nav.go('versions')}>Open Versions and ethics</Btn><Btn tone="grey" onClick={() => nav.go('documents')}>Open the consent form</Btn></span>}
      {m.kind === 'econsent' && <Btn tone="grey" onClick={() => nav.go('econsent')}>Open eConsent</Btn>}
      {m.kind === 'lay' && <Btn tone="grey" onClick={() => nav.go('lay')}>Open the lay summary</Btn>}
      {m.kind === 'numbers' && <div className="space-y-2">{PL9_ITEMS.map((it) => { const v = r.answers[`num:${it.id}`] ?? '', iss = v ? numberChecks(v) : []; return <div key={it.id} className="rounded border border-lab-line/60 p-2 text-sm"><p><b>{it.id}.</b> <span className="text-lab-text-muted">{it.source}</span></p><p className="text-xs text-lab-text-muted">Hint: {it.hint}</p>
        <textarea aria-label={`Rewrite of ${it.id}`} className="w-full min-h-14 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm mt-1" value={v} onChange={(e) => act((y) => { y.mission!.answers[`num:${it.id}`] = e.target.value })} />
        {v && <p className="text-xs">{iss.length ? iss.map((n) => <span key={n.id} className="text-lab-amber mr-2">{n.rule}: {n.fix}</span>) : <span className="text-lab-cdsco">Number checks clear.</span>} {it.keep.map((k) => <span key={k.label} className={`mr-2 ${k.re.test(v) ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{k.re.test(v) ? '✓' : '✗'} {k.label}</span>)}</p>}</div> })}</div>}
      {m.kind === 'drills' && <div className="space-y-3">{PASSAGES.slice(0, 5).map((x) => <DrillCard key={x.id} p={x} value={r.answers[`drill:${x.id}`] ?? ''} onChange={(v) => act((y) => { y.mission!.answers[`drill:${x.id}`] = v })} />)}</div>}
      {m.kind === 'india' && <div className="space-y-3">
        {PL5_CASES.map((c) => <div key={c.id} className="rounded border border-lab-line/60 p-2 text-sm"><p><b>Case {c.id}.</b> {c.text}</p>
          <Select aria-label={`Recording for case ${c.id}`} className="max-w-xs mt-1" value={r.answers[`rec:${c.id}`] ?? ''} onChange={(e) => act((y) => { y.mission!.answers[`rec:${c.id}`] = e.target.value })} options={[{ value: '', label: '(choose)' }, { value: 'audio-video', label: 'Audio and video' }, { value: 'audio', label: 'Audio only' }, { value: 'not required', label: 'Not required' }]} /></div>)}
        <fieldset className="space-y-1"><legend className="text-sm font-semibold">The site’s recording procedure must say:</legend>
          {PL5_CHECKLIST.map((x) => <label key={x.id} className="flex gap-2 text-sm"><input type="checkbox" checked={r.answers[`chk:${x.id}`] === 'yes'} onChange={(e) => act((y) => { y.mission!.answers[`chk:${x.id}`] = e.target.checked ? 'yes' : '' })} /><span>{x.text}{r.submittedUtc && <span className={`block text-xs ${x.right ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{x.right ? 'Belongs: ' : 'Does not belong: '}{x.why}</span>}</span></label>)}
        </fieldset></div>}
      <details open={!!r.submittedUtc} className="text-sm"><summary className="cursor-pointer text-lab-text-muted">Current score: {g.score}</summary>
        <ul className="text-xs mt-1 space-y-0.5">{g.detail.map((d) => <li key={d.label} className="flex justify-between gap-2"><span className={d.got < d.of ? 'text-lab-amber' : ''}>{d.label}</span><span className="font-mono">{d.got}/{d.of}</span></li>)}</ul></details>
      {r.submittedUtc && <Btn tone="grey" onClick={() => act((y) => { y.mission!.submittedUtc = undefined })}>Keep working and submit again</Btn>}
    </Panel>
  )
}
