// The eConsent mock-up: set up the flow, then try it as a participant.
import { useState } from 'react'
import { useStore } from '../state'
import { sectionsOf } from '../domain/project'
import { ensureEConsent, econsentChecks, KEY_TOPICS, blankEConsent, type QuizQ, type Session, type KeyTopic } from '../domain/econsent'
import { JARGON_TERMS } from '../shared/jargon'
import { download } from '../domain/store'
import { Btn, Panel, Pill, Select, inputCls } from './ui'

const now = () => new Date().toISOString()
function Glossed({ text }: { text: string }) {
  // Underline each jargon term once with its plain meaning as a tooltip.
  const parts: (string | { w: string; plain: string })[] = []; let rest = text; const seen = new Set<string>()
  for (let guard = 0; guard < 40; guard++) {
    let best: { i: number; w: string; plain: string } | null = null
    for (const t of JARGON_TERMS) { if (seen.has(t.term)) continue; const m = t.re.exec(rest); if (m && (!best || m.index < best.i)) best = { i: m.index, w: m[0], plain: t.plain } }
    if (!best) break
    parts.push(rest.slice(0, best.i), { w: best.w, plain: best.plain }); rest = rest.slice(best.i + best.w.length); seen.add(JARGON_TERMS.find((t) => t.re.test(best!.w))!.term)
  }
  parts.push(rest)
  return <p className="text-base leading-relaxed whitespace-pre-wrap">{parts.map((x, i) => typeof x === 'string' ? x : <abbr key={i} title={x.plain} className="underline decoration-dotted cursor-help">{x.w}</abbr>)}</p>
}

function Flow({ onDone }: { onDone: (s: Session) => void }) {
  const { p } = useStore()
  const e = p!.econsent!, secs = sectionsOf(p!, 'consent')
  const [s] = useState<Session>(() => ({ id: `ES-${Date.now().toString(36)}`, participant: '', startedUtc: now(), events: [{ utc: now(), what: 'Session started' }], answers: {}, questions: [] }))
  const steps = [...(e.identity ? ['identity'] : []), ...secs.filter((x) => x.id !== 'consent').map((x) => `sec:${x.id}`), 'quiz', ...(e.questionLog ? ['questions'] : []), 'sign', 'done']
  const [i, setI] = useState(0), [, force] = useState(0)
  const [ans, setAns] = useState<Record<string, number>>({}), [wrong, setWrong] = useState<QuizQ | null>(null)
  const [name, setName] = useState(''), [q, setQ] = useState('')
  const log = (what: string) => { s.events.push({ utc: now(), what }); force((n) => n + 1) }
  const step = steps[i], next = () => setI((k) => Math.min(steps.length - 1, k + 1))
  return (
    <div className="rounded-xl border-2 border-lab-fda/50 bg-lab-panel-strong p-4 max-w-xl mx-auto space-y-3">
      <p className="text-[11px] text-lab-text-muted">Screen {i + 1} of {steps.length} · practice eConsent, not a real system</p>
      {step === 'identity' && <><h3 className="text-lg">Confirm who you are</h3><p className="text-sm">The study team checks your identity before you consent (in this practice flow, type a name).</p><input aria-label="Participant name" className={inputCls} value={name} onChange={(ev) => setName(ev.target.value)} /><Btn disabled={!name.trim()} onClick={() => { s.participant = name.trim(); log(`Identity confirmed: ${name.trim()}`); next() }}>Continue</Btn></>}
      {step.startsWith('sec:') && (() => { const sec = secs.find((x) => `sec:${x.id}` === step)!; return <><h3 className="text-lg">{sec.heading}</h3>{e.glossary ? <Glossed text={sec.text} /> : <p className="text-base whitespace-pre-wrap">{sec.text}</p>}<Btn onClick={() => { log(`Read: ${sec.heading}`); if (wrong) { setWrong(null); setI(steps.indexOf('quiz')) } else next() }}>{wrong ? 'Back to the questions' : 'Next'}</Btn></> })()}
      {step === 'quiz' && <><h3 className="text-lg">Check your understanding</h3>{e.quiz.map((qq) => <fieldset key={qq.id} className="space-y-1"><legend className="text-sm font-semibold">{qq.q}</legend>{qq.options.map((o, k) => <label key={k} className="flex gap-2 text-sm"><input type="radio" name={qq.id} checked={ans[qq.id] === k} onChange={() => setAns({ ...ans, [qq.id]: k })} />{o}</label>)}</fieldset>)}
        <Btn disabled={e.quiz.some((qq) => ans[qq.id] === undefined)} onClick={() => { for (const qq of e.quiz) (s.answers[qq.id] ??= []).push(ans[qq.id]); const bad = e.quiz.find((qq) => ans[qq.id] !== qq.answer); log(bad ? `Quiz: wrong answer to “${bad.q}”` : 'Quiz: all answers right'); if (bad && e.teachBack) { setWrong(bad); setAns({}); setI(Math.max(0, steps.indexOf(`sec:${bad.section}`))) } else next() }}>Check my answers</Btn>
        {wrong === null && Object.keys(s.answers).length > 0 && e.quiz.some((qq) => s.answers[qq.id]?.at(-1) !== qq.answer) && !e.teachBack && <p className="text-xs text-lab-amber">Some answers were wrong. Without teach-back, the flow moves on anyway.</p>}</>}
      {step === 'questions' && <><h3 className="text-lg">Any questions for the study doctor?</h3><textarea aria-label="Question for the study doctor" className={inputCls} value={q} onChange={(ev) => setQ(ev.target.value)} /><Btn onClick={() => { if (q.trim()) { s.questions.push(q.trim()); log(`Question logged for the investigator: ${q.trim()}`) } next() }}>{q.trim() ? 'Send and continue' : 'No questions'}</Btn></>}
      {step === 'sign' && <><h3 className="text-lg">Your consent</h3><p className="text-sm">By signing, I confirm I have read the information, had my questions answered, and agree to take part. I know I can stop at any time.</p><input aria-label="Type your full name to sign" className={inputCls} placeholder="Type your full name to sign" value={name} onChange={(ev) => setName(ev.target.value)} /><Btn disabled={!name.trim()} onClick={() => { s.signed = { name: name.trim(), meaning: 'Consent to take part in the study', utc: now() }; log('Signed: consent to take part'); next() }}>Sign</Btn></>}
      {step === 'done' && <><h3 className="text-lg">Thank you</h3><p className="text-sm">You will receive a copy of the signed form.</p><Btn onClick={() => { s.copy = true; log('Copy of the signed form sent to the participant'); onDone(s) }}>Send me my copy and finish</Btn></>}
    </div>
  )
}

