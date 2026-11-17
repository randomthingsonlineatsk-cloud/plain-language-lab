import { useState } from 'react'
import { JARGON_TERMS } from '../shared/jargon'
import { Panel, inputCls } from './ui'

export default function Dictionary() {
  const [q, setQ] = useState('')
  const rows = JARGON_TERMS.filter((t) => !q || `${t.term} ${t.plain}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Panel title={`Jargon dictionary (${JARGON_TERMS.length} terms)`} sub="Plain alternatives for words a lay reader may not know. The same list checks the Protocol Builder’s lay summaries. Written for these apps; not a published word list.">
      <input aria-label="Search the dictionary" className={inputCls} placeholder="Search, for example “hepatic” or “blood”" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto"><table className="text-sm w-full"><thead><tr className="text-left text-xs text-lab-text-muted"><th className="py-1">Term</th><th>Plain words</th><th>When it may stay</th></tr></thead>
        <tbody>{rows.map((t) => <tr key={t.term + t.plain} className="border-t border-lab-line/60"><td className="py-1 pr-3 font-mono text-xs">{t.term}</td><td className="pr-3">{t.plain}</td><td className="text-xs text-lab-text-muted">{t.keep ?? ''}</td></tr>)}</tbody></table></div>
    </Panel>
  )
}
