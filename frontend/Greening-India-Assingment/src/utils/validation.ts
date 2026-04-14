const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmailValid = (value: string): boolean => {
  return emailPattern.test(value)
}

export const hasMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min
}
