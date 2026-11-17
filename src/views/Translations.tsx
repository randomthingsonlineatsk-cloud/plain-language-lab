// Translations: forward, back-translation, reconciliation and certificate, per language version.
import { useState } from 'react'
import { useStore } from '../state'
import { DOC_TYPES, type DocType } from '../domain/types'
import { LANGUAGES, DISCREPANCIES, newTranslation, translationChecks, staleTranslation, type SegStatus, type Discrepancy } from '../domain/translation'
import { Btn, Panel, Pill, Select, inputCls } from './ui'

const STATUS: SegStatus[] = ['to translate', 'translated', 'back-translated', 'reconciled', 'reviewed']
export default function Translations() {
  const { p, act } = useStore()
  const [sel, setSel] = useState(p!.translations[0]?.id ?? '')
  const [doc, setDoc] = useState<DocType>('consent'), [lang, setLang] = useState('hi')
  const [cert, setCert] = useState({ translator: '', date: new Date().toISOString().slice(0, 10) })
  const t = p!.translations.find((x) => x.id === sel)
  const idx = p!.translations.findIndex((x) => x.id === sel)
  const allow = [p!.facts.product, p!.facts.acronym, p!.facts.protocolId].join(' ').split(/[^A-Za-z0-9-]+/).filter((w) => w.length > 2)
  const issues = t ? translationChecks(t, allow) : []
  const set = (i: number, k: 'forward' | 'back' | 'note' | 'status' | 'discrepancy', v: string) => act((x) => { const s = x.translations[idx].segments[i]; (s as unknown as Record<string, string>)[k] = v; if (k === 'forward' && v && s.status === 'to translate') s.status = 'translated'; if (k === 'back' && v && s.status === 'translated') s.status = 'back-translated' })
  return (
    <div className="space-y-4">
      <Panel title="Translations" sub="Consent must be in a language the participant understands. Translators paste their work here; the app checks numbers, untranslated English and open reconciliation items. No machine translation.">
        <div className="flex flex-wrap gap-2 items-end">
          {p!.translations.map((x) => <Btn key={x.id} tone={x.id === sel ? 'solid' : 'grey'} onClick={() => setSel(x.id)}>{`${x.langName} · ${DOC_TYPES.find((d) => d.id === x.docType)!.name} · from v${x.sourceVersion}`}{staleTranslation(p!, x) ? ' ⚑' : ''}</Btn>)}
        </div>
        <div className="flex flex-wrap gap-2 items-end text-xs">
          <Select aria-label="Document to translate" className="max-w-xs" value={doc} onChange={(e) => setDoc(e.target.value as DocType)} options={DOC_TYPES.map((d) => ({ value: d.id, label: d.name }))} />
          <Select aria-label="Language" className="max-w-[12rem]" value={lang} onChange={(e) => setLang(e.target.value)} options={LANGUAGES.map((l) => ({ value: l.id, label: `${l.name}${l.region === 'IN' ? ' (India)' : l.region === 'EU' ? ' (EU)' : ''}` }))} />
          <Btn onClick={() => { const nt = newTranslation(p!, doc, lang); act((x) => { x.translations.push(nt) }); setSel(nt.id) }}>Start a translation</Btn>
        </div>
      </Panel>
      {t && <Panel title={`${t.langName}: ${DOC_TYPES.find((d) => d.id === t.docType)!.name}, from version ${t.sourceVersion}`} sub={staleTranslation(p!, t) ? 'A newer English version has been issued: update this translation.' : 'Forward translation, independent back-translation, reconciliation of each discrepancy, review.'} right={t.certificate ? <Pill tone="green">{`Certified by ${t.certificate.translator}, ${t.certificate.date}`}</Pill> : undefined}>
        {issues.length > 0 && <ul className="text-xs space-y-0.5">{issues.slice(0, 12).map((i, k) => <li key={k}><Pill tone="amber">{i.rule}</Pill> {i.text}</li>)}{issues.length > 12 && <li className="text-lab-text-muted">and {issues.length - 12} more</li>}</ul>}
        <div className="space-y-3">{t.segments.map((s, i) => (
          <div key={s.id} className="rounded border border-lab-line/60 p-2 space-y-1 text-sm">
            <p className="flex flex-wrap gap-2 items-center"><b>{s.heading}</b><Select aria-label={`Status of ${s.heading}`} className="max-w-[10rem] text-xs" value={s.status} onChange={(e) => set(i, 'status', e.target.value)} options={STATUS.map((x) => ({ value: x, label: x }))} /></p>
            <p className="text-xs text-lab-text-muted">{s.source}</p>
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-xs">Translation ({t.langName})<textarea lang={t.lang} className={`${inputCls} min-h-16`} value={s.forward} onChange={(e) => set(i, 'forward', e.target.value)} /></label>
              <label className="text-xs">Back-translation (English, by a second translator)<textarea className={`${inputCls} min-h-16`} value={s.back} onChange={(e) => set(i, 'back', e.target.value)} /></label>
            </div>
            <div className="grid md:grid-cols-[18rem_1fr] gap-2"><Select aria-label={`Discrepancy in ${s.heading}`} value={s.discrepancy ?? ''} onChange={(e) => set(i, 'discrepancy', e.target.value as Discrepancy)} options={[{ value: '', label: '(reconcile: choose)' }, ...DISCREPANCIES.map((d) => ({ value: d.id, label: d.label }))]} /><input aria-label={`Reconciliation note for ${s.heading}`} className={inputCls} placeholder="Reconciliation note: what the translator must change, or why the back-translation is acceptable" value={s.note} onChange={(e) => set(i, 'note', e.target.value)} /></div>
          </div>))}</div>
        <div className="flex flex-wrap gap-2 items-end text-xs"><label>Translator’s name<input className={inputCls} value={cert.translator} onChange={(e) => setCert({ ...cert, translator: e.target.value })} /></label><label>Date<input type="date" className={inputCls} value={cert.date} onChange={(e) => setCert({ ...cert, date: e.target.value })} /></label>
          <Btn tone="grey" disabled={!cert.translator.trim() || issues.some((x) => x.rule !== 'PL-T03')} onClick={() => act((x) => { x.translations[idx].certificate = { ...cert } })}>Certify the translation</Btn>
          <span className="text-lab-text-muted">Certify once every segment is translated, back-translated and reconciled.</span></div>
      </Panel>}
    </div>
  )
}
