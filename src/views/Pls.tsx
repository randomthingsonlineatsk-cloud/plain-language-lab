// Plain-language summary of the VERDANT-1 journal article, with a three-panel graphical abstract.
import { useStore } from '../state'
import { PLS_SOURCE, PLS_SECTIONS, blankPls, plsChecks, plsText, PLS_WORD_LIMIT, PANEL_WORD_LIMIT } from '../domain/pls'
import { analyze } from '../domain/analyze'
import { download } from '../domain/store'
import { Btn, Panel, TextArea, inputCls } from './ui'
import { Picture } from './EasyRead'

const words = (s: string) => s.split(/\s+/).filter(Boolean).length
export default function Pls() {
  const { p, act } = useStore()
  const d = p!.pls ?? blankPls(), checks = plsChecks(d)
  const upd = (fn: (x: NonNullable<typeof d>) => void) => act((x) => { x.pls ??= blankPls(); fn(x.pls) })
  const body = PLS_SECTIONS.map((s) => d.sections[s.id] ?? '').join(' ')
  const panels = [['question', 'The question', 'question'], ['did', 'What we did', 'people'], ['found', 'What we found', 'check']] as const
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  const html = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(d.title || 'Plain language summary')}</title><style>body{font:12pt Georgia,serif;max-width:42rem;margin:2rem auto;line-height:1.5}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}.g div{border:2px solid #246;border-radius:8px;padding:.6rem;font:11pt Arial,sans-serif}h2{font-size:1.05rem;margin-top:1.2rem}</style></head><body><p style="font:10pt Arial">Plain language summary</p><h1>${esc(d.title)}</h1><div class="g">${panels.map(([k, l]) => `<div><b>${l}</b><br>${esc(d.panels[k])}</div>`).join('')}</div>${PLS_SECTIONS.map((s) => `<h2>${s.heading}</h2><p>${esc(d.sections[s.id] ?? '')}</p>`).join('')}<p style="font:9pt Arial">Original article: ${esc(PLS_SOURCE.citation)}</p></body></html>`
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_24rem] gap-4 items-start">
      <div className="space-y-4">
        <Panel title="Plain-language summary of the article" sub={`For the journal, to sit with the article; separate from the EU lay summary of results. ${words(body)} of ${PLS_WORD_LIMIT} words · grade ${analyze(plsText(d)).grade}`} right={<Btn tone="grey" onClick={() => download('plain-language-summary.html', html(), 'text/html')}>Download (HTML)</Btn>}>
          <label className="block text-sm font-semibold">Title<input aria-label="Title" className={inputCls} value={d.title} onChange={(e) => upd((x) => { x.title = e.target.value })} placeholder="A plain title, 15 words or fewer" /></label>
          {PLS_SECTIONS.map((s) => <label key={s.id} className="block text-sm font-semibold">{s.heading}<TextArea aria-label={s.heading} className="min-h-20 font-normal" value={d.sections[s.id] ?? ''} onChange={(e) => upd((x) => { x.sections[s.id] = e.target.value })} /></label>)}
        </Panel>
        <Panel title="Graphical abstract" sub={`Three panels, each ${PANEL_WORD_LIMIT} words or fewer.`}>
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-3 gap-3">{panels.map(([k, l, icon]) => <div key={k} className="rounded-lg border-2 border-lab-fda/50 p-2 space-y-1">
            <div className="flex items-center gap-2"><Picture id={icon} size={28} /><b className="text-sm">{l}</b></div>
            <TextArea aria-label={l} className="min-h-24 text-sm" value={d.panels[k]} onChange={(e) => upd((x) => { x.panels[k] = e.target.value })} />
            <p className={`text-[11px] ${words(d.panels[k]) > PANEL_WORD_LIMIT ? 'text-lab-amber' : 'text-lab-text-muted'}`}>{words(d.panels[k])} words</p></div>)}</div>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Checks"><ul className="text-xs space-y-1">{checks.map((c) => <li key={c.id} className={c.ok ? '' : 'text-lab-amber'}>{c.ok ? '✓' : '✗'} {c.label}{!c.ok && c.why ? `: ${c.why}` : ''}</li>)}</ul></Panel>
        <Panel title="The article (fictional)" sub={PLS_SOURCE.citation}><p className="text-xs whitespace-pre-wrap">{PLS_SOURCE.abstract}</p></Panel>
      </div>
    </div>
  )
}
