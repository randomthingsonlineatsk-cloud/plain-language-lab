import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './state'
import { NavCtx, type View } from './nav'
import { Btn, Modal, Pill } from './views/ui'
import Home from './views/Home'
import Learn from './views/Learn'
import Drills from './views/Drills'
import Analyzer from './views/Readability'
import Dictionary from './views/Dictionary'
import Documents from './views/Documents'
import { Overview, India, Export } from './views/Study'
import { Leaflet, UserTest } from './views/Leaflet'
import Lay from './views/Lay'
import Risk from './views/Risk'
import Skills from './views/Skills'
import Classroom from './views/Classroom'
import Versions from './views/Versions'
import Translations from './views/Translations'
import EConsent from './views/EConsent'
import Literacy from './views/Literacy'
import PatientPanel from './views/PatientPanel'
import EasyRead from './views/EasyRead'
import Pls from './views/Pls'
import Access from './views/Access'
import MissionBar from './views/Missions'
import type { DocType } from './domain/types'

type Page = 'home' | 'learn' | 'drills' | 'analyzer' | 'risk' | 'dictionary' | 'skills' | 'classroom'
const PAGES: { id: Page; label: string; key: string }[] = [{ id: 'home', label: 'Studies and missions', key: 'h' }, { id: 'learn', label: 'Learn', key: 'l' }, { id: 'drills', label: 'Rewrite drills', key: 'r' }, { id: 'analyzer', label: 'Readability', key: 'a' }, { id: 'risk', label: 'Risk and numbers', key: 'n' }, { id: 'dictionary', label: 'Jargon dictionary', key: 'j' }, { id: 'skills', label: 'Writing skills', key: 'w' }, { id: 'classroom', label: 'Classroom', key: 'k' }]
const VIEWS: { id: View; label: string; key: string }[] = [{ id: 'overview', label: 'Overview', key: 'o' }, { id: 'documents', label: 'Consent and assent', key: 'c' }, { id: 'india', label: 'India', key: 'i' }, { id: 'leaflet', label: 'Leaflet', key: 'p' }, { id: 'usertest', label: 'User test', key: 'u' }, { id: 'lay', label: 'Lay summary', key: 's' }, { id: 'translations', label: 'Translations', key: 't' }, { id: 'versions', label: 'Versions and ethics', key: 'v' }, { id: 'econsent', label: 'eConsent', key: 'e' }, { id: 'literacy', label: 'Health literacy', key: 'q' }, { id: 'panel', label: 'Patient panel', key: 'b' }, { id: 'easyread', label: 'Easy Read and audio', key: 'y' }, { id: 'access', label: 'Language access', key: 'd' }, { id: 'pls', label: 'Publication summary', key: 'f' }, { id: 'export', label: 'Export', key: 'x' }]
const SHORTCUTS: [string, string][] = [['?', 'Show these shortcuts'], ['g then h / l / r / a / n / j / w / k', 'Studies and missions, Learn, Rewrite drills, Readability, Risk and numbers, Jargon dictionary, Writing skills, Classroom'], ['g then o / c / i / p / u / s / x', 'In a study: Overview, Consent and assent, India, Leaflet, User test, Lay summary, Translations (t), Versions and ethics (v), eConsent (e), Health literacy (q), Patient panel (b), Easy Read and audio (y), Language access (d), Publication summary (f), Export'], ['Ctrl or ⌘ + S', 'Work is saved as you type; this confirms it'], ['Esc', 'Close a dialog']]
const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

