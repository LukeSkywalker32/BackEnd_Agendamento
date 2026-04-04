export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')

  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) {
    return false
  }

  const digits = clean.split('').map(Number)

  const calculateDigit = (slice: number[], factor: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += slice[i] * (factor - i)
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstDigit = calculateDigit(digits.slice(0, 9), 10)
  const secondDigit = calculateDigit(digits.slice(0, 10), 11)

  return firstDigit === digits[9] && secondDigit === digits[10]
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}
