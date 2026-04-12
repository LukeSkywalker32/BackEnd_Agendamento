export function isValidCNPJ(cnpj: string): boolean {
   const clean = cnpj.replace(/\D/g, "");

   if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) {
      return false;
   }

   const digits = clean.split("").map(Number);

   const calculateDigit = (slice: number[], weights: number[]): number => {
      let sum = 0;
      for (let i = 0; i < slice.length; i++) {
         sum += slice[i] * weights[i];
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
   };

   const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
   const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

   const firstDigit = calculateDigit(digits.slice(0, 12), firstWeights);
   const secondDigit = calculateDigit(digits.slice(0, 13), secondWeights);

   return firstDigit === digits[12] && secondDigit === digits[13];
}

export function formatCNPJ(cnpj: string): string {
   const clean = cnpj.replace(/\D/g, "");
   return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function cleanCNPJ(cnpj: string): string {
   return cnpj.replace(/\D/g, "");
}
