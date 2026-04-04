import { isValidCNPJ } from './src/utils/cnpj'

let count = 0;
for (let i = 100000000000; i < 999999999999 && count < 3; i++) {
  const str = String(i).padStart(14, '0')
  if (isValidCNPJ(str)) {
    console.log(str)
    count++
  }
}
