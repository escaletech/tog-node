export interface Logger {
  error(message: any): void
}

export const defaultLogger = {
  error(message: any) {
    console.error(message)
  }
}
