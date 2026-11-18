// Easy Read and audio versions: one idea a line, a picture beside each, large print, and a script
// to read aloud. Pictures are simple drawings made for this app.
import { useStore } from '../state'
import { sectionsOf } from '../domain/project'
import { PICTURES, draftEasyRead, easyReadChecks, audioScriptFrom, audioChecks, WPM } from '../domain/easyread'
import { download } from '../domain/store'
import { Btn, Panel, Select, TextArea, inputCls } from './ui'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const ICON: Record<string, React.ReactNode> = {
  pill: <><rect x="6" y="16" width="36" height="16" rx="8" {...S} /><path d="M24 16v16" {...S} /></>,
  calendar: <><rect x="8" y="10" width="32" height="30" rx="3" {...S} /><path d="M8 18h32M16 6v8M32 6v8M15 26h4M22 26h4M29 26h4M15 33h4M22 33h4" {...S} /></>,
  doctor: <><circle cx="24" cy="14" r="7" {...S} /><path d="M10 42c0-9 6-14 14-14s14 5 14 14M20 30v5a4 4 0 0 0 8 0v-5" {...S} /></>,
  blood: <><path d="M24 6c6 9 12 15 12 22a12 12 0 0 1-24 0c0-7 6-13 12-22z" {...S} /></>,
  stop: <><path d="M17 6h14l10 10v14L31 40H17L7 30V16z" {...S} /><path d="M17 24h14" {...S} /></>,
  phone: <><rect x="15" y="5" width="18" height="38" rx="3" {...S} /><path d="M21 37h6" {...S} /></>,
  question: <><circle cx="24" cy="24" r="17" {...S} /><path d="M19 19a5 5 0 1 1 7 5c-2 1-2 2-2 4M24 33v1" {...S} /></>,
  warning: <><path d="M24 7l18 32H6z" {...S} /><path d="M24 19v9M24 33v1" {...S} /></>,
  people: <><circle cx="16" cy="16" r="5" {...S} /><circle cx="32" cy="16" r="5" {...S} /><path d="M6 38c0-7 4-11 10-11s10 4 10 11M22 38c0-7 4-11 10-11s10 4 10 11" {...S} /></>,
  baby: <><circle cx="24" cy="12" r="5" {...S} /><path d="M24 17v4c-6 0-9 5-9 11 0 5 4 9 9 9s9-4 9-9c0-5-3-9-5-10" {...S} /></>,
  lock: <><rect x="11" y="21" width="26" height="20" rx="3" {...S} /><path d="M17 21v-6a7 7 0 0 1 14 0v6M24 29v5" {...S} /></>,
  hand: <><path d="M16 40V20a3 3 0 0 1 6 0v8V12a3 3 0 0 1 6 0v16V15a3 3 0 0 1 6 0v17c0 6-4 10-10 10h-2c-4 0-7-2-9-5l-5-8a3 3 0 0 1 5-3l3 4" {...S} /></>,
  check: <><circle cx="24" cy="24" r="17" {...S} /><path d="M16 24l6 6 11-12" {...S} /></>,
}
export function Picture({ id, size = 40 }: { id: string; size?: number }) {
  const label = PICTURES.find((x) => x.id === id)?.label ?? 'No picture'
  return <svg role="img" aria-label={label} viewBox="0 0 48 48" width={size} height={size} className="shrink-0 text-lab-fda">{ICON[id] ?? <rect x="8" y="8" width="32" height="32" rx="4" {...S} strokeDasharray="4 4" />}</svg>
}

