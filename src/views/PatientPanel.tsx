// Patient panel review: the personas' comments on the consent form, their resolution and the log.
import { useState } from 'react'
import { useStore } from '../state'
import { sectionsOf } from '../domain/project'
import { PERSONAS, runPanel, panelStatus, panelLog } from '../domain/panel'
import { PANEL_SCOPE } from '../domain/missions'
import { download } from '../domain/store'
import { useNav } from '../nav'
import { Btn, Panel, Pill, inputCls } from './ui'

export default function PatientPanel() {
  const { p, act } = useStore()
  const nav = useNav()
  const secs = sectionsOf(p!, 'consent')
  const [scope, setScope] = useState<string[]>(p!.panel?.sections ?? PANEL_SCOPE)
  const [note, setNote] = useState<Record<string, string>>({})
  const rows = p!.panel ? panelStatus(p!.panel, secs) : []
  const open = rows.filter((r) => r.state === 'open').length
  const run = () => act((x) => { x.panel = runPanel('consent', sectionsOf(x, 'consent').filter((s) => scope.includes(s.id))) })
  return (
    <div className="space-y-4">
      <Panel title="Patient panel review" sub="Five readers, written for this app, comment the way a patient advisory panel would. Their comments come from rules: a rehearsal for a real panel, not a substitute. Resolve each one by revising the text (it closes when the problem is gone) or by keeping the text with a reason."
        right={p!.panel ? <Pill tone={open ? 'amber' : 'green'}>{open ? `${open} open` : 'all resolved'}</Pill> : undefined}>
        <ul className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 gap-2 text-xs">{PERSONAS.map((x) => <li key={x.id} className="rounded border border-lab-line/60 p-2"><b>{x.name}</b>: {x.who}</li>)}</ul>
        <fieldset className="flex flex-wrap gap-3 text-xs"><legend className="text-lab-text-muted mb-1">Sections to review</legend>{secs.map((s) => <label key={s.id} className="flex gap-1"><input type="checkbox" checked={scope.includes(s.id)} disabled={!!p!.mission && !!p!.panel} onChange={(e) => setScope(e.target.checked ? [...scope, s.id] : scope.filter((x) => x !== s.id))} />{s.heading}</label>)}</fieldset>
        <div className="flex flex-wrap gap-2">{(!p!.mission || !p!.panel) && <Btn onClick={run} disabled={!scope.length}>{p!.panel ? 'Run the panel again (new comments)' : 'Run the panel'}</Btn>}
          <Btn tone="grey" onClick={() => nav.go('documents')}>Open the consent form</Btn>
          {p!.panel && <Btn tone="grey" onClick={() => download('patient-panel-log.txt', panelLog(p!.panel!, secs), 'text/plain')}>Download the review log</Btn>}</div>
      </Panel>
      {p!.panel && <Panel title={`Comments (${rows.length})`}>
        <ul className="divide-y divide-lab-line/60">{rows.map(({ c, res, state }) => <li key={c.id} className="py-2 space-y-1 text-sm">
          <p className="flex flex-wrap items-center gap-2"><Pill tone={state === 'open' ? 'amber' : state === 'revised' ? 'green' : 'blue'}>{state}</Pill><b>{PERSONAS.find((x) => x.id === c.persona)?.name}</b><span className="text-xs text-lab-text-muted">on “{secs.find((s) => s.id === c.section)?.heading}”</span></p>
          <p>{c.text}</p>
          {state === 'kept' && <p className="text-xs text-lab-text-muted">Kept: {res?.note}</p>}
          {state === 'open' && <div className="flex flex-wrap gap-2"><input aria-label={`Reason for keeping the text (${c.id})`} className={`${inputCls} flex-1 min-w-48 text-xs`} placeholder="Reason for keeping the text as it is" value={note[c.id] ?? res?.note ?? ''} onChange={(e) => setNote({ ...note, [c.id]: e.target.value })} />
            <Btn tone="grey" disabled={(note[c.id] ?? '').trim().length < 15} onClick={() => act((x) => { x.panel!.resolutions[c.id] = { action: 'kept', note: note[c.id].trim(), by: 'you', utc: new Date().toISOString() } })}>Keep with this reason</Btn></div>}
        </li>)}</ul>
      </Panel>}
    </div>
  )
}
