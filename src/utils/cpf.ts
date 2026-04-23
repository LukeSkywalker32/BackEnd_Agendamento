/**
 * Remove caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string): string {
   return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF com algoritmo oficial da Receita Federal
 */
export function isValidCPF(cpf: string): boolean {
   const cleaned = cleanCPF(cpf);

   if (cleaned.length !== 11) return false;

   // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
   if (/^(\d)\1{10}$/.test(cleaned)) return false;

   const digits = cleaned.split("").map(Number);

   // Primeiro dígito verificador
   let sum = 0;
   for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
   }
   let remainder = (sum * 10) % 11;
   if (remainder === 10) remainder = 0;
   if (digits[9] !== remainder) return false;

   // Segundo dígito verificador
   sum = 0;
   for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
   }
   remainder = (sum * 10) % 11;
   if (remainder === 10) remainder = 0;
   if (digits[10] !== remainder) return false;

   return true;
}
