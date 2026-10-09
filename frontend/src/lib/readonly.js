import { createContext, useContext } from 'react'

export const ReadonlyContext = createContext(false)
export const useReadonly = () => useContext(ReadonlyContext)

export function isReadonlyUrl() {
  return new URLSearchParams(window.location.search).get('readonly') === 'true'
}
