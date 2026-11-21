// Results for the lay summary come from either file:
//   - the TLF Programming Lab's analysis results (ARS reporting event), or
//   - the CSR & Narrative Studio's lay results (csr-studio/lay-results): the same analysis results
//     as the clinical study report uses, carried in the ARS shape, with the CSR tables they come
//     from and whether the report was approved. Keep in step with
//     csr-narrative-studio/src/domain/handoff.ts (layResults, schema 1).
import { readReportingEvent, type LayResults } from '../shared/laysummary'

export const CSR_LAY_FORMAT = 'csr-studio/lay-results'
export interface ReadResults { results: LayResults; source: string; fromCsr: boolean; tables?: { id: string; table: string; title: string }[] }

export function readResultsFile(text: string, fileName: string): ReadResults {
  let j: Record<string, unknown>
  try { j = JSON.parse(text) } catch { throw new Error('This file is not valid JSON.') }
  if (j.format === CSR_LAY_FORMAT) {
    if (Number(j.schema) > 1) throw new Error('These lay results were made by a newer version of the CSR & Narrative Studio.')
    const csr = (j.csr ?? {}) as { version?: number; approved?: boolean; project?: string }
    const results = readReportingEvent(j.reportingEvent as Parameters<typeof readReportingEvent>[0])
    return { results, fromCsr: true, tables: j.tables as ReadResults['tables'],
      source: `CSR & Narrative Studio: ${j.study} clinical study report, version ${csr.version ?? '?'}${csr.approved ? ', approved' : ', not yet approved'} (${fileName})` }
  }
  return { results: readReportingEvent(j as Parameters<typeof readReportingEvent>[0]), source: fileName, fromCsr: false }
}
