// The lay summary of results (EU CTR Annex V), drafted from the study and the TLF Programming Lab's
// analysis results, with its checks, numbers and reading level.
import { useRef } from 'react'
import { useStore } from '../state'
import { laySections, textOf } from '../domain/project'
import { layChecks, readReportingEvent, GAP_TEXT, type LayResults } from '../domain/laytools'
import { numberChecks } from '../domain/risk'
import { analyze } from '../domain/analyze'
import { Btn, Panel, Pill } from './ui'
import { ReadabilityPanel } from './Readability'

function ResultsTable({ r }: { r: LayResults }) {
  const fmt = (x?: number) => (x === undefined || isNaN(x) ? '—' : String(Math.round(x * 10) / 10))
  return (
    <div className="space-y-2 text-xs">
      {[r.primary, r.secondary].filter(Boolean).map((e) => <div key={e!.name}><p className="font-semibold">{e!.name}</p>
        <table className="w-full"><thead><tr className="text-left text-lab-text-muted"><th>Group</th><th className="text-right">N</th>{e!.kind === 'binary' ? <><th className="text-right">Responders</th><th className="text-right">%</th></> : <th className="text-right">Mean change</th>}<th className="text-right">Difference (95% CI)</th></tr></thead>
          <tbody>{e!.values.map((v) => { const d = e!.diffs.find((x) => x.group === v.group); return <tr key={v.group} className="border-t border-lab-line/60"><td>{v.group}</td><td className="text-right">{v.n}</td>{e!.kind === 'binary' ? <><td className="text-right">{v.resp}</td><td className="text-right">{fmt(v.pct)}</td></> : <td className="text-right">{fmt(v.mean)}</td>}<td className="text-right">{d ? `${fmt(d.est)} (${fmt(d.lcl)} to ${fmt(d.ucl)})` : ''}</td></tr> })}</tbody></table></div>)}
      {r.ae && <div><p className="font-semibold">Adverse events (any; most common)</p><table className="w-full"><tbody>
        <tr className="border-t border-lab-line/60"><td>Any</td>{r.ae.any.map((a) => <td key={a.group} className="text-right">{fmt(a.pct)}%</td>)}</tr>
        {r.ae.top.map((t) => <tr key={t.term} className="border-t border-lab-line/60"><td>{t.term}</td>{r.groups.map((g) => <td key={g} className="text-right">{fmt(t.pct[g])}%</td>)}</tr>)}
        <tr className="text-lab-text-muted"><td /> {r.groups.map((g) => <td key={g} className="text-right">{g}</td>)}</tr></tbody></table></div>}
    </div>
  )
}

export default function Lay() {
  const { p, act, setError } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const secs = laySections(p!), checks = layChecks(secs), target = p!.targets['lay-summary'] ?? 8
  const numbers = numberChecks(secs.map((s) => s.text).join('\n'))
  return (
    <div className="grid lg:grid-cols-[1fr_26rem] gap-4">
      <Panel title="Summary of results for laypersons (EU CTR Annex V)" sub="Drafted from the study and its results; edit any section. Gaps to write are marked. “Regenerate” returns a section to the draft.">
        <div className="space-y-3">{secs.map((s) => { const edited = s.id in p!.lay.edits; return <div key={s.id}>
          <p className="text-sm flex flex-wrap items-center gap-2"><b>{s.heading}</b>{s.text.includes(GAP_TEXT) && <Pill tone="amber">to write</Pill>}<span className="text-[11px] font-mono text-lab-text-muted">grade {analyze(s.text).grade}</span>{edited && <button className="text-[11px] underline text-lab-text-muted" onClick={() => act((x) => { delete x.lay.edits[s.id] })}>regenerate</button>}</p>
          <textarea aria-label={s.heading} className="w-full min-h-24 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm mt-1" value={s.text} onChange={(e) => act((x) => { x.lay.edits[s.id] = e.target.value })} /></div> })}</div>
      </Panel>
      <div className="space-y-3">
        <Panel title="Results" sub={p!.lay.results ? `From: ${p!.lay.source || 'an analysis results file'}. Training data, not real results.` : 'No results yet. In the TLF Programming Lab, Submission page, download “Analysis results (ARS JSON)”, then open it here.'} right={<Btn tone="grey" onClick={() => file.current?.click()}>Open results…</Btn>}>
          <input ref={file} type="file" accept=".json" className="hidden" aria-label="Open an analysis results file" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const r = readReportingEvent(JSON.parse(await f.text())); act((x) => { x.lay.results = r; x.lay.source = f.name }) } catch (err) { setError((err as Error).message) } }} />
          {p!.lay.results && <ResultsTable r={p!.lay.results} />}
        </Panel>
        <Panel title="Annex V elements and tone" right={<Pill tone={checks.every((c) => c.ok) ? 'green' : 'amber'}>{`${checks.filter((c) => c.ok).length}/${checks.length}`}</Pill>}>
          <ul className="text-xs space-y-1">{checks.map((c) => <li key={c.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} <span className="font-mono text-lab-text-muted">{c.id}</span> {c.label}{!c.ok && c.why && <i className="block pl-4 text-lab-text-muted">{c.why}</i>}</li>)}</ul>
        </Panel>
        {numbers.length > 0 && <Panel title="Numbers"><ul className="text-xs space-y-1">{numbers.slice(0, 8).map((n) => <li key={n.id}><Pill tone="amber">{n.rule}</Pill> {n.fix}</li>)}</ul></Panel>}
        <Panel title="Readability"><ReadabilityPanel text={textOf(secs)} target={target} compact /></Panel>
      </div>
    </div>
  )
}
