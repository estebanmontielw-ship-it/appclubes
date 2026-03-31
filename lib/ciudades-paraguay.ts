// Ciudades y distritos de Paraguay — lista completa por departamento
// Formato: { value, label, group (departamento) }

const CAPITAL = ["Asunción"]

const CENTRAL = [
  "Areguá", "Capiatá", "Fernando de la Mora", "Guarambaré", "Itá",
  "Itauguá", "Juan Augusto Saldívar", "Lambaré", "Limpio", "Luque",
  "Mariano Roque Alonso", "Nueva Italia", "Ñemby", "San Antonio",
  "San Lorenzo", "Villa Elisa", "Villeta", "Ypacaraí", "Ypané",
]

const ALTO_PARANA = [
  "Ciudad del Este", "Doctor Juan León Mallorquín", "Hernandarias",
  "Iruña", "Itakyry", "Juan Emilio O'Leary", "Los Cedrales",
  "Mbaracayú", "Minga Guazú", "Minga Porã", "Naranjal",
  "Presidente Franco", "San Alberto", "San Cristóbal",
  "Santa Fe del Paraná", "Santa Rita", "Santa Rosa del Monday",
  "Domingo Martínez de Irala", "Tavapy",
]

const ITAPUA = [
  "Encarnación", "Bella Vista", "Cambyretá", "Capitán Meza",
  "Capitán Miranda", "Carlos Antonio López", "Carmen del Paraná",
  "Coronel Bogado", "Edelira", "Fram", "General Artigas",
  "General Delgado", "Hohenau", "Jesús", "La Paz", "Natalio",
  "Nueva Alborada", "Obligado", "Pirapó", "San Cosme y Damián",
  "San Juan del Paraná", "San Pedro del Paraná", "San Rafael del Paraná",
  "Trinidad", "Tomás Romero Pereira", "Yatytay",
]

const CAAGUAZU = [
  "Coronel Oviedo", "Caaguazú", "Carayaó", "Doctor Cecilio Báez",
  "Doctor Juan Manuel Frutos", "José Domingo Ocampos",
  "La Pastora", "Nueva Londres", "Repatriación",
  "San Joaquín", "San José de los Arroyos", "Santa Rosa del Mbutuy",
  "Simón Bolívar", "Tres de Febrero", "Vaquería", "Yhú",
]

const SAN_PEDRO = [
  "San Pedro de Ycuamandiyú", "Antequera", "Choré", "General Elizardo Aquino",
  "Guayaibí", "Itacurubí del Rosario", "Lima", "Nueva Germania",
  "San Estanislao", "San Pablo", "Tacuatí", "Unión", "25 de Diciembre",
  "Villa del Rosario", "Capiibary", "Santa Rosa del Aguaray",
  "Liberación", "Yataity del Norte",
]

const GUAIRA = [
  "Villarrica", "Borja", "Capitán Mauricio José Troche",
  "Coronel Martínez", "Doctor Bottrell", "Félix Pérez Cardozo",
  "General Eugenio A. Garay", "Independencia", "Itapé",
  "Iturbe", "José Fassardi", "Mbocayaty del Guairá",
  "Natalicio Talavera", "Ñumí", "Paso Yobái",
  "San Salvador", "Tebicuary", "Yataity",
]

const PARAGUARI = [
  "Paraguarí", "Acahay", "Caapucú", "Caballero", "Carapeguá",
  "Escobar", "General Bernardino Caballero", "La Colmena",
  "Mbuyapey", "Pirayú", "Quiindy", "Quyquyhó",
  "San Roque González de Santa Cruz", "Sapucai",
  "Tebicuarymí", "Yaguarón", "Ybycuí", "Ybytymí",
]

const CAAZAPA = [
  "Caazapá", "Abaí", "Buena Vista", "Doctor Moisés Bertoni",
  "Fulgencio Yegros", "General Higinio Morínigo",
  "Maciel", "San Juan Nepomuceno", "Tavaí",
  "Yuty", "3 de Mayo",
]

