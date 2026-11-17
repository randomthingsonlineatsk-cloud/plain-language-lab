// Rewrite drills: the passage, the learner's rewrite, the score with its lines, and a model answer
// after the first try.
import { useState } from 'react'
import { useStore } from '../state'
import { PASSAGES, scoreRewrite, type Passage } from '../domain/drills'
import { Btn, Panel, Pill } from './ui'
import { ReadabilityPanel } from './Readability'

export function DrillCard({ p, value, onChange, onScore }: { p: Passage; value: string; onChange: (s: string) => void; onScore?: (n: number, text: string) => void }) {
  const [shown, setShown] = useState(false)
  const s = value.trim() ? scoreRewrite(p, value) : null
  return (
    <Panel title={`${p.id} · ${p.title}`} sub={`${p.kind}. ${p.context}. Target grade ${p.target}.`} right={s && <Pill tone={s.score >= 85 ? 'green' : s.score >= 70 ? 'amber' : 'red'}>{`Score ${s.score}`}</Pill>}>
      <blockquote className="border-l-2 border-lab-line pl-3 text-sm text-lab-text-muted">{p.source}</blockquote>
      <textarea aria-label={`Your rewrite of ${p.id}`} className="w-full min-h-32 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm" placeholder="Your rewrite for a lay reader" value={value} onChange={(e) => { onChange(e.target.value); onScore?.(e.target.value.trim() ? scoreRewrite(p, e.target.value).score : 0, e.target.value) }} />
      {s && <div className="grid md:grid-cols-2 gap-3 text-xs">
        <div><ul className="space-y-0.5">{s.lines.map((l) => <li key={l.label} className="flex justify-between gap-2"><span>{l.label}{'note' in l && l.note && <span className="block text-lab-text-muted">{l.note}</span>}</span><span className="font-mono">{l.got}/{l.of}</span></li>)}</ul>
          <p className="mt-2 font-semibold">Facts that must survive</p><ul>{s.kept.map((k) => <li key={k.label} className={k.ok ? 'text-lab-cdsco' : 'text-lab-amber'}>{k.ok ? '✓' : '✗'} {k.label}</li>)}</ul></div>
        <ReadabilityPanel text={value} target={p.target} compact />
      </div>}
      {s && <button className="text-xs underline text-lab-text-muted" onClick={() => setShown(!shown)}>{shown ? 'Hide' : 'Show'} a model answer</button>}
      {shown && <p className="text-sm whitespace-pre-wrap rounded border border-lab-line p-2">{p.model}</p>}
    </Panel>
  )
}

export default function Drills() {
  const { progress, record } = useStore()
  const [i, setI] = useState(0)
  const p = PASSAGES[i]
  const [text, setText] = useState(progress.drills[p.id]?.text ?? '')
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">{PASSAGES.map((x, k) => { const d = progress.drills[x.id]; return <Btn key={x.id} tone={k === i ? 'solid' : 'grey'} onClick={() => { setI(k); setText(progress.drills[x.id]?.text ?? '') }}>{x.id}{d ? ` · ${d.score}` : ''}</Btn> })}</div>
      <DrillCard key={p.id} p={p} value={text} onChange={setText} onScore={(n, t) => record((g) => { g.drills[p.id] = { text: t, score: n, utc: new Date().toISOString() } })} />
    </div>
  )
}
