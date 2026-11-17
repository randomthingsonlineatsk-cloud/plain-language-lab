// Risk tools: absolute and relative risk, number needed to treat, natural frequencies, EU frequency
// terms, and an icon array to download.
import { useState } from 'react'
import { riskNumbers, naturalFrequency, frequencyTerm, iconArray, numberChecks, EU_FREQUENCY } from '../domain/risk'
import { download } from '../domain/store'
import { Btn, Panel, Pill, inputCls } from './ui'

export default function Risk() {
  const [c, setC] = useState(8), [t, setT] = useState(4), [d, setD] = useState(100)
  const [pct, setPct] = useState(3)
  const [text, setText] = useState('Lumiravostat halved the risk of a flare. Headache was common (12%). The result was statistically significant (p<0.001).')
  const r = riskNumbers({ control: c, treated: t, denom: d })
  const N = (label: string, v: number, set: (n: number) => void) => <label className="text-xs w-36">{label}<input type="number" min={0} className={inputCls} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
  return (
    <div className="space-y-4">
      <Panel title="Absolute and relative risk" sub="The same result told three ways. A relative change alone exaggerates; give the absolute numbers.">
        <div className="flex flex-wrap gap-3">{N('Without treatment (events)', c, setC)}{N('With treatment (events)', t, setT)}{N('Out of', d, setD)}</div>
        <ul className="text-sm space-y-1 mt-2">
          <li><Pill tone="red">Relative only</Pill> “The medicine {r.relative}.”</li>
          <li><Pill tone="green">Absolute</Pill> “{r.absolute.charAt(0).toUpperCase() + r.absolute.slice(1)}: {r.difference}.”</li>
          <li><Pill>NNT</Pill> {r.nntText}.</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-2">
          {[['Without treatment', c], ['With treatment', t]].map(([label, n]) => <figure key={label as string} className="bg-white rounded p-2 max-w-xs"><div dangerouslySetInnerHTML={{ __html: iconArray(Math.round(((n as number) / d) * (d >= 1000 ? 1000 : 100)), d >= 1000 ? 1000 : 100) }} className="[&_svg]:w-full [&_svg]:h-auto" /><figcaption className="text-xs text-black mt-1">{label}: {n} in {d.toLocaleString('en-US')}</figcaption></figure>)}
        </div>
        <Btn tone="grey" onClick={() => download('icon-array.svg', iconArray(Math.round((t / d) * 100), 100, { label: `${t} in ${d}` }), 'image/svg+xml')}>Download the “with treatment” icon array (SVG)</Btn>
      </Panel>
      <Panel title="Natural frequency and EU frequency term" sub="Side-effect frequencies in leaflets use fixed EU terms.">
        {N('Percentage of people', pct, setPct)}
        <p className="text-sm mt-2">{pct}% is <b>{naturalFrequency(pct)}</b>: <b>{frequencyTerm(pct).term}</b> ({frequencyTerm(pct).words}).</p>
        <table className="text-xs mt-2"><tbody>{EU_FREQUENCY.map((f) => <tr key={f.term} className="border-t border-lab-line/60"><td className="pr-4 py-0.5 font-semibold">{f.term}</td><td>{f.words}</td></tr>)}</tbody></table>
      </Panel>
      <Panel title="Check the numbers in a text" sub="Relative risk without absolute (PL-N02), percentages without a natural frequency (PL-N01), percentages of percentages and mixed denominators (PL-N03), a frequency word that does not match (PL-N04), p-values in lay text (PL-N05).">
        <textarea aria-label="Text to check" className="w-full min-h-24 rounded-md border border-lab-line bg-lab-panel-strong p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
        <ul className="text-xs space-y-1">{numberChecks(text).map((n) => <li key={n.id}><Pill tone="amber">{n.rule}</Pill> <span className="text-lab-text-muted">“{n.text.slice(0, 80)}”</span> {n.fix}</li>)}{!numberChecks(text).length && <li className="text-lab-cdsco">No number problems found.</li>}</ul>
      </Panel>
    </div>
  )
}
