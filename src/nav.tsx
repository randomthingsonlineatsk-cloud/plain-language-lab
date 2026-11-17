import { createContext, useContext } from 'react'
export type View = 'overview' | 'documents' | 'india' | 'export'
export interface Nav { view: View; arg?: string; go: (v: View, arg?: string) => void }
export const NavCtx = createContext<Nav>({ view: 'overview', go: () => {} })
export const useNav = () => useContext(NavCtx)
