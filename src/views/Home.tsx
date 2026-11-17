import { useRef } from 'react'
import { useStore } from '../state'
import { EXAMPLES, exampleProject, readFile } from '../domain/project'
import { MISSIONS, startMission } from '../domain/missions'
import { LESSONS } from '../domain/learn'
import { PASSAGES } from '../domain/drills'
import { Btn, Panel, Pill, fmtUtc } from './ui'

export default function Home({ onOpen }: { onOpen: () => void }) {
  const { projects, open, remove, setError, progress } = useStore()
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
      <Panel title="Your progress" sub="Saved in this browser."><p className="text-sm">{quizzes} of {LESSONS.length} quizzes fully right · {drills} of {PASSAGES.length} drills at 85 or more · {Object.keys(progress.missions).length} of {MISSIONS.length} missions tried.</p></Panel>
      {projects.length > 0 && <Panel title="Your projects">
        <ul className="divide-y divide-lab-line/60">{projects.map((p) => <li key={p.id} className="py-2 flex flex-wrap items-center gap-2 text-sm">
          <button className="text-left underline decoration-dotted mr-auto" onClick={() => go(p)}>{p.name}</button>
          {p.mission && <Pill tone="purple">{p.mission.id}</Pill>}<span className="text-xs text-lab-text-muted">{fmtUtc(p.updatedUtc)} UTC</span>
          <button className="text-xs text-lab-red underline" onClick={() => remove(p.id)}>Delete</button></li>)}</ul>
      </Panel>}
    </div>
  )
}
