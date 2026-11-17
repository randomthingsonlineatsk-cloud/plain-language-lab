import { useRef } from 'react'
import { useStore } from '../state'
import { EXAMPLES, exampleProject, readFile } from '../domain/project'
import { MISSIONS, startMission } from '../domain/missions'
import { LESSONS } from '../domain/learn'
import { PASSAGES } from '../domain/drills'
import { SKILL_SETS, SET_PASS } from '../domain/skills'
import { certificate, certificateHtml, passportRecord, PASSPORT_PAGE } from '../domain/certificate'
import { download } from '../domain/store'
import { Btn, Panel, Pill, fmtUtc, inputCls } from './ui'

export default function Home({ onOpen }: { onOpen: () => void }) {
  const { projects, open, remove, setError, progress, record } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const go = (p: Parameters<typeof open>[0]) => { open(p); onOpen() }
  const quizzes = LESSONS.filter((l) => progress.quizzes[l.id]?.score === 3).length
  const drills = PASSAGES.filter((x) => (progress.drills[x.id]?.score ?? 0) >= 85).length
  return (
    <div className="space-y-4">
      <Panel title="Start" sub="Each study comes from the Protocol Builder, so names, numbers and risks match across the apps. Products, sponsors and studies are fictional.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(EXAMPLES).map(([id, f]) => <Btn key={id} onClick={() => go(exampleProject(id))}>{`${f.acronym || id} (${id})`}</Btn>)}
          <Btn tone="grey" onClick={() => file.current?.click()}>Open a file…</Btn>
          <input ref={file} type="file" accept=".json,application/json" className="hidden" aria-label="Open a project or Protocol Builder file" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { go(readFile(await f.text())) } catch (err) { setError((err as Error).message) } }} />
        </div>
        <p className="text-xs text-lab-text-muted">“Open a file” takes a Plain Language Lab project file, or a Protocol Builder project file (Export page, “Project file”): its latest version becomes a new study here.</p>
      </Panel>
      <Panel title="Missions" sub="Scored out of 100 by rules in the browser.">
        <div className="grid md:grid-cols-2 gap-2">{MISSIONS.map((m) => { const best = progress.missions[m.id]?.score; return (
          <div key={m.id} className="rounded border border-lab-line/60 p-2 flex flex-col gap-1">
            <p className="text-sm font-semibold">{m.id} · {m.title} {m.core && <Pill tone="purple">core</Pill>} {best !== undefined && <Pill tone={best >= m.expert ? 'green' : best >= m.pass ? 'blue' : 'amber'}>{`best ${best}`}</Pill>}</p>
            <p className="text-xs text-lab-text-muted line-clamp-3">{m.brief}</p>
            <Btn className="self-start" tone="grey" onClick={() => go(startMission(m.id))}>Start</Btn>
          </div>) })}</div>
      </Panel>
      <Panel title="Your progress and certificate" sub="Saved in this browser.">
        <p className="text-sm">{quizzes} of {LESSONS.length} quizzes fully right · {drills} of {PASSAGES.length} rewrite drills at 85 or more · {SKILL_SETS.filter((x) => (progress.skills?.[x.id]?.score ?? 0) >= SET_PASS).length} of {SKILL_SETS.length} writing-skills sets passed · {Object.keys(progress.missions).length} of {MISSIONS.length} missions tried.</p>
        <label className="block text-xs text-lab-text-muted max-w-sm">Your name (for the certificate and the classroom)<input className={inputCls} value={progress.name ?? ''} onChange={(e) => { const v = e.target.value; record((g) => { g.name = v }) }} /></label>
        <CertificatePanel />
      </Panel>
      {projects.length > 0 && <Panel title="Your projects">
        <ul className="divide-y divide-lab-line/60">{projects.map((p) => <li key={p.id} className="py-2 flex flex-wrap items-center gap-2 text-sm">
          <button className="text-left underline decoration-dotted mr-auto" onClick={() => go(p)}>{p.name}</button>
          {p.mission && <Pill tone="purple">{p.mission.id}</Pill>}<span className="text-xs text-lab-text-muted">{fmtUtc(p.updatedUtc)} UTC</span>
          <button className="text-xs text-lab-red underline" onClick={() => remove(p.id)}>Delete</button></li>)}</ul>
      </Panel>}
    </div>
  )
}

function CertificatePanel() {
  const { progress } = useStore()
  const learner = { name: progress.name ?? '', userId: progress.userId }
  const c = certificate(progress, learner)
  const left = c.criteria.filter((x) => !x.met)
  return (
    <div className="rounded border border-lab-line p-2 space-y-1 text-sm">
      <p className="font-semibold">Certificate {c.eligible ? <Pill tone={c.distinction ? 'purple' : 'green'}>{c.distinction ? 'with distinction' : 'earned'}</Pill> : <Pill tone="grey">{`${c.criteria.length - left.length} of ${c.criteria.length}`}</Pill>}</p>
      <p className="text-xs text-lab-text-muted">Pass the core missions (PL1, PL2, PL3, PL6 and PL8), every Learn quiz and every writing-skills set. Distinction: every mission passed, three or more at expert level. The verification code can be checked on the <a className="underline text-lab-fda" href={PASSPORT_PAGE} target="_blank" rel="noreferrer">Skills Passport</a>.</p>
      {!c.eligible && <p className="text-xs">Still to do: {left.map((x) => x.label).join('; ')}.</p>}
      {c.eligible && <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-lab-cdsco">{c.code}</span>
        <Btn disabled={!learner.name.trim()} onClick={() => download('plain-language-lab-certificate.html', certificateHtml(c, learner), 'text/html')}>Certificate (HTML)</Btn>
        <Btn tone="grey" disabled={!learner.name.trim()} onClick={() => download('plain-language-lab-passport-record.json', JSON.stringify(passportRecord(c, learner), null, 2))}>Passport record (JSON)</Btn>
        {!learner.name.trim() && <span className="text-xs text-lab-amber">Enter your name above first.</span>}</div>}
    </div>
  )
}