function Shell() {
  const { p, close, error, setError, saved } = useStore()
  const [page, setPage] = useState<Page>('home')
  const [nav, setNav] = useState<{ view: View; arg?: string }>({ view: 'overview' })
  const [keys, setKeys] = useState(false), [toast, setToast] = useState(''), [online, setOnline] = useState(() => navigator.onLine)
  const gAt = useRef(0)
  const go = (view: View, arg?: string) => { setNav({ view, arg }); window.scrollTo(0, 0) }
  useEffect(() => {
    const on = () => setOnline(navigator.onLine)
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); setToast('Your work is saved automatically in this browser.'); setTimeout(() => setToast(''), 2500); return }
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
      if (e.key === '?') { e.preventDefault(); setKeys(true); return }
      if (e.key === 'g') { gAt.current = Date.now(); return }
      if (Date.now() - gAt.current < 1200) {
        gAt.current = 0
        const v = VIEWS.find((x) => x.key === e.key), pg = PAGES.find((x) => x.key === e.key)
        if (p && v) { e.preventDefault(); go(v.id) } else if (pg) { e.preventDefault(); if (p) close(); setPage(pg.id) }
      }
    }
    window.addEventListener('keydown', onKey); window.addEventListener('online', on); window.addEventListener('offline', on)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('online', on); window.removeEventListener('offline', on) }
  })
  const tab = (active: boolean) => `px-3 py-1.5 font-mono text-xs border-b-2 ${active ? 'border-lab-fda text-lab-fda' : 'border-transparent text-lab-text-muted hover:text-lab-text'}`
  return (
    <NavCtx.Provider value={{ ...nav, go }}>
      <div className="min-h-screen bg-lab-bg text-lab-text flex flex-col">
        <header className="border-b border-lab-line bg-lab-panel/90 sticky top-0 z-40 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="mr-auto">
              <button className="font-mono text-sm text-lab-fda text-left" onClick={() => { close(); setPage('home') }}>Plain Language Lab</button>
              <p className="text-[11px] text-lab-text-muted">{p ? `${p.name}` : 'Write consent forms and patient texts people can read · training only'}</p>
            </div>
            {p ? <div className="flex items-center gap-2">{p.mission && <Pill tone="purple">{`Mission ${p.mission.id}`}</Pill>}<Btn tone="grey" onClick={() => { close(); setPage('home') }}>All studies</Btn><button className="text-xs text-lab-text-muted underline" onClick={() => setKeys(true)}>Shortcuts</button></div>
              : <nav className="flex flex-wrap gap-1" aria-label="Main">{PAGES.map((x) => <button key={x.id} onClick={() => setPage(x.id)} aria-current={page === x.id ? 'page' : undefined} className={tab(page === x.id)}>{x.label}</button>)}<button className="px-2 text-xs text-lab-text-muted underline" onClick={() => setKeys(true)}>Shortcuts</button></nav>}
          </div>
          {p && <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto md:flex-wrap md:overflow-visible" aria-label="Study">{VIEWS.map((v) => <button key={v.id} onClick={() => go(v.id)} ref={nav.view === v.id ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) : undefined} aria-current={nav.view === v.id ? 'page' : undefined} className={`${tab(nav.view === v.id)} whitespace-nowrap shrink-0`}>{v.label}</button>)}</nav>}
        </header>
        {error && <div role="alert" className="max-w-7xl mx-auto w-full px-4 pt-3"><div className="rounded border border-lab-red/60 bg-lab-red-soft px-3 py-2 text-sm text-lab-red flex justify-between gap-2"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss">✕</button></div></div>}
        <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1">
          {p ? <><MissionBar />{nav.view === 'overview' ? <Overview /> : nav.view === 'documents' ? <Documents key={nav.arg ?? 'consent'} initial={(nav.arg as DocType) ?? 'consent'} /> : nav.view === 'india' ? <India /> : nav.view === 'leaflet' ? <Leaflet /> : nav.view === 'usertest' ? <UserTest /> : nav.view === 'lay' ? <Lay /> : nav.view === 'versions' ? <Versions /> : nav.view === 'translations' ? <Translations /> : nav.view === 'econsent' ? <EConsent /> : nav.view === 'literacy' ? <Literacy /> : nav.view === 'panel' ? <PatientPanel /> : nav.view === 'easyread' ? <EasyRead /> : nav.view === 'pls' ? <Pls /> : nav.view === 'access' ? <Access /> : <Export />}</>
            : page === 'learn' ? <Learn /> : page === 'drills' ? <Drills /> : page === 'analyzer' ? <Analyzer /> : page === 'risk' ? <Risk /> : page === 'dictionary' ? <Dictionary /> : page === 'skills' ? <Skills /> : page === 'classroom' ? <Classroom /> : <Home onOpen={() => go(p ? 'overview' : 'overview')} />}
        </main>
        {toast && <div role="status" className="fixed bottom-4 right-4 z-50 rounded border border-lab-line bg-lab-panel px-3 py-2 text-sm shadow">{toast}</div>}
        {keys && <Modal title="Keyboard shortcuts" onClose={() => setKeys(false)}><table className="text-sm w-full"><tbody>{SHORTCUTS.map(([k, w]) => <tr key={k} className="border-t border-lab-line/60"><td className="py-1 pr-4 font-mono whitespace-nowrap">{k}</td><td>{w}</td></tr>)}</tbody></table></Modal>}
        <footer className="border-t border-lab-line text-[11px] text-lab-text-muted">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between gap-2">
            <span>Built by Khan Gulrez Shagufa Fazal Ahmed · Apache-2.0</span>
            <span>Training only. Fictional studies, products and sponsors; not a validated system. Saved in this browser{saved ? ` · saved ${saved}` : ''}. {online ? 'Works offline after the first visit.' : 'Offline: everything except the Classroom still works.'}</span>
          </div>
        </footer>
      </div>
    </NavCtx.Provider>
  )
}

export default function App() { return <StoreProvider><Shell /></StoreProvider> }
