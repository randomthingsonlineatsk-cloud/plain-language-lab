// The patient leaflet from the Labelling Workbench: review and rewrite; and the simulated user test.
import { useRef, useState } from 'react'
import { useStore } from '../state'
import { LEAFLET_EXAMPLES, readLeafletFile, reviewLeaflet, sectionsWith, KEY_MESSAGES, leafletText } from '../domain/leaflet'
import { runRound, verdict, panel, EU_QUESTIONS, type Question } from '../domain/usertest'
import { analyze } from '../domain/analyze'
import { Btn, Panel, Pill, Select, inputCls } from './ui'
import { ReadabilityPanel } from './Readability'

function NoLeaflet() {
  const { act, setError } = useStore()
  const file = useRef<HTMLInputElement>(null)
  return (
    <Panel title="No leaflet yet" sub="Leaflets come from the Labelling Workbench (a package leaflet or Medication Guide, Export page, “Leaflet for the Plain Language Lab”). Or use Ostrevia’s.">
      <div className="flex flex-wrap gap-2">
        {Object.entries(LEAFLET_EXAMPLES).map(([k, f]) => <Btn key={k} tone="grey" onClick={() => act((x) => { x.leaflet = { key: k, file: structuredClone(f), edits: {}, questions: f.region === 'eu' ? structuredClone(EU_QUESTIONS) : [], rounds: [] } })}>{`${f.product.brand}: ${f.title}`}</Btn>)}
        <Btn tone="grey" onClick={() => file.current?.click()}>Open a leaflet file…</Btn>
        <input ref={file} type="file" accept=".json" className="hidden" aria-label="Open a leaflet file" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const lf = readLeafletFile(await f.text()); act((x) => { x.leaflet = { key: 'file', file: lf, edits: {}, questions: [], rounds: [] } }) } catch (err) { setError((err as Error).message) } }} />
      </div>
    </Panel>
  )
}

export function Leaflet() {
  const { p, act } = useStore()
  const L = p!.leaflet
  if (!L) return <NoLeaflet />
  const secs = sectionsWith(L.file, L.edits), r = reviewLeaflet(L.file, secs), target = p!.targets.leaflet ?? 8
  return (
    <div className="grid lg:grid-cols-[1fr_24rem] gap-4">
      <Panel title={`${L.file.product.brand}: ${L.file.title}`} sub={`${L.file.region === 'eu' ? 'EU package leaflet (QRD template)' : 'US Medication Guide (21 CFR 208)'} from the Labelling Workbench. Headings and order stay as set there; rewrite the text.`} right={<Btn tone="grey" onClick={() => act((x) => { x.leaflet = null })}>Use another leaflet</Btn>}>
        <div className="space-y-3">{secs.map((s) => { const a = analyze(s.text); const edited = s.num in L.edits
          return <div key={s.num} style={{ marginLeft: s.depth * 16 }}>
            <p className="text-sm flex flex-wrap items-center gap-2"><b>{s.heading}</b>{s.text.trim() && <span className={`text-[11px] font-mono ${a.grade <= target ? 'text-lab-cdsco' : 'text-lab-amber'}`}>grade {a.grade}</span>}{edited && <><Pill tone="blue">edited</Pill><button className="text-[11px] underline text-lab-text-muted" onClick={() => act((x) => { delete x.leaflet!.edits[s.num] })}>restore</button></>}</p>
            {(s.text.trim() || edited) && <textarea aria-label={s.heading} className="w-full min-h-20 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm mt-1" value={s.text} onChange={(e) => act((x) => { x.leaflet!.edits[s.num] = e.target.value })} />}
          </div> })}</div>
      </Panel>
      <div className="space-y-3">
        <Panel title="Key messages" sub="What a reader must be able to find and act on." right={<Pill tone={r.messages.every((m) => m.ok) ? 'green' : 'red'}>{`${r.messages.filter((m) => m.ok).length}/${r.messages.length}`}</Pill>}>
          <ul className="text-xs space-y-0.5">{r.messages.map((m) => <li key={m.m.id} className={m.ok ? '' : 'text-lab-red'}>{m.ok ? '✓' : '✗'} {m.m.label}</li>)}</ul>
        </Panel>
        {r.numbers.length > 0 && <Panel title="Numbers"><ul className="text-xs space-y-1">{r.numbers.map((n) => <li key={n.id}><Pill tone="amber">{n.rule}</Pill> {n.fix}</li>)}</ul></Panel>}
        <Panel title="Readability of the leaflet"><ReadabilityPanel text={secs.map((s) => s.text).join('\n')} target={target} compact /></Panel>
      </div>
    </div>
  )
}

