// A document as Word or HTML: a title and one heading per section; gaps highlighted in yellow.
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { DocSection } from './types'

const MARK = /(\[(?:To be written|Site to complete):[^\]]*\])/
export function sectionsDocxBlob(title: string, secs: DocSection[], footer = '') {
  const doc = new Document({ creator: 'Plain Language Lab', title, sections: [{ children: [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }),
    ...secs.flatMap((s) => [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(s.heading)] }),
      ...s.text.split('\n').map((t) => new Paragraph({ spacing: { after: 120 }, children: t.split(MARK).filter(Boolean).map((x) => new TextRun({ text: x, highlight: MARK.test(x) ? 'yellow' : undefined })) }))]),
    ...(footer ? [new Paragraph({ children: [new TextRun({ text: footer, italics: true, size: 18 })] })] : []),
  ] }] })
  return Packer.toBlob(doc)
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const sectionsHtml = (title: string, secs: DocSection[], footer = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Georgia,serif;max-width:42em;margin:2em auto;line-height:1.55;font-size:13pt}h1{font-size:1.4em}h2{font-size:1.1em;margin-top:1.4em}p{white-space:pre-wrap}.gap{background:#fff3c4}small{color:#555}</style></head><body><h1>${esc(title)}</h1>${secs.map((s) => `<h2>${esc(s.heading)}</h2><p>${esc(s.text).replace(/(\[(To be written|Site to complete):[^\]]*\])/g, '<span class="gap">$1</span>')}</p>`).join('')}${footer ? `<p><small>${esc(footer)}</small></p>` : ''}</body></html>`
