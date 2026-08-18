import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

const client = env.chatIA.apiKey ? new Anthropic({ apiKey: env.chatIA.apiKey }) : null;

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    codigo: {
      type: 'string',
      description:
        'SOLO el valor que sigue a "CODIGO:" en el catalogo, sin el prefijo. Ej: si el catalogo dice "CODIGO:494_8" el codigo es "494_8", NUNCA "CODIGO:494_8".',
    },
    articulo: { type: 'string', description: 'Descripcion del producto tal cual aparece en el catalogo' },
    unidadMedida: {
      type: 'string',
      description: 'SOLO el valor que sigue a "UM:" en el catalogo, sin el prefijo. Ej: si el catalogo dice "UM:NIU" la unidadMedida es "NIU", NUNCA "UM:NIU".',
    },
    tipo: { type: 'string', enum: ['plan', 'equipo'], description: 'plan = licencia de sistema, equipo = hardware fisico' },
    cantidad: { type: 'number' },
    precioUnitario: { type: 'number', description: 'Precio unitario tal cual aparece en el catalogo, sin modificar' },
  },
  required: ['codigo', 'articulo', 'unidadMedida', 'tipo', 'cantidad', 'precioUnitario'],
  additionalProperties: false,
};

// Claude solo decide QUE items van en cada alternativa y sus cantidades (tomando
// codigo/UM tal cual del catalogo). Los montos (precioTotal, IGV, total, monto en
// letras) se calculan en nuestro codigo, no se le confia la aritmetica a la IA.
const ALTERNATIVAS_SCHEMA = {
  type: 'object',
  properties: {
    alternativas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre corto de la alternativa, ej: "Opcion economica", "Opcion recomendada", "Opcion premium"' },
          items: { type: 'array', items: ITEM_SCHEMA },
          notas: { type: 'string', description: 'Supuestos hechos o informacion que el vendedor deberia confirmar para esta alternativa' },
        },
        required: ['nombre', 'items', 'notas'],
        additionalProperties: false,
      },
    },
  },
  required: ['alternativas'],
  additionalProperties: false,
};

export async function elegirAlternativasCotizacion(promptUsuario, catalogoTexto) {
  if (!client) {
    const error = new Error('CHATIA_API_KEY no configurada');
    error.code = 'CHATIA_NOT_CONFIGURED';
    throw error;
  }

  const systemTexto = `Eres un asistente que ayuda a armar cotizaciones para vendedores de apiworking.pe.
Tu tarea es: leer lo que el vendedor escribe sobre lo que el cliente quiere, y devolver de 1 a 3 ALTERNATIVAS de cotizacion usando el catalogo de abajo, para que el vendedor tenga opciones que presentarle al cliente.

Reglas:
- Si hay mas de una forma razonable de resolver el pedido (distintos modelos/marcas de equipo, distintas gamas de precio, distinta periodicidad de plan), da 2 o 3 alternativas claramente distintas entre si (por ejemplo "Opcion economica" / "Opcion recomendada" / "Opcion premium").
- Si el pedido es muy especifico y sin ambiguedad (un solo producto exacto, sin variantes posibles), da 1 sola alternativa.
- Cada alternativa debe ser un conjunto de items completo y coherente por si solo (no repitas exactamente los mismos items en dos alternativas).
- Usa SOLO productos que existan en el catalogo (planes o equipos). Si el vendedor pide algo que no esta en el catalogo, no lo inventes: dejalo fuera de "items" y explicalo en "notas" de esa alternativa.
- Copia el codigo, articulo, unidadMedida y precioUnitario EXACTAMENTE como aparecen en el catalogo para cada item que elijas. No inventes ni modifiques precios.
- Marca cada item con "tipo": "plan" para licencias de sistema, "equipo" para hardware fisico.
- Si el vendedor no especifica cantidad, asume 1 y dilo en "notas".
- No agregues productos que el vendedor no pidio.
- No calcules totales ni IGV, eso no es tu trabajo aqui.

${catalogoTexto}`;

  const response = await client.messages.create({
    model: env.chatIA.model,
    max_tokens: 4096,
    system: [{ type: 'text', text: systemTexto, cache_control: { type: 'ephemeral' } }],
    output_config: {
      format: { type: 'json_schema', schema: ALTERNATIVAS_SCHEMA },
    },
    messages: [{ role: 'user', content: promptUsuario }],
  });

  if (response.stop_reason === 'refusal') {
    const error = new Error('Claude no pudo procesar este pedido');
    error.code = 'CHATIA_REFUSAL';
    throw error;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('Claude no devolvio una respuesta de texto');
  }
  return JSON.parse(textBlock.text);
}