export function UserTest() {
  const { p, act } = useStore()
  const L = p!.leaflet
  const [show, setShow] = useState<number | null>(null)
  if (!L) return <NoLeaflet />
  const secs = sectionsWith(L.file, L.edits), v = verdict(L.rounds, L.questions, secs), text = leafletText(secs)
  const msgs = KEY_MESSAGES[L.file.region], covered = (id: string) => L.questions.some((q) => q.message === id)
  const nextN = L.rounds.filter((r) => !r.pilot).length + 1
  const setQ = (i: number, k: keyof Question, val: string) => act((x) => { (x.leaflet!.questions[i] as unknown as Record<string, string>)[k] = val })
  const opts = [{ value: '', label: '(section)' }, ...secs.map((s) => ({ value: s.num, label: s.heading.slice(0, 60) }))]
  return (
    <div className="space-y-4">
      <Panel title="Simulated user test" sub="After the EU readability-testing method: a questionnaire on the key messages, a pilot, then rounds of 10 participants. An answer passes when at least 90% find it and 90% of those understand it (16 of 20 understood over two rounds on the same text). The participants are simulated from the text; real tests use real people."
        right={<span className="flex gap-1"><Btn tone="grey" onClick={() => act((x) => { x.leaflet!.rounds.push(runRound(secs, x.leaflet!.questions, 0, true)) })}>Run the pilot (3 people)</Btn><Btn onClick={() => act((x) => { x.leaflet!.rounds.push(runRound(secs, x.leaflet!.questions, nextN)) })} disabled={!L.questions.length}>{`Run round ${nextN} (10 people)`}</Btn></span>}>
        <p className="text-sm"><Pill tone={v.pass ? 'green' : v.ready ? 'red' : 'grey'}>{v.pass ? 'Pass' : v.ready ? 'Not yet' : 'No verdict yet'}</Pill> {v.why}</p>
        <p className="text-xs">Key messages with a question: {msgs.map((m) => <span key={m.id} className={`mr-2 ${covered(m.id) ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{covered(m.id) ? '✓' : '✗'} {m.label}</span>)}</p>
      </Panel>
      <Panel title={`Questionnaire (${L.questions.length})`} sub="Each question points to the section that should answer it; the answer pattern says what a correct answer contains (a word or phrase, or several separated by |).">
        <div className="space-y-2">{L.questions.map((q, i) => {
          const sec = secs.find((s) => s.num === q.section), here = !!sec && (() => { try { return new RegExp(q.answer, 'i').test(sec.text) } catch { return false } })()
          const last = [...L.rounds].reverse().find((r) => r.results.some((x) => x.id === q.id))?.results.find((x) => x.id === q.id)
          return <div key={q.id} className="grid md:grid-cols-[3rem_1fr_14rem_10rem_10rem_7rem_auto] gap-1 items-center text-xs">
            <span className="font-mono">{q.id}</span>
            <input aria-label={`Question ${q.id}`} className={inputCls} value={q.q} onChange={(e) => setQ(i, 'q', e.target.value)} />
            <Select aria-label={`Section for ${q.id}`} value={q.section} onChange={(e) => setQ(i, 'section', e.target.value)} options={opts} />
            <input aria-label={`Answer for ${q.id}`} className={inputCls} value={q.answer} onChange={(e) => setQ(i, 'answer', e.target.value)} />
            <Select aria-label={`Key message for ${q.id}`} value={q.message ?? ''} onChange={(e) => setQ(i, 'message', e.target.value)} options={[{ value: '', label: '(no key message)' }, ...msgs.map((m) => ({ value: m.id, label: m.label.slice(0, 40) }))]} />
            <span className={here ? 'text-lab-cdsco' : 'text-lab-red'}>{here ? 'answer present' : 'answer not in section'}{last && <span className="block text-lab-text-muted">last: {last.found}/{last.of} found, {last.understood} understood</span>}</span>
            <button className="text-lab-red underline" onClick={() => act((x) => { x.leaflet!.questions.splice(i, 1) })}>remove</button>
          </div> })}</div>
        <Btn tone="grey" onClick={() => act((x) => { const n = Math.max(0, ...x.leaflet!.questions.map((q) => Number(q.id.replace(/\D/g, '')) || 0)) + 1; x.leaflet!.questions.push({ id: `Q${n}`, q: '', section: '', answer: '' }) })}>Add a question</Btn>
        {!text && <p />}
      </Panel>
      {L.rounds.length > 0 && <Panel title="Rounds" sub="Found and understood, per question. Change the text between rounds to see the effect; the verdict uses the last two rounds of 10 on the current text.">
        <div className="overflow-x-auto"><table className="text-xs w-full"><thead><tr className="text-left text-lab-text-muted"><th>Question</th>{L.rounds.map((r, i) => <th key={i} className="text-right px-2"><button className="underline" onClick={() => setShow(show === i ? null : i)}>{r.pilot ? 'Pilot' : `Round ${r.n}`}</button></th>)}</tr></thead>
          <tbody>{L.questions.map((q) => <tr key={q.id} className="border-t border-lab-line/60"><td className="py-0.5">{q.id} {q.q.slice(0, 50)}</td>{L.rounds.map((r, i) => { const x = r.results.find((y) => y.id === q.id); return <td key={i} className={`text-right px-2 font-mono ${x && x.found >= Math.ceil(0.9 * x.of) && x.understood >= Math.ceil(0.8 * x.of) ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{x ? `${x.found}/${x.understood}/${x.of}` : '—'}</td> })}</tr>)}</tbody></table></div>
        {show !== null && <p className="text-xs text-lab-text-muted">Participants: {L.rounds[show].participants.map((x) => `${x.id} (${x.literacy} literacy, ${x.numeracy} numeracy)`).join('; ')}</p>}
        <p className="text-[11px] text-lab-text-muted">Cells: found / understood / participants. A panel mixes literacy levels as a real one should: {panel(1, 10).filter((x) => x.literacy === 'low').length} of 10 with low literacy in round 1.</p>
        <Btn tone="grey" onClick={() => act((x) => { x.leaflet!.rounds = [] })}>Clear the rounds</Btn>
      </Panel>}
    </div>
  )
}
