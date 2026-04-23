/**
 * Remove caracteres não numéricos do CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
   return cnpj.replace(/\D/g, "");
}

/**
 * Valida CNPJ com algoritmo oficial da Receita Federal
 */
export function isValidCNPJ(cnpj: string): boolean {
   const cleaned = cleanCNPJ(cnpj);

   if (cleaned.length !== 14) return false;

   // Rejeita CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11)
   if (/^(\d)\1{13}$/.test(cleaned)) return false;

   const digits = cleaned.split("").map(Number);

   // Cálculo do primeiro dígito verificador
   const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
   let sum = 0;
   for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights1[i];
   }
   let remainder = sum % 11;
   const firstDigit = remainder < 2 ? 0 : 11 - remainder;

   if (digits[12] !== firstDigit) return false;

   // Cálculo do segundo dígito verificador
   const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
   sum = 0;
   for (let i = 0; i < 13; i++) {
      sum += digits[i] * weights2[i];
   }
   remainder = sum % 11;
   const secondDigit = remainder < 2 ? 0 : 11 - remainder;

   if (digits[13] !== secondDigit) return false;

   return true;
}
