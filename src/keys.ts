export function flagKey(namespace: string, name: string): string {
  return `tog2:flag:${namespace}:${name}`
}

export function sessionKey(namespace: string, id: string): string {
  return `tog2:session:${namespace}:${id}`
}

export function namespaceKey(namespace: string): string {
  return `tog3:flags:${namespace}`
}
