// Translations: forward, back-translation, reconciliation and certificate, per language version.
import { useState } from 'react'
import { useStore } from '../state'
import { DOC_TYPES, type DocType } from '../domain/types'
import { LANGUAGES, DISCREPANCIES, newTranslation, translationChecks, staleTranslation, glossaryChecks, descriptive, STARTER_GLOSSARY, PRACTICE, type SegStatus, type Discrepancy } from '../domain/translation'
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
  const gl = t ? (p!.glossary?.[t.lang] ?? []) : []
  const issues = t ? [...translationChecks(t, allow), ...glossaryChecks(t, gl, p!.translations)] : []
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
              <label className="text-xs">Translation ({t.langName})<textarea lang={t.lang} className={`${inputCls} min-h-16`} value={s.forward} onChange={(e) => set(i, 'forward', e.target.value)} />{s.forward.trim() && LANGUAGES.find((l) => l.id === t.lang)?.script !== 'Latin' && (() => { const d = descriptive(s.forward); return <span className="block text-[10px] text-lab-text-muted">{d.words} words · {d.wordsPerSentence} a sentence · longest {d.longest} · {d.charsPerWord} letters a word (descriptive only: no validated readability formula for {t.langName})</span> })()}</label>
              <label className="text-xs">Back-translation (English, by a second translator)<textarea className={`${inputCls} min-h-16`} value={s.back} onChange={(e) => set(i, 'back', e.target.value)} /></label>
            </div>
            <div className="grid md:grid-cols-[18rem_1fr] gap-2"><Select aria-label={`Discrepancy in ${s.heading}`} value={s.discrepancy ?? ''} onChange={(e) => set(i, 'discrepancy', e.target.value as Discrepancy)} options={[{ value: '', label: '(reconcile: choose)' }, ...DISCREPANCIES.map((d) => ({ value: d.id, label: d.label }))]} /><input aria-label={`Reconciliation note for ${s.heading}`} className={inputCls} placeholder="Reconciliation note: what the translator must change, or why the back-translation is acceptable" value={s.note} onChange={(e) => set(i, 'note', e.target.value)} /></div>
          </div>))}</div>
        <div className="flex flex-wrap gap-2 items-end text-xs"><label>Translator’s name<input className={inputCls} value={cert.translator} onChange={(e) => setCert({ ...cert, translator: e.target.value })} /></label><label>Date<input type="date" className={inputCls} value={cert.date} onChange={(e) => setCert({ ...cert, date: e.target.value })} /></label>
          <Btn tone="grey" disabled={!cert.translator.trim() || issues.some((x) => x.rule !== 'PL-T03')} onClick={() => act((x) => { x.translations[idx].certificate = { ...cert } })}>Certify the translation</Btn>
          <span className="text-lab-text-muted">Certify once every segment is translated, back-translated and reconciled.</span></div>
      </Panel>}
      {t && <Glossary lang={t.lang} langName={t.langName} />}
      <Practice />
    </div>
  )
}

function Glossary({ lang, langName }: { lang: string; langName: string }) {
  const { p, act } = useStore()
  const [en, setEn] = useState(''), [term, setTerm] = useState('')
  const g = p!.glossary?.[lang] ?? []
  return (
    <Panel title={`Glossary: ${langName}`} sub="The agreed word for each term, used in every document and version. PL-T05 flags a source term whose glossary word is missing; PL-T06 flags a segment that differs from an approved (reviewed) translation of the same English in another document." right={!g.length && STARTER_GLOSSARY[lang] ? <Btn tone="grey" onClick={() => act((x) => { x.glossary ??= {}; x.glossary[lang] = [...STARTER_GLOSSARY[lang]] })}>Load the starter glossary</Btn> : undefined}>
      {g.length > 0 && <table className="text-sm w-full"><thead><tr className="text-left text-xs text-lab-text-muted"><th>English</th><th>{langName}</th><th>Note</th><th /></tr></thead><tbody>{g.map((x, i) => <tr key={i} className="border-t border-lab-line/60"><td>{x.en}</td><td lang={lang}>{x.term}</td><td className="text-xs text-lab-text-muted" lang={lang}>{x.note}</td><td><button className="text-xs text-lab-red underline" onClick={() => act((y) => { y.glossary![lang].splice(i, 1) })}>remove</button></td></tr>)}</tbody></table>}
      <div className="flex flex-wrap gap-2 items-end text-xs"><label>English term<input className={inputCls} value={en} onChange={(e) => setEn(e.target.value)} /></label><label>{langName} term<input lang={lang} className={inputCls} value={term} onChange={(e) => setTerm(e.target.value)} /></label>
        <Btn tone="grey" disabled={!en.trim() || !term.trim()} onClick={() => { act((x) => { x.glossary ??= {}; (x.glossary[lang] ??= []).push({ en: en.trim(), term: term.trim() }) }); setEn(''); setTerm('') }}>Add to the glossary</Btn></div>
      {STARTER_GLOSSARY[lang] && <p className="text-[11px] text-lab-text-muted">The starter glossary was written for this app; a qualified translator should review it before real use.</p>}
    </Panel>
  )
}

function Practice() {
  const langs = Object.keys(PRACTICE)
  const [lang, setLang] = useState(langs[0]), [ans, setAns] = useState<Record<string, Discrepancy>>({})
  const L = LANGUAGES.find((x) => x.id === lang)!
  return (
    <Panel title="Practice: spot the discrepancy" sub="Three short segments per language; one carries a discrepancy. Written for this app with simple everyday sentences; not a validated translation. Hindi practice is mission PL10; Marathi and Tamil are in PL16.">
      <Select aria-label="Practice language" className="max-w-[12rem]" value={lang} onChange={(e) => { setLang(e.target.value); setAns({}) }} options={langs.map((l) => ({ value: l, label: LANGUAGES.find((x) => x.id === l)!.name }))} />
      <div className="space-y-2">{PRACTICE[lang].map((s) => { const a = ans[s.id]; return <div key={s.id} className="rounded border border-lab-line/60 p-2 text-sm space-y-1">
        <p className="text-xs text-lab-text-muted">{s.source}</p><p lang={lang}>{s.forward}</p><p className="text-xs">Back-translation: {s.back}</p>
        <Select aria-label={`Discrepancy in ${L.name} ${s.heading}`} className="max-w-xs" value={a ?? ''} onChange={(e) => setAns({ ...ans, [s.id]: e.target.value as Discrepancy })} options={[{ value: '', label: '(choose)' }, ...DISCREPANCIES.map((d) => ({ value: d.id, label: d.label }))]} />
        {a && <p className={`text-xs ${a === s.answer ? 'text-lab-cdsco' : 'text-lab-amber'}`}><b>{a === s.answer ? 'Right.' : `Not quite: ${DISCREPANCIES.find((d) => d.id === s.answer)!.label}.`}</b> {s.why}</p>}
      </div> })}</div>
    </Panel>
  )
}
