// Generado por scripts/build-pro-packs.mjs. No editar a mano.
/** Packs Pro (Fase 7b): límites del mapa, países (ISO) y capitales de cada pack */
export interface ProPackMeta { es: string; en: string; bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number }; isos: string[]; capitals: Record<string, { name: string; lat: number; lon: number }> }
export const PRO_PACK_META: Record<'andes' | 'conosur' | 'mexcam' | 'caribe', ProPackMeta> = {
 "andes": {
  "es": "Andes",
  "en": "Andes",
  "bounds": {
   "latMin": -24.3,
   "latMax": 13.6,
   "lonMin": -93,
   "lonMax": -56.1
  },
  "isos": [
   "VE",
   "EC",
   "PE",
   "BO"
  ],
  "capitals": {
   "EC": {
    "name": "Quito",
    "lat": -0.213,
    "lon": -78.502
   },
   "BO": {
    "name": "La Paz",
    "lat": -16.496,
    "lon": -68.1519
   },
   "VE": {
    "name": "Caracas",
    "lat": 10.5029,
    "lon": -66.919
   },
   "PE": {
    "name": "Lima",
    "lat": -12.0461,
    "lon": -77.052
   }
  }
 },
 "conosur": {
  "es": "Cono Sur",
  "en": "Southern Cone",
  "bounds": {
   "latMin": -57.2,
   "latMax": -16,
   "lonMin": -76.6,
   "lonMax": -52.2
  },
  "isos": [
   "CL",
   "AR",
   "UY",
   "PY"
  ],
  "capitals": {
   "UY": {
    "name": "Montevideo",
    "lat": -34.9054,
    "lon": -56.1868
   },
   "PY": {
    "name": "Asunción",
    "lat": -25.2907,
    "lon": -57.6258
   },
   "AR": {
    "name": "Buenos Aires",
    "lat": -34.6107,
    "lon": -58.4325
   },
   "CL": {
    "name": "Santiago",
    "lat": -33.4402,
    "lon": -70.6505
   }
  }
 },
 "mexcam": {
  "es": "México y Centroamérica",
  "en": "Mexico & Central America",
  "bounds": {
   "latMin": 6.2,
   "latMax": 33.7,
   "lonMin": -120,
   "lonMax": -75.5
  },
  "isos": [
   "MX",
   "GT",
   "BZ",
   "HN",
   "SV",
   "NI",
   "CR",
   "PA"
  ],
  "capitals": {
   "HN": {
    "name": "Tegucigalpa",
    "lat": 14.104,
    "lon": -87.2195
   },
   "NI": {
    "name": "Managua",
    "lat": 12.155,
    "lon": -86.2704
   },
   "PA": {
    "name": "Panama City",
    "lat": 8.97,
    "lon": -79.535
   },
   "CR": {
    "name": "San José",
    "lat": 9.9304,
    "lon": -84.0788
   },
   "SV": {
    "name": "San Salvador",
    "lat": 13.7033,
    "lon": -89.2156
   },
   "GT": {
    "name": "Guatemala City",
    "lat": 14.6231,
    "lon": -90.5289
   },
   "BZ": {
    "name": "Belmopan",
    "lat": 17.252,
    "lon": -88.7671
   },
   "MX": {
    "name": "Mexico City",
    "lat": 19.4444,
    "lon": -99.1329
   }
  }
 },
 "caribe": {
  "es": "Caribe",
  "en": "Caribbean",
  "bounds": {
   "latMin": 17,
   "latMax": 23.8,
   "lonMin": -85.7,
   "lonMax": -64.5
  },
  "isos": [
   "CU",
   "DO",
   "HT",
   "JM",
   "PR"
  ],
  "capitals": {
   "HT": {
    "name": "Port-au-Prince",
    "lat": 18.543,
    "lon": -72.338
   },
   "JM": {
    "name": "Kingston",
    "lat": 17.9771,
    "lon": -76.7674
   },
   "CU": {
    "name": "Havana",
    "lat": 23.1339,
    "lon": -82.3661
   },
   "DO": {
    "name": "Santo Domingo",
    "lat": 18.4707,
    "lon": -69.9297
   },
   "PR": {
    "name": "San Juan",
    "lat": 18.44,
    "lon": -66.13
   }
  }
 }
};
