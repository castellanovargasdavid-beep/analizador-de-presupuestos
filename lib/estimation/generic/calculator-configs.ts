/**
 * Configuración declarativa de las calculadoras genéricas — una entrada
 * por servicio, consumida por `GenericWizard.tsx`. Las claves de cada
 * campo (`key`) tienen que coincidir exactamente con las condiciones de
 * `pricing_factors.condition` y `perUnitOfQuantity` sembradas para ese
 * servicio (ver `db/seed-multi-service-calculators.ts`) — si no coinciden,
 * el factor correspondiente simplemente no se aplica nunca (el motor no
 * lanza error por una clave desconocida, así que hay un test de cordura
 * que compara configs contra los factores reales, ver
 * `lib/estimation/generic/calculator-configs.test.ts`).
 *
 * Deliberadamente simple: 1-3 campos por servicio, nunca más de los
 * necesarios para reflejar lo que la investigación de mercado
 * (`docs/09-investigacion-precios-multi-servicio.md`) identificó como
 * factor real de precio — "no construyas un modelo excesivamente
 * complejo si los datos no lo justifican".
 */

export interface SelectFieldOption {
  value: string;
  title: string;
  description?: string;
}

export interface SelectFieldConfig {
  kind: "select";
  key: string;
  label: string;
  hint?: string;
  options: SelectFieldOption[];
}

export interface QuantityFieldConfig {
  kind: "quantity";
  key: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  defaultValue: number;
}

export interface FlagFieldConfig {
  kind: "flag";
  key: string;
  label: string;
  hint?: string;
}

export type CalculatorFieldConfig = SelectFieldConfig | QuantityFieldConfig | FlagFieldConfig;

export interface CalculatorConfig {
  categorySlug: string;
  serviceSlug: string;
  serviceName: string;
  /** Frase corta bajo el título del paso 1. */
  intro: string;
  fields: CalculatorFieldConfig[];
}

