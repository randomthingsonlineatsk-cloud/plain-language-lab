// Writing skills drills: one item at a time, instant feedback, best score per set saved.
import { useState } from 'react'
import { useStore } from '../state'
import { SKILL_SETS, SET_PASS, scoreSet } from '../domain/skills'
import { Btn, Panel, Pill } from './ui'

export default function Skills() {
  const { progress, record } = useStore()
  const [setId, setSetId] = useState(SKILL_SETS[0].id)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [i, setI] = useState(0)
  const set = SKILL_SETS.find((s) => s.id === setId)!, item = set.items[i]
  const chosen = answers[item.id], done = set.items.every((x) => answers[x.id] !== undefined), score = scoreSet(set, answers)
  const pick = (id: string) => { setSetId(id); setAnswers({}); setI(0) }
  const passedSets = SKILL_SETS.filter((s) => (progress.skills?.[s.id]?.score ?? 0) >= SET_PASS).length
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] gap-4 items-start">
      <nav aria-label="Writing skills sets" className="space-y-1">
        <p className="text-xs text-lab-text-muted px-1">{passedSets} of {SKILL_SETS.length} sets passed ({SET_PASS} of 8 or better counts towards the certificate)</p>
        {SKILL_SETS.map((s) => { const b = progress.skills?.[s.id]; return (
          <button key={s.id} onClick={() => pick(s.id)} aria-current={s.id === setId ? 'true' : undefined} className={`w-full text-left rounded border px-2 py-1.5 text-sm ${s.id === setId ? 'border-lab-fda text-lab-fda' : 'border-lab-line/60'}`}>
            {s.title} {b && <Pill tone={b.score >= SET_PASS ? 'green' : 'amber'}>{`best ${b.score}/${b.of}`}</Pill>}
          </button>) })}
      </nav>
      <Panel title={`${set.title} · item ${i + 1} of ${set.items.length}`} sub={set.intro}>
        <p className="text-base">{item.q}</p>
        <div className="space-y-1.5" role="radiogroup" aria-label={item.q}>
          {item.options.map((o, k) => { const right = chosen !== undefined && k === item.answer, wrong = chosen === k && k !== item.answer
            return <button key={k} role="radio" aria-checked={chosen === k} disabled={chosen !== undefined} onClick={() => setAnswers({ ...answers, [item.id]: k })}
              className={`block w-full text-left rounded border px-3 py-2 text-sm disabled:cursor-default ${right ? 'border-lab-cdsco text-lab-cdsco' : wrong ? 'border-lab-red text-lab-red' : 'border-lab-line/60 hover:border-lab-fda'}`}>{o}{right ? ' ✓' : wrong ? ' ✗' : ''}</button> })}
        </div>
        {chosen !== undefined && <p className="text-sm" aria-live="polite"><b>{chosen === item.answer ? 'Right.' : 'Not quite.'}</b> {item.why}</p>}
        <div className="flex flex-wrap gap-2 items-center">
          <Btn tone="grey" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</Btn>
          <Btn tone="grey" disabled={i === set.items.length - 1} onClick={() => setI(i + 1)}>Next</Btn>
          <span className="text-xs text-lab-text-muted">{Object.keys(answers).filter((k) => set.items.some((x) => x.id === k)).length} answered · {score} right</span>
          {done && <Btn onClick={() => { record((g) => { g.skills ??= {}; const b = g.skills[set.id]?.score ?? -1; if (score >= b) g.skills[set.id] = { score, of: set.items.length, utc: new Date().toISOString() } }); pick(set.id) }}>Save my result ({score}/{set.items.length}) and start again</Btn>}
        </div>
      </Panel>
    </div>
  )
}
