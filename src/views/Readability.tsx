// The readability panel: six formulas side by side with their limits, sentence problems and jargon.
import { useState } from 'react'
import { analyze, type Analysis } from '../domain/analyze'
import { Panel, Pill } from './ui'

const KIND: Record<string, string> = { long: 'Long sentence', passive: 'Passive voice', nominal: 'Noun instead of verb', negative: 'Double negative', abbrev: 'Abbreviation not explained', percent: 'Percentage without “in 100”', longword: 'Long word' }

export function ReadabilityPanel({ text, target = 8, compact }: { text: string; target?: number; compact?: boolean }) {
  const a = analyze(text, target)
  const [open, setOpen] = useState<string | null>(null)
  if (!text.trim()) return <p className="text-xs text-lab-text-muted">Write or paste some text to see its readability.</p>
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <Pill tone={a.grade <= target ? 'green' : a.grade <= target + 2 ? 'amber' : 'red'}>{`Grade ${a.grade} (target ${target})`}</Pill>
        <span className="text-xs text-lab-text-muted">{a.words} words · {a.sentences} sentences · {a.wordsPerSentence} words a sentence · {a.longWordsPct}% long words</span>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-lab-text-muted"><th>Formula</th><th className="text-right">Result</th>{!compact && <th className="pl-3">What it counts and its limits</th>}</tr></thead>
        <tbody>{a.formulas.map((f) => (
          <tr key={f.id} className="border-t border-lab-line/60 align-top">
            <td className="py-1"><button className="underline decoration-dotted text-left" onClick={() => setOpen(open === f.id ? null : f.id)}>{f.name}</button>{compact && open === f.id && <p className="text-[11px] text-lab-text-muted mt-1">{f.counts} {f.limit}</p>}</td>
            <td className={`text-right font-mono ${f.ok ? 'text-lab-cdsco' : 'text-lab-amber'}`}>{f.value}{f.unit === 'score' ? '' : ''}</td>
            {!compact && <td className="pl-3 text-lab-text-muted">{f.counts} <i>{f.limit}</i></td>}
          </tr>))}</tbody>
      </table>
      {a.sentences < 30 && <p className="text-[11px] text-lab-text-muted">SMOG needs at least 30 sentences; with {a.sentences} it is a rough guide only.</p>}
      <Problems a={a} />
    </div>
  )
}

export function Problems({ a }: { a: Analysis }) {
  const byKind = Object.entries(a.problems.reduce<Record<string, string[]>>((m, p) => { (m[p.kind] ??= []).push(p.kind === 'long' ? `“${p.text.slice(0, 70)}${p.text.length > 70 ? '…' : ''}”` : p.text); return m }, {}))
  return (
    <div className="space-y-2">
      {byKind.length > 0 && <ul className="text-xs space-y-1">{byKind.map(([k, xs]) => <li key={k}><Pill tone="amber">{`${KIND[k]} × ${xs.length}`}</Pill> <span className="text-lab-text-muted">{xs.slice(0, 4).join(' · ')}{xs.length > 4 ? ' …' : ''}</span></li>)}</ul>}
      {a.jargon.length > 0 && <div className="text-xs"><p className="font-semibold mb-1">Jargon ({a.jargon.length})</p><ul className="space-y-0.5">{a.jargon.slice(0, 12).map((j) => <li key={j.word + j.index}><b>{j.word}</b> → {j.plain}{j.keep && <span className="text-lab-text-muted"> (may stay: {j.keep})</span>}</li>)}</ul></div>}
      {!byKind.length && !a.jargon.length && <p className="text-xs text-lab-cdsco">No sentence problems or jargon found.</p>}
    </div>
  )
}

/** Highlights the sentences that have problems, for the editor preview. */
export function Highlighted({ text }: { text: string }) {
  const a = analyze(text)
  return <p className="text-sm leading-relaxed">{a.sentenceList.map((s, i) => <span key={i} title={s.flags.map((f) => KIND[f]).join(', ')} className={s.flags.includes('long') ? 'bg-lab-amber-soft' : s.flags.length ? 'bg-lab-fda-soft' : ''}>{s.text} </span>)}</p>
}

export default function Analyzer() {
  const [text, setText] = useState('Hepatic enzyme elevations (ALT >3× ULN) were observed in 3% of subjects receiving lumiravostat in Phase 2 studies; these were asymptomatic and resolved upon discontinuation.')
  const [target, setTarget] = useState(8)
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="Text" sub="Paste any patient text. Nothing leaves this browser.">
        <textarea aria-label="Text to analyse" className="w-full min-h-72 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
        <label className="text-xs flex items-center gap-2">Target grade <input type="number" min={2} max={14} className="w-16 rounded border border-lab-line bg-lab-panel-strong px-1" value={target} onChange={(e) => setTarget(Number(e.target.value))} /> <span className="text-lab-text-muted">(8 for consent forms and leaflets, 6 for written assent, 4 for an oral script)</span></label>
        <Highlighted text={text} />
      </Panel>
      <Panel title="Readability" sub="Six formulas side by side. They count surface features of English and cannot judge meaning: use them as a warning, and test with readers."><ReadabilityPanel text={text} target={target} /></Panel>
    </div>
  )
}
