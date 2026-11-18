// The health-literacy scorecard: CDC Clear Communication Index and PEMAT-P, rated by the reviewer
// with suggestions from the text, beside the readability formulas.
import { useState } from 'react'
import { useStore } from '../state'
import { sectionsOf, textOf, laySections } from '../domain/project'
import { sectionsWith, leafletText } from '../domain/leaflet'
import { CDC_ITEMS, PEMAT_ITEMS, CDC_PASS, PEMAT_BENCHMARK, cdcScore, pematScores, hints, PL13_TEXT, PL13_KEY, type Rating, type ToolItem } from '../domain/literacy'
import { analyze } from '../domain/analyze'
import { Panel, Pill, Select, Stat, TextArea } from './ui'

type Doc = 'pl13' | 'consent' | 'leaflet' | 'lay'
export default function Literacy() {
  const { p, act } = useStore()
  const mission = p!.mission?.id === 'PL13'
  const docs: { value: Doc; label: string }[] = [...(mission ? [{ value: 'pl13' as Doc, label: 'Site handout (PL13)' }] : []), { value: 'consent', label: 'Adult consent form' }, ...(p!.leaflet ? [{ value: 'leaflet' as Doc, label: 'Package leaflet' }] : []), { value: 'lay', label: 'Lay summary of results' }]
  const [doc, setDoc] = useState<Doc>(docs[0].value)
  const text = doc === 'pl13' ? PL13_TEXT : doc === 'consent' ? textOf(sectionsOf(p!, 'consent')) : doc === 'leaflet' ? leafletText(sectionsWith(p!.leaflet!.file, p!.leaflet!.edits)) : textOf(laySections(p!))
  const sc = p!.scorecards?.[doc] ?? { cdc: {}, pemat: {} }, h = hints(text)
  const set = (tool: 'cdc' | 'pemat', id: string, r: Rating) => act((x) => { x.scorecards ??= {}; x.scorecards[doc] ??= { cdc: {}, pemat: {} }; x.scorecards[doc][tool][id] = r })
  const cdc = cdcScore(sc.cdc), pm = pematScores(sc.pemat), g = analyze(text).grade
  const done = mission && doc === 'pl13' && p!.mission?.submittedUtc
  return (
    <div className="space-y-4">
      <Panel title="Health-literacy scorecard" sub="Rate each item for the material as a reader would meet it. The app suggests a rating where the text shows something measurable; you decide. Item wording is shortened: read the CDC Clear Communication Index and AHRQ’s PEMAT for the full guidance.">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-lab-text-muted">Material<Select aria-label="Material to rate" value={doc} onChange={(e) => setDoc(e.target.value as Doc)} options={docs} /></label>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-4 gap-2 flex-1 min-w-0 basis-full sm:basis-auto">
            <Stat label={`CDC Index (pass ${CDC_PASS})`} value={cdc ?? '—'} tone={cdc === null ? 'grey' : cdc >= CDC_PASS ? 'green' : 'amber'} />
            <Stat label="PEMAT: understanding" value={pm.understandability === null ? '—' : `${pm.understandability}%`} tone={pm.understandability === null ? 'grey' : pm.understandability >= PEMAT_BENCHMARK ? 'green' : 'amber'} />
            <Stat label="PEMAT: action" value={pm.actionability === null ? '—' : `${pm.actionability}%`} tone={pm.actionability === null ? 'grey' : pm.actionability >= PEMAT_BENCHMARK ? 'green' : 'amber'} />
            <Stat label="Grade (Flesch-Kincaid)" value={g} tone={g <= 8 ? 'green' : 'amber'} />
          </div>
        </div>
        <p className="text-[11px] text-lab-text-muted">PEMAT: AHRQ sets no pass mark; {PEMAT_BENCHMARK}% is a benchmark often used in published studies. Items marked N/A are left out of the score.</p>
        <details className="text-sm"><summary className="cursor-pointer">The material being rated</summary><p className="whitespace-pre-wrap text-xs mt-1 max-h-60 overflow-auto">{text}</p></details>
      </Panel>
      <div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-2 gap-4 items-start">
        <ItemList title="CDC Clear Communication Index" items={CDC_ITEMS} r={sc.cdc} hints={h} onSet={(id, r) => set('cdc', id, r)} reveal={done ? PL13_KEY : undefined} />
        <ItemList title="PEMAT for printable materials" items={PEMAT_ITEMS} r={sc.pemat} hints={h} onSet={(id, r) => set('pemat', id, r)} reveal={done ? PL13_KEY : undefined} />
      </div>
      {mission && <Panel title="Your rewrite of the handout (PL13)" sub="Grade 8 or below; speak to “you”; list what happens as bullet lines (start each with “- ”); explain or drop every medical term; give numbers as “x in 100”; say whom to call, with a number placeholder.">
        <TextArea aria-label="Rewrite of the handout" className="min-h-48" value={p!.mission!.answers.pl13text ?? ''} onChange={(e) => act((x) => { x.mission!.answers.pl13text = e.target.value })} placeholder="Your study visits&#10;You will…" />
        {(p!.mission!.answers.pl13text ?? '').trim() && (() => { const hh = hints(p!.mission!.answers.pl13text); return <p className="text-xs text-lab-text-muted">Measured on the rewrite: grade {analyze(p!.mission!.answers.pl13text).grade}; {hh.P21.rating === 'yes' ? 'speaks to you' : 'does not say “you”'}; {hh.C8.why} {hh.P4.why} {hh.P6.why}</p> })()}
      </Panel>}
    </div>
  )
}