const MISIONES = [
  "San Juan Bautista", "Ayolas", "San Ignacio", "San Miguel",
  "San Patricio", "Santa María", "Santa Rosa",
  "Santiago", "Villa Florida", "Yabebyry",
]

const NEEMBUCU = [
  "Pilar", "Alberdi", "Cerrito", "Desmochados",
  "General José Eduvigis Díaz", "Guazú Cuá", "Humaitá",
  "Isla Umbú", "Laureles", "Mayor José J. Martínez",
  "Paso de Patria", "San Juan Bautista de Ñeembucú",
  "Tacuaras", "Villa Franca", "Villa Oliva", "Villalbín",
]

const AMAMBAY = [
  "Pedro Juan Caballero", "Bella Vista Norte", "Capitán Bado",
  "Karapaí", "Zanja Pytã",
]

const CANINDEYU = [
  "Salto del Guairá", "Corpus Christi", "Curuguaty",
  "General Francisco Caballero Álvarez", "Itanará",
  "Katueté", "La Paloma del Espíritu Santo",
  "Nueva Esperanza", "Villa Ygatimí", "Yasy Kañy",
  "Yby Pytã", "Ypejhú",
]

const CONCEPCION = [
  "Concepción", "Belén", "Horqueta", "Loreto",
  "San Carlos del Apa", "San Lázaro", "Yby Yaú",
  "Azotey", "Paso Barreto", "Sargento José Félix López",
  "Arroyito",
]

const PTE_HAYES = [
  "Villa Hayes", "Benjamín Aceval", "Nanawa",
  "José Falcón", "Puerto Pinasco", "Teniente Irala Fernández",
  "General José María Bruguez",
]

const BOQUERON = [
  "Filadelfia", "Loma Plata", "Mariscal Estigarribia",
  "Neuland",
]

const ALTO_PARAGUAY = [
  "Fuerte Olimpo", "Bahía Negra", "Carmelo Peralta",
  "Puerto Casado",
]

const CORDILLERA = [
  "Caacupé", "Altos", "Arroyos y Esteros", "Atyrá",
  "Caraguatay", "Emboscada", "Eusebio Ayala",
  "Isla Pucú", "Itacurubí de la Cordillera", "Juan de Mena",
  "Loma Grande", "Mbocayaty del Yhaguy", "Nueva Colombia",
  "Piribebuy", "Primero de Marzo", "San Bernardino",
  "San José Obrero", "Santa Elena", "Tobatí",
  "Valenzuela",
]

// Construir lista agrupada por departamento
function buildCities(departamento: string, ciudades: string[]) {
  return ciudades.map((c) => ({ value: c, label: c, group: departamento }))
}

export const CIUDADES_PARAGUAY = [
  ...buildCities("Capital", CAPITAL),
  ...buildCities("Central", CENTRAL),
  ...buildCities("Alto Paraná", ALTO_PARANA),
  ...buildCities("Itapúa", ITAPUA),
  ...buildCities("Caaguazú", CAAGUAZU),
  ...buildCities("San Pedro", SAN_PEDRO),
  ...buildCities("Guairá", GUAIRA),
  ...buildCities("Paraguarí", PARAGUARI),
  ...buildCities("Caazapá", CAAZAPA),
  ...buildCities("Misiones", MISIONES),
  ...buildCities("Ñeembucú", NEEMBUCU),
  ...buildCities("Amambay", AMAMBAY),
  ...buildCities("Canindeyú", CANINDEYU),
  ...buildCities("Concepción", CONCEPCION),
  ...buildCities("Cordillera", CORDILLERA),
  ...buildCities("Presidente Hayes", PTE_HAYES),
  ...buildCities("Boquerón", BOQUERON),
  ...buildCities("Alto Paraguay", ALTO_PARAGUAY),
  { value: "Otra", label: "Otra", group: "Otro" },
]

// Lista plana de nombres de ciudad (para compatibilidad)
export const CIUDADES_PY_COMPLETAS = CIUDADES_PARAGUAY.map((c) => c.value)
