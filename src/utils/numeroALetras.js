// Adaptado de NumerosALetras.js (Daniel M. Spiridione, MIT License) para el
// formato de cotizacion peruano: "DIEZ MIL OCHOCIENTOS OCHENTA Y NUEVE CON 00/100 SOLES".

function unidades(num) {
  const palabras = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  return palabras[num] ?? '';
}

function decenasY(strSin, numUnidades) {
  return numUnidades > 0 ? `${strSin} Y ${unidades(numUnidades)}` : strSin;
}

function decenas(num) {
  const numDecena = Math.floor(num / 10);
  const numUnidad = num - numDecena * 10;

  switch (numDecena) {
    case 1:
      switch (numUnidad) {
        case 0: return 'DIEZ';
        case 1: return 'ONCE';
        case 2: return 'DOCE';
        case 3: return 'TRECE';
        case 4: return 'CATORCE';
        case 5: return 'QUINCE';
        default: return `DIECI${unidades(numUnidad)}`;
      }
    case 2:
      return numUnidad === 0 ? 'VEINTE' : `VEINTI${unidades(numUnidad)}`;
    case 3: return decenasY('TREINTA', numUnidad);
    case 4: return decenasY('CUARENTA', numUnidad);
    case 5: return decenasY('CINCUENTA', numUnidad);
    case 6: return decenasY('SESENTA', numUnidad);
    case 7: return decenasY('SETENTA', numUnidad);
    case 8: return decenasY('OCHENTA', numUnidad);
    case 9: return decenasY('NOVENTA', numUnidad);
    case 0: return unidades(numUnidad);
    default: return '';
  }
}

function centenas(num) {
  const numCentenas = Math.floor(num / 100);
  const numDecenas = num - numCentenas * 100;

  switch (numCentenas) {
    case 1: return numDecenas > 0 ? `CIENTO ${decenas(numDecenas)}` : 'CIEN';
    case 2: return `DOSCIENTOS ${decenas(numDecenas)}`.trim();
    case 3: return `TRESCIENTOS ${decenas(numDecenas)}`.trim();
    case 4: return `CUATROCIENTOS ${decenas(numDecenas)}`.trim();
    case 5: return `QUINIENTOS ${decenas(numDecenas)}`.trim();
    case 6: return `SEISCIENTOS ${decenas(numDecenas)}`.trim();
    case 7: return `SETECIENTOS ${decenas(numDecenas)}`.trim();
    case 8: return `OCHOCIENTOS ${decenas(numDecenas)}`.trim();
    case 9: return `NOVECIENTOS ${decenas(numDecenas)}`.trim();
    default: return decenas(numDecenas);
  }
}

function seccion(num, divisor, strSingular, strPlural) {
  const numCientos = Math.floor(num / divisor);
  if (numCientos === 0) return '';
  return numCientos > 1 ? `${centenas(numCientos)} ${strPlural}` : strSingular;
}

function miles(num) {
  const divisor = 1000;
  const numResto = num % divisor;
  const strMiles = seccion(num, divisor, 'MIL', 'MIL');
  const strCentenas = centenas(numResto);
  return strMiles === '' ? strCentenas : `${strMiles} ${strCentenas}`.trim();
}

function millones(num) {
  const divisor = 1000000;
  const numResto = num % divisor;
  const strMillones = seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
  const strMiles = miles(numResto);
  return strMillones === '' ? strMiles : `${strMillones} ${strMiles}`.trim();
}

/** monto: numero (ej. 10889.00) -> "DIEZ MIL OCHOCIENTOS OCHENTA Y NUEVE CON 00/100 SOLES" */
export function numeroALetras(monto) {
  const enteros = Math.floor(monto);
  const centavos = Math.round((monto - enteros) * 100);
  const centavosTexto = String(centavos).padStart(2, '0');

  const enterosTexto = enteros === 0 ? 'CERO' : millones(enteros);

  return `${enterosTexto} CON ${centavosTexto}/100 SOLES`;
}