function ItemList({ title, items, r, hints: h, onSet, reveal }: { title: string; items: ToolItem[]; r: Record<string, Rating>; hints: ReturnType<typeof hints>; onSet: (id: string, r: Rating) => void; reveal?: typeof PL13_KEY }) {
  let part = ''
  return (
    <Panel title={title} sub={`${items.filter((i) => r[i.id]).length} of ${items.length} rated`}>
      <ol className="space-y-2">{items.map((it) => {
        const head = it.part !== part ? (part = it.part) : null, hint = h[it.id], key = reveal?.[it.id]
        return <li key={it.id}>
          {head && <p className="text-[11px] uppercase tracking-wide text-lab-text-muted mt-2">{head}</p>}
          <div className="flex flex-wrap items-start gap-2 text-sm">
            <span className="font-mono text-[11px] text-lab-text-muted w-8 shrink-0">{it.id}</span>
            <span className="flex-1 min-w-[12rem]">{it.text}</span>
            <span role="radiogroup" aria-label={`${it.id} rating`} className="flex gap-1">{(['yes', 'no', ...(it.na ? ['na'] : [])] as Rating[]).map((v) =>
              <button key={v} role="radio" aria-checked={r[it.id] === v} onClick={() => onSet(it.id, v)} className={`rounded border px-2 py-0.5 text-xs font-mono ${r[it.id] === v ? 'border-lab-fda text-lab-fda' : 'border-lab-line text-lab-text-muted'}`}>{v === 'na' ? 'N/A' : v}</button>)}</span>
          </div>
          {hint && <p className="text-[11px] text-lab-text-muted ml-10">Suggested: <b>{hint.rating === 'na' ? 'N/A' : hint.rating}</b>. {hint.why}</p>}
          {key && <p className={`text-[11px] ml-10 ${r[it.id] === key.r ? 'text-lab-cdsco' : 'text-lab-amber'}`}>Reference: <b>{key.r === 'na' ? 'N/A' : key.r}</b>. {key.why}</p>}
        </li> })}</ol>
      <Pill tone="grey">{`${items.filter((i) => r[i.id]).length}/${items.length}`}</Pill>
    </Panel>
  )
}
