// Overview of the study, the regions whose rules apply, India's recording decision and the export.
import { useStore } from '../state'
import { sectionsOf, projectFile, docChecks, textOf, laySections } from '../domain/project'
import { sectionsWith } from '../domain/leaflet'
import { DOC_TYPES } from '../domain/types'
import { REGION_NAMES, indiaRecording, type Region } from '../shared/consent'
import { analyze } from '../domain/analyze'
import { download } from '../domain/store'
import { Btn, Panel, Pill, Stat } from './ui'

export function Overview() {
  const { p, act } = useStore()
  const f = p!.facts, c = docChecks(p!)
  const ok = c.filter((x) => x.ok).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Study" value={`${f.acronym || f.protocolId} (${f.protocolId})`} />
        <Stat label="Consent elements present" value={`${ok} of ${c.length}`} tone={ok === c.length ? 'green' : 'amber'} />
        <Stat label="Consent form grade" value={`${analyze(textOf(sectionsOf(p!, 'consent'))).grade}`} />
        <Stat label="Regions" value={p!.regions.filter((r) => r !== 'GCP' && r !== 'KEY').join(', ') || 'none'} />
      </div>
      <Panel title={f.fullTitle || f.shortTitle} sub={`${f.sponsor} · ${f.phase} · ${f.participants} participants in ${f.countries.join(', ')}`}>
        <p className="text-sm">{f.aim}</p>
        <p className="text-xs text-lab-text-muted">The documents are drafted from these facts, which come from the Protocol Builder. Change the protocol there and import it again to redraft; your edits to each section are kept.</p>
      </Panel>
      <Panel title="Rules that apply" sub="From the registry numbers and the countries; change them to practise another region.">
        <div className="flex flex-wrap gap-3">{(['GCP', 'US', 'EU', 'IN', 'KEY'] as Region[]).map((r) => <label key={r} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p!.regions.includes(r)} onChange={(e) => act((x) => { x.regions = e.target.checked ? [...x.regions, r] : x.regions.filter((y) => y !== r) })} />{REGION_NAMES[r]}</label>)}</div>
      </Panel>
    </div>
  )
}

export function India() {
  const { p, act } = useStore()
  const i = p!.india, r = indiaRecording({ newChemicalEntity: i.newChemicalEntity, hivOrLeprosy: i.hivOrLeprosy, vulnerable: i.vulnerable })
  const set = (k: keyof typeof i, v: boolean) => act((x) => { x.india[k] = v })
  return (
    <div className="space-y-4">
      <Panel title="India: recording the consent process" sub="New Drugs and Clinical Trials Rules, 2019: the consent of vulnerable participants in trials of a new chemical or molecular entity is recorded on audio and video; for anti-HIV and anti-leprosy drugs, audio only. The recording is kept by the investigator.">
        <div className="space-y-1 text-sm">
          <label className="flex gap-2"><input type="checkbox" checked={i.newChemicalEntity} onChange={(e) => set('newChemicalEntity', e.target.checked)} />The study medicine is a new chemical or molecular entity</label>
          <label className="flex gap-2"><input type="checkbox" checked={i.hivOrLeprosy} onChange={(e) => set('hivOrLeprosy', e.target.checked)} />It is an anti-HIV or anti-leprosy drug</label>
          <label className="flex gap-2"><input type="checkbox" checked={i.vulnerable} onChange={(e) => set('vulnerable', e.target.checked)} />This participant is vulnerable (for example cannot read, economically or socially disadvantaged, in an institution, or unable to decide freely)</label>
        </div>
        <p className="text-sm mt-2"><Pill tone={r.need === 'not required' ? 'green' : 'amber'}>{r.need === 'audio-video' ? 'Audio and video recording' : r.need === 'audio' ? 'Audio recording only' : 'Recording not required'}</Pill> {r.why}</p>
      </Panel>
      <Panel title="Other points for Indian sites">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>The form must be in a language the participant understands; ethics committees usually ask for the translation and a back-translation.</li>
          <li>If the participant or representative cannot read, an impartial witness attends the whole discussion and signs; the participant may give a thumb impression.</li>
          <li>The form states the compensation and free medical management for trial-related injury, disability or death (NDCT Rules, Chapter VI), and prorated payment.</li>
          <li>Mature minors and adolescents sign a separate written assent form.</li>
        </ul>
      </Panel>
    </div>
  )
}

export function Export() {
  const { p } = useStore()
  const f = p!.facts, base = (f.protocolId || 'study').replace(/[^\w.-]+/g, '_')
  const footer = 'Drafted in the Plain Language Lab for training. Fictional study; not for use with real participants.'
  return (
    <div className="space-y-4">
      <Panel title="Documents" sub="Word for editing; HTML to read or print. Gaps to write are highlighted.">
        <table className="text-sm w-full"><tbody>{DOC_TYPES.map((d) => { const secs = sectionsOf(p!, d.id), title = `${f.acronym || f.protocolId}: ${d.name.toLowerCase()} (version ${p!.docs[d.id].version})`
          return <tr key={d.id} className="border-t border-lab-line/60"><td className="py-2">{d.name}</td><td className="text-right space-x-1"><Btn tone="grey" onClick={async () => { const { sectionsDocxBlob } = await import('../domain/docx'); download(`${base}_${d.id}.docx`, await sectionsDocxBlob(title, secs, footer)) }}>Word</Btn><Btn tone="grey" onClick={async () => { const { sectionsHtml } = await import('../domain/docx'); download(`${base}_${d.id}.html`, sectionsHtml(title, secs, footer), 'text/html') }}>HTML</Btn></td></tr> })}</tbody></table>
      </Panel>
      <Panel title="Leaflet and lay summary" sub="The rewritten leaflet (with the Labelling Workbench’s headings) and the lay summary.">
        <table className="text-sm w-full"><tbody>{[
          ...(p!.leaflet ? [{ id: 'leaflet', name: `${p!.leaflet.file.product.brand}: ${p!.leaflet.file.title}`, secs: sectionsWith(p!.leaflet.file, p!.leaflet.edits).filter((x) => x.text.trim()).map((x) => ({ id: x.num, heading: x.heading, text: x.text })) }] : []),
          { id: 'lay-summary', name: 'Summary of results for laypersons', secs: laySections(p!) },
        ].map((d) => <tr key={d.id} className="border-t border-lab-line/60"><td className="py-2">{d.name}</td><td className="text-right space-x-1"><Btn tone="grey" onClick={async () => { const { sectionsDocxBlob } = await import('../domain/docx'); download(`${base}_${d.id}.docx`, await sectionsDocxBlob(d.name, d.secs, footer)) }}>Word</Btn><Btn tone="grey" onClick={async () => { const { sectionsHtml } = await import('../domain/docx'); download(`${base}_${d.id}.html`, sectionsHtml(d.name, d.secs, footer), 'text/html') }}>HTML</Btn></td></tr>)}</tbody></table>
      </Panel>
      <Panel title="Project file" sub="Everything in this project as one JSON file, to keep or to open in another browser.">
        <Btn onClick={() => download(`${base}_plain-language-lab.json`, projectFile(p!))}>Download the project file</Btn>
      </Panel>
    </div>
  )
}
