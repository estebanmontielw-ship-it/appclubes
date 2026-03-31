export const BARRIOS_POR_CIUDAD: Record<string, string[]> = {
  "Asunción": [
    "Centro", "Sajonia", "Jara", "San Roque", "Catedral", "La Encarnación",
    "San Felipe", "General Díaz", "Pettirossi", "Dr. Francia", "Las Mercedes",
    "Republicano", "Pinozá", "Terminal", "Roberto L. Petit", "San Pablo",
    "Tacumbú", "Obrero", "San Vicente", "Tablada Nueva", "Santa Rosa",
    "Banco San Miguel", "Botánico", "Mariscal Estigarribia", "Villa Morra",
    "Manorá", "Los Laureles", "Herrera", "Madame Lynch", "Recoleta",
    "Mburucuyá", "Seminario", "San Cristóbal", "Carmelitas", "Villa Aurelia",
    "Salvador del Mundo", "Ytay", "Hipódromo", "San Jorge", "Ycuá Satí",
    "Santa María", "Nazareth", "Trinidad", "Loma Pytá", "Zeballos Cué",
    "Viñas Cué", "Cañada del Ybyray", "Mbocayaty", "Tembetary",
    "General Caballero", "Ita Enramada", "Ita Pytá Punta", "Bañado Norte",
    "Bañado Sur", "Bañado Tacumbú", "Bañado Cara Cara", "Chacarita",
    "Ricardo Brugada", "Bella Vista", "San Antonio", "Vista Alegre",
    "Laurelty", "Mariscal López", "Ciudad Nueva", "Las Lomas",
  ],
  "San Lorenzo": [
    "Centro", "San Isidro", "Villa Universitaria", "Reducto San Lorenzo",
    "Campo Grande", "San Miguel", "Villa Rica", "Laurelty", "San José",
    "Capilla del Monte", "Potrero Guaraní", "Villa del Maestro", "Terminal",
  ],
  "Luque": [
    "Centro", "Loma Merlo", "Itapuamí", "Segundo Barrio", "Tercer Barrio",
    "Cuarto Barrio", "Las Residentas", "Molino", "Isla Bogado", "Jukyty",
    "Cañada San Rafael", "Área 1", "Área 2", "Área 3", "Las Mercedes",
    "Laurelty", "San Lorenzo", "Villa Policial", "Hugua de Seda",
    "Campo Grande", "Itá Azul", "Loma Campamento",
  ],
  "Fernando de la Mora": [
    "Zona Norte", "Zona Sur", "Centro", "Barrio Palomar", "Villa Elisa",
    "San Antonio", "Isla Bogado", "Las Residentas", "Barrio Obrero",
    "Barrio San José", "Barrio Santa Rosa", "Barrio Laurelty",
    "Villa Industrial", "Barrio Molino",
  ],
  "Lambaré": [
    "Centro", "Valle Apu'a", "Villa Elisa", "Tres Bocas", "Mbachio",
    "San Isidro", "Valle Apua", "Villa Occidental", "La Esperanza",
    "San Antonio", "Barrio Obrero", "Jardín", "Cerrito", "Costa Lambaré",
    "Mburucuyá", "San Jorge", "Las Mercedes",
  ],
  "Capiatá": [
    "Centro", "Naranja Hai", "Isla Bogado", "Aldana Cañada",
    "San Francisco", "Las Mercedes", "Laterza Cué", "Rojas Cañada",
    "Potrero", "Villa Ygatimí", "Km 19", "Km 21", "Km 23",
  ],
  "Limpio": [
    "Centro", "Piquete Cué", "San Lorenzo", "Salado", "San Miguel",
    "Villa Policial", "Cañada", "Costa Limpio",
  ],
  "Ñemby": [
    "Centro", "San Agustín", "Rincón", "Villa Industrial",
    "San Pedro", "Mbocayaty", "Villa Ofelia", "Fortín",
  ],
  "Mariano Roque Alonso": [
    "Centro", "Loma Merlo", "Villa Policial", "San José",
    "Cañada", "Las Mercedes", "San Antonio",
  ],
  "Ciudad del Este": [
    "Centro", "San Juan", "Area 1", "Area 2", "Area 3", "Area 4",
    "Area 5", "Area 6", "Area 7", "Boquerón", "San Cristóbal",
    "Pablo Rojas", "Remansito", "San Miguel", "Jardín Aurora",
    "Virgen de Fátima", "Las Colinas", "Bernardino Caballero",
  ],
  "Encarnación": [
    "Centro", "San Pedro", "Villa Quiteria", "Pacu Cuá",
    "San Isidro", "Los Arrabales", "Sagrada Familia",
    "Santo Domingo", "San Valentín", "San Roque",
  ],
  "Pedro Juan Caballero": [
    "Centro", "Obrero", "San José", "San Gerardo",
    "Jardín", "Las Mercedes", "Industrial",
  ],
  "Caaguazú": [
    "Centro", "San José", "Industrial", "Obrero",
    "Las Mercedes", "San Antonio",
  ],
  "Coronel Oviedo": [
    "Centro", "San José", "San Blas", "Obrero",
    "Industrial", "Las Mercedes",
  ],
  "Villarrica": [
    "Centro", "San Miguel", "Ybaroty", "Laurelty",
    "San Blas", "Estación",
  ],
  "Concepción": [
    "Centro", "San Antonio", "Obrero", "Las Mercedes",
    "Villa Real", "Industrial",
  ],
  "Pilar": [
    "Centro", "San Lorenzo", "Las Mercedes", "Obrero",
  ],
}

// Fallback for cities not in the list
export function getBarrios(ciudad: string): string[] {
  const barrios = BARRIOS_POR_CIUDAD[ciudad] || []
  return [...barrios, "Mi barrio no figura"]
}