export const CALCULATOR_CONFIGS: CalculatorConfig[] = [
  {
    categorySlug: "instalaciones",
    serviceSlug: "cambiar-un-grifo",
    serviceName: "Cambiar un grifo",
    intro: "Cuéntanos qué tipo de grifo necesitas cambiar.",
    fields: [
      {
        kind: "select",
        key: "tipoGrifo",
        label: "¿Qué grifo es?",
        options: [
          { value: "fregadero_lavabo", title: "Grifo de fregadero o lavabo", description: "Monomando estándar" },
          { value: "ducha_banera", title: "Grifo de ducha o bañera", description: "Incluye termostáticos" },
        ],
      },
      {
        kind: "flag",
        key: "requiereAdaptacion",
        label: "Necesito adaptar la tubería o un pequeño trabajo de albañilería",
        hint: "Por ejemplo, cambiar de posición el grifo o repicar un poco de alicatado.",
      },
    ],
  },
  {
    categorySlug: "exterior-y-mantenimiento",
    serviceSlug: "cambiar-una-cerradura",
    serviceName: "Cambiar una cerradura",
    intro: "El nivel de seguridad es lo que más cambia el precio.",
    fields: [
      {
        kind: "select",
        key: "nivelSeguridad",
        label: "¿Qué tipo de cerradura quieres?",
        options: [
          { value: "estandar", title: "Estándar", description: "Cerradura normal, sin refuerzo especial" },
          { value: "seguridad", title: "Seguridad / blindada", description: "Mayor resistencia a la manipulación" },
          { value: "electronica", title: "Electrónica", description: "Con código, tarjeta o app" },
        ],
      },
      {
        kind: "flag",
        key: "urgente",
        label: "Lo necesito hoy o fuera de horario habitual",
        hint: "Suele llevar un recargo por urgencia.",
      },
    ],
  },
  {
    categorySlug: "reformas",
    serviceSlug: "pintar-una-habitacion",
    serviceName: "Pintar una habitación",
    intro: "Con los metros cuadrados de la habitación es suficiente para una primera referencia.",
    fields: [
      {
        kind: "quantity",
        key: "m2",
        label: "Metros cuadrados de la habitación",
        min: 4,
        max: 60,
        step: 1,
        suffix: "m²",
        defaultValue: 12,
      },
      {
        kind: "flag",
        key: "quitarGotele",
        label: "Hay que quitar gotelé o alisar mucho las paredes antes de pintar",
        hint: "Esto sube el precio de forma notable.",
      },
    ],
  },
  {
    categorySlug: "reformas",
    serviceSlug: "pintar-una-vivienda",
    serviceName: "Pintar una vivienda completa",
    intro: "Con los metros cuadrados totales de la vivienda tenemos suficiente para empezar.",
    fields: [
      {
        kind: "quantity",
        key: "m2",
        label: "Metros cuadrados totales de la vivienda",
        min: 20,
        max: 300,
        step: 5,
        suffix: "m²",
        defaultValue: 80,
      },
      {
        kind: "flag",
        key: "requierePreparacionPrevia",
        label: "Las paredes tienen humedad, grietas o desconchones que tratar antes",
      },
    ],
  },
  {
    categorySlug: "instalaciones",
    serviceSlug: "anadir-enchufes",
    serviceName: "Añadir enchufes",
    intro: "El precio depende sobre todo de si hay que tirar cable nuevo.",
    fields: [
      {
        kind: "quantity",
        key: "numEnchufes",
        label: "¿Cuántos enchufes nuevos necesitas?",
        min: 1,
        max: 15,
        step: 1,
        suffix: "enchufes",
        defaultValue: 2,
      },
      {
        kind: "select",
        key: "tipoInstalacion",
        label: "¿Cómo se instalan?",
        options: [
          { value: "mecanismo_simple", title: "Sobre cableado ya existente", description: "Solo el mecanismo, sin obra" },
          { value: "cableado_nuevo", title: "Con cableado nuevo", description: "Hay que tirar cable hasta el punto" },
        ],
      },
    ],
  },
  {
    categorySlug: "instalaciones",
    serviceSlug: "instalar-puntos-de-luz",
    serviceName: "Instalar puntos de luz",
    intro: "El precio depende sobre todo de si hay que abrir rozas para el cableado.",
    fields: [
      {
        kind: "quantity",
        key: "numPuntos",
        label: "¿Cuántos puntos de luz necesitas?",
        min: 1,
        max: 15,
        step: 1,
        suffix: "puntos de luz",
        defaultValue: 2,
      },
      {
        kind: "select",
        key: "tipoInstalacion",
        label: "¿Cómo se instalan?",
        options: [
          { value: "simple", title: "Instalación accesible", description: "Sin abrir rozas ni tocar pared" },
          { value: "con_rozas", title: "Con rozas o cableado nuevo", description: "Hay que abrir pared para el cable" },
        ],
      },
    ],
  },
  {
    categorySlug: "instalaciones",
    serviceSlug: "instalar-un-termo",
    serviceName: "Instalar un termo eléctrico",
    intro: "Incluye la mano de obra y la retirada del termo antiguo si lo hay.",
    fields: [
      {
        kind: "flag",
        key: "capacidadGrande",
        label: "Necesito un termo grande (más de 100 litros)",
        hint: "Para viviendas con varios baños o mucha demanda de agua caliente.",
      },
    ],
  },
  {
    categorySlug: "instalaciones",
    serviceSlug: "reparar-una-fuga",
    serviceName: "Reparar una fuga",
    intro: "Lo que más cambia el precio es si la tubería está a la vista o empotrada.",
    fields: [
      {
        kind: "flag",
        key: "tuberiaEmpotrada",
        label: "La tubería está empotrada en pared o suelo (hay que picar)",
        hint: "Si es visible y accesible, deja esto sin marcar.",
      },
      {
        kind: "flag",
        key: "urgente",
        label: "Es una fuga activa y necesito que venga hoy",
      },
    ],
  },
  {
    categorySlug: "reformas",
    serviceSlug: "alicatar-un-bano",
    serviceName: "Alicatar un baño",
    intro: "Con los metros cuadrados de pared a alicatar es suficiente.",
    fields: [
      {
        kind: "quantity",
        key: "m2",
        label: "Metros cuadrados a alicatar",
        min: 2,
        max: 30,
        step: 1,
        suffix: "m²",
        defaultValue: 8,
      },
      {
        kind: "flag",
        key: "retirarAlicatadoAntiguo",
        label: "Hay que retirar el alicatado viejo antes",
      },
    ],
  },
  {
    categorySlug: "reformas",
    serviceSlug: "levantar-un-tabique",
    serviceName: "Levantar un tabique",
    intro: "El material (pladur o ladrillo) es lo que más cambia el precio por m².",
    fields: [
      {
        kind: "select",
        key: "material",
        label: "¿De qué material?",
        options: [
          { value: "pladur", title: "Pladur", description: "Más rápido, buen aislamiento" },
          { value: "ladrillo", title: "Ladrillo", description: "Obra tradicional" },
        ],
      },
      {
        kind: "quantity",
        key: "m2",
        label: "Metros cuadrados del tabique",
        min: 2,
        max: 40,
        step: 1,
        suffix: "m²",
        defaultValue: 10,
      },
    ],
  },
  {
    categorySlug: "exterior-y-mantenimiento",
    serviceSlug: "instalar-un-armario-a-medida",
    serviceName: "Instalar un armario a medida",
    intro: "El material del frente es el factor que más cambia el precio por metro lineal.",
    fields: [
      {
        kind: "select",
        key: "material",
        label: "¿Qué acabado quieres?",
        options: [
          { value: "laminado", title: "Melamina / laminado", description: "La opción más económica" },
          { value: "mdf_lacado", title: "MDF lacado", description: "Gama media" },
          { value: "madera_maciza", title: "Madera maciza", description: "Gama alta" },
        ],
      },
      {
        kind: "quantity",
        key: "ml",
        label: "Metros lineales de armario",
        min: 0.5,
        max: 8,
        step: 0.5,
        suffix: "metros lineales",
        defaultValue: 2,
      },
    ],
  },
];

export function getCalculatorConfig(categorySlug: string, serviceSlug: string): CalculatorConfig | undefined {
  return CALCULATOR_CONFIGS.find((c) => c.categorySlug === categorySlug && c.serviceSlug === serviceSlug);
}
