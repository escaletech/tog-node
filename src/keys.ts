export const namespaceChangedKey = 'tog3:namespace-changed'

export function namespaceKey(namespace: string): string {
  return `tog3:flags:${namespace}`
}
