import { useState } from 'react'
import { useStore } from '../state'
import { LESSONS } from '../domain/learn'
import { Btn, Panel, Pill } from './ui'

export default function Learn() {
  const { progress, record } = useStore()
  const [id, setId] = useState(LESSONS[0].id)
  const [ans, setAns] = useState<Record<number, number>>({})
  const l = LESSONS.find((x) => x.id === id)!, done = Object.keys(ans).length === l.quiz.length
  const score = l.quiz.filter((q, i) => ans[i] === q.answer).length
  return (
    <div className="grid lg:grid-cols-[16rem_1fr] gap-4">
      <nav aria-label="Lessons" className="space-y-1">{LESSONS.map((x) => { const q = progress.quizzes[x.id]; return (
        <button key={x.id} onClick={() => { setId(x.id); setAns({}) }} aria-current={x.id === id ? 'page' : undefined} className={`w-full text-left rounded px-2 py-1.5 text-sm border ${x.id === id ? 'border-lab-fda text-lab-fda' : 'border-transparent hover:border-lab-line'}`}>
          {x.title}{q && <span className="ml-1"><Pill tone={q.score === q.of ? 'green' : 'amber'}>{`${q.score}/${q.of}`}</Pill></span>}
        </button>) })}</nav>
      <div className="space-y-3">
        <Panel title={l.title}>{l.paras.map((p, i) => <p key={i} className="text-sm leading-relaxed">{p}</p>)}<div className="rounded border border-lab-ema/50 bg-lab-ema-soft p-2 text-sm"><b>VERDANT-1:</b> {l.example}</div></Panel>
        <Panel title="Quiz" sub="Three questions; all three right counts towards the certificate.">
          {l.quiz.map((q, i) => (
            <fieldset key={i} className="space-y-1"><legend className="text-sm font-semibold">{i + 1}. {q.q}</legend>
              {q.options.map((o, k) => <label key={k} className="flex gap-2 text-sm"><input type="radio" name={`q${i}`} checked={ans[i] === k} onChange={() => setAns({ ...ans, [i]: k })} />{o}{ans[i] !== undefined && k === q.answer && done && <span className="text-lab-cdsco">✓</span>}</label>)}
              {done && <p className={`text-xs ${ans[i] === q.answer ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{q.why}</p>}
            </fieldset>))}
          <Btn disabled={!done} onClick={() => record((g) => { g.quizzes[l.id] = { score, of: l.quiz.length, utc: new Date().toISOString() } })}>Save my result ({done ? `${score}/${l.quiz.length}` : 'answer all three'})</Btn>
        </Panel>
      </div>
    </div>
  )
}
