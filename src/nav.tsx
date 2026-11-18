import { createContext, useContext } from 'react'
export type View = 'overview' | 'documents' | 'india' | 'leaflet' | 'usertest' | 'lay' | 'versions' | 'translations' | 'econsent' | 'literacy' | 'panel' | 'easyread' | 'pls' | 'access' | 'export'
export interface Nav { view: View; arg?: string; go: (v: View, arg?: string) => void }
export const NavCtx = createContext<Nav>({ view: 'overview', go: () => {} })
export const useNav = () => useContext(NavCtx)
