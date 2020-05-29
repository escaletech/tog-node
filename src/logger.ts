export interface Logger {
  error(message: any): void
  info(message: string): void
}

export const defaultLogger = {
  error(message: any) {
    console.error(message)
  },
  info(message: string) {
    console.log(message)
  }
}