export default function EasyRead() {
  const { p, act } = useStore()
  const e = p!.easyRead
  if (!e) return (
    <Panel title="Easy Read and audio" sub="An Easy Read version for adults with a learning disability (alongside their representative’s consent) and anyone who finds reading hard; an audio script for people who cannot read print.">
      <p className="text-sm">Start from a section of the consent form: the app splits it into one sentence a line with a suggested picture, and you rewrite it.</p>
      <div className="flex flex-wrap gap-2">{sectionsOf(p!, 'consent').filter((s) => ['key', 'what', 'risks', 'voluntary'].includes(s.id)).map((s) => <Btn key={s.id} tone="grey" onClick={() => act((x) => { x.easyRead = draftEasyRead(sectionsOf(x, 'consent').filter((y) => y.id === s.id)) })}>From “{s.heading}”</Btn>)}</div>
    </Panel>
  )
  const er = easyReadChecks(e), au = audioChecks(e.audio)
  const upd = (fn: (x: NonNullable<typeof e>) => void) => act((x) => fn(x.easyRead!))
  const html = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Easy Read</title><style>body{font:${e.fontPt}pt Arial,sans-serif;max-width:40rem;margin:2rem auto;line-height:1.5}li{display:flex;gap:1rem;align-items:center;margin:.8rem 0}.pic{width:64px;height:64px;border:2px solid #333;border-radius:8px;display:grid;place-items:center;font-size:10pt;text-align:center}</style></head><body><ul style="list-style:none;padding:0">${e.lines.filter((l) => l.text.trim()).map((l) => `<li><span class="pic">${PICTURES.find((x) => x.id === l.picture)?.label ?? ''}</span><span>${l.text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)}</span></li>`).join('')}</ul><p style="font-size:10pt">Training document. Fictional study. Picture slots name the picture to place.</p></body></html>`
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 items-start">
      <div className="space-y-4">
        <Panel title="Easy Read version" sub="One idea a line, 15 words or fewer, everyday words, a picture beside each line." right={<label className="text-xs flex items-center gap-1">Print size<input aria-label="Print size in points" type="number" min={10} max={24} className={`${inputCls} w-16`} value={e.fontPt} onChange={(ev) => upd((x) => { x.fontPt = Number(ev.target.value) || 12 })} />pt</label>}>
          <ol className="space-y-2">{e.lines.map((l, i) => <li key={i} className="flex flex-wrap items-center gap-2">
            <Picture id={l.picture} />
            <input aria-label={`Line ${i + 1}`} className={`${inputCls} flex-1 min-w-[12rem]`} style={{ fontSize: `${Math.min(e.fontPt, 18)}pt` }} value={l.text} onChange={(ev) => upd((x) => { x.lines[i].text = ev.target.value })} />
            <Select aria-label={`Picture for line ${i + 1}`} className="w-36" value={l.picture} onChange={(ev) => upd((x) => { x.lines[i].picture = ev.target.value })} options={[{ value: '', label: '(no picture)' }, ...PICTURES.map((x) => ({ value: x.id, label: x.label }))]} />
            <button className="text-xs underline" onClick={() => upd((x) => { x.lines.splice(i + 1, 0, { text: '', picture: '' }) })}>add below</button>
            <button className="text-xs text-lab-red underline" onClick={() => upd((x) => { x.lines.splice(i, 1) })}>remove</button>
          </li>)}</ol>
          <div className="flex flex-wrap gap-2"><Btn tone="grey" onClick={() => upd((x) => { x.lines.push({ text: '', picture: '' }) })}>Add a line</Btn><Btn tone="grey" onClick={() => download('easy-read.html', html(), 'text/html')}>Download (HTML, to print)</Btn></div>
        </Panel>
        <Panel title="Audio script" sub={`Read aloud at about ${WPM} words a minute; [pause] marks a short pause.`} right={<Btn tone="grey" onClick={() => upd((x) => { x.audio = audioScriptFrom(x) })}>Make from the Easy Read lines</Btn>}>
          <TextArea aria-label="Audio script" className="min-h-40" value={e.audio} onChange={(ev) => upd((x) => { x.audio = ev.target.value })} />
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Easy Read checks"><ul className="text-xs space-y-1">{er.map((c) => <li key={c.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} {c.label}{c.why && !c.ok ? `: ${c.why}` : ''}</li>)}</ul></Panel>
        <Panel title="Audio checks"><ul className="text-xs space-y-1">{au.map((c) => <li key={c.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} {c.label}{c.why && !c.ok ? `: ${c.why}` : ''}</li>)}</ul>
          <p className="text-[11px] text-lab-text-muted">Easy Read guidance varies; there is no single legal standard.</p></Panel>
      </div>
    </div>
  )
}
