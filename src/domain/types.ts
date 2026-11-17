import type { StudyFacts, DocSection, Region } from '../shared/consent'
import type { LayResults } from '../shared/laysummary'
import type { LeafletFile } from './leaflet'
import type { Question, Round } from './usertest'
export type { StudyFacts, DocSection, Region }

export type DocType = 'consent' | 'representative' | 'assent-7-11' | 'assent-12-17'
export const DOC_TYPES: { id: DocType; name: string; target: number }[] = [
  { id: 'consent', name: 'Adult consent form', target: 8 },
  { id: 'representative', name: 'Representative’s consent form', target: 8 },
  { id: 'assent-12-17', name: 'Written assent, ages 12 to 17', target: 6 },
  { id: 'assent-7-11', name: 'Oral assent script, ages 7 to 11', target: 4 },
]
export interface DocState { edits: Record<string, string>; reviewed: string[]; version: string; versionDate: string }
export interface MissionRun { id: string; startedUtc: string; submittedUtc?: string; answers: Record<string, string>; score?: number; detail?: { label: string; got: number; of: number }[] }

export interface Project {
  id: string; name: string; kind: 'study' | 'mission'
  userId: string; classId: string; createdUtc: string; updatedUtc: string
  studyId: string; facts: StudyFacts
  docs: Record<DocType, DocState>
  regions: Region[]
  targets: Record<string, number>
  india: { newChemicalEntity: boolean; hivOrLeprosy: boolean; vulnerable: boolean }
  leaflet: { key: string; file: LeafletFile; edits: Record<string, string>; questions: Question[]; rounds: Round[] } | null
  lay: { edits: Record<string, string>; results: LayResults | null; source: string }
  mission?: MissionRun
  schema: 1
}

/** Learning progress: drills and quizzes, one record per browser user. */
export interface Progress { id: 'me'; userId: string; classId: string; drills: Record<string, { text: string; score: number; utc: string }>; quizzes: Record<string, { score: number; of: number; utc: string }>; missions: Record<string, { score: number; utc: string }> }