export default function EConsent() {
  const { p, act } = useStore()
  const e = p!.econsent ?? blankEConsent(p!.facts)
  const [trying, setTrying] = useState(false)
  const secs = sectionsOf(p!, 'consent'), checks = econsentChecks(e)
  const upd = (fn: (x: NonNullable<typeof p>) => void) => act((x) => { ensureEConsent(x); fn(x) })
  const setQ = (i: number, k: keyof QuizQ, v: unknown) => upd((x) => { (x.econsent!.quiz[i] as unknown as Record<string, unknown>)[k] = v })
  if (trying) return <Flow onDone={(s) => { upd((x) => { x.econsent!.sessions.push(s) }); setTrying(false) }} />
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <Panel title="eConsent flow" sub="After the FDA and OHRP Q&A on electronic informed consent (2016) and the EU recommendation paper on decentralised elements (2022). A practice mock-up." right={<Btn onClick={() => { upd(() => {}); setTrying(true) }}>Try it as a participant</Btn>}>
          <div className="flex flex-wrap gap-4 text-sm">{([['identity', 'Confirm identity first'], ['glossary', 'Glossary pop-ups'], ['teachBack', 'Teach-back on wrong answers'], ['questionLog', 'Questions for the investigator']] as const).map(([k, l]) => <label key={k} className="flex gap-2"><input type="checkbox" checked={e[k]} onChange={(ev) => upd((x) => { x.econsent![k] = ev.target.checked })} />{l}</label>)}</div>
          <p className="text-sm font-semibold mt-2">Comprehension quiz ({e.quiz.length})</p>
          <div className="space-y-2">{e.quiz.map((q, i) => <div key={q.id} className="rounded border border-lab-line/60 p-2 text-xs space-y-1">
            <input aria-label={`Question ${q.id}`} className={inputCls} value={q.q} onChange={(ev) => setQ(i, 'q', ev.target.value)} />
            {q.options.map((o, k) => <div key={k} className="flex gap-2 items-center"><input type="radio" aria-label={`Correct answer ${k + 1}`} checked={q.answer === k} onChange={() => setQ(i, 'answer', k)} /><input aria-label={`Option ${k + 1}`} className={inputCls} value={o} onChange={(ev) => setQ(i, 'options', q.options.map((x, j) => (j === k ? ev.target.value : x)))} /></div>)}
            <div className="flex flex-wrap gap-2"><button className="underline" onClick={() => setQ(i, 'options', [...q.options, ''])}>add an option</button>
              <Select aria-label={`Key message for ${q.id}`} className="max-w-[16rem]" value={q.topic ?? ''} onChange={(ev) => setQ(i, 'topic', (ev.target.value || undefined) as KeyTopic | undefined)} options={[{ value: '', label: '(key message)' }, ...KEY_TOPICS.map((k) => ({ value: k.id, label: k.label }))]} />
              <Select aria-label={`Section for ${q.id}`} className="max-w-[16rem]" value={q.section} onChange={(ev) => setQ(i, 'section', ev.target.value)} options={secs.map((s) => ({ value: s.id, label: `Teach-back: ${s.heading}` }))} />
              <button className="text-lab-red underline" onClick={() => upd((x) => { x.econsent!.quiz.splice(i, 1) })}>remove</button></div>
          </div>)}</div>
          <Btn tone="grey" onClick={() => upd((x) => { x.econsent!.quiz.push({ id: `E${x.econsent!.quiz.length + 1}`, q: '', options: ['', ''], answer: 0, section: 'key' }) })}>Add a question</Btn>
        </Panel>
        <Panel title="Checklist"><ul className="text-xs space-y-1">{checks.map((c) => <li key={c.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} {c.label}</li>)}</ul></Panel>
      </div>
      {e.sessions.length > 0 && <Panel title="Sessions and audit trails">{e.sessions.map((s) => <details key={s.id} className="text-xs border-t border-lab-line/60 py-1"><summary className="cursor-pointer">{s.participant || 'Participant'} · {s.signed ? <Pill tone="green">signed</Pill> : <Pill>not signed</Pill>} · {s.events.length} events</summary>
        <ol className="list-decimal pl-5">{s.events.map((ev, k) => <li key={k}><span className="font-mono text-lab-text-muted">{ev.utc.replace('T', ' ').slice(0, 19)}</span> {ev.what}</li>)}</ol>
        <Btn tone="grey" onClick={() => download(`econsent-${s.id}.json`, JSON.stringify(s, null, 2))}>Download the audit trail</Btn></details>)}</Panel>}
    </div>
  )
}
