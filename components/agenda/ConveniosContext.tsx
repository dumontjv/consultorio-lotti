'use client'

import { createContext, useContext } from 'react'
import type { ConvenioComRegras } from '@/lib/convenios/regras'

const ConveniosContext = createContext<ConvenioComRegras[]>([])

export const ConveniosProvider = ConveniosContext.Provider

export function useConvenios() {
  return useContext(ConveniosContext)
}
