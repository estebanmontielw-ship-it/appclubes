/**
 * Official LNB Apertura 2026 roster data from FIBA Organizer.
 * NOTE: FIBA Organizer personId ≠ Genius Sports personId (different ID systems, 5-7M vs 1-3M range).
 * Used only for cross-reference by name via /api/genius/debug-player.
 * The app fetches live rosters from Genius API directly via getCompetitionTeamPersons().
 */

export interface RegisteredPlayer {
  personId: number
  firstName: string
  lastName: string
  position?: string
}

export interface TeamRoster {
  teamName: string
  /** Genius Sports competitorName / teamCode — filled in when known */
  teamCode?: string
  players: RegisteredPlayer[]
}

export const LNB_ROSTERS: TeamRoster[] = [
  {
    teamName: "Colonias Gold",
    teamCode: "COL",
    players: [
      { personId: 7039170, firstName: "ALEN",            lastName: "JUAREZ" },
      { personId: 6852458, firstName: "BENJAMIN",        lastName: "FLORES",         position: "Guard" },
      { personId: 7039169, firstName: "CRISTHIAN",       lastName: "BECKER" },
      { personId: 7039172, firstName: "DIEGO",           lastName: "SILVA" },
      { personId: 6844471, firstName: "HUGO",            lastName: "FLORES MENDEZ" },
      { personId: 7039165, firstName: "JUAN",            lastName: "POISSON" },
      { personId: 7039510, firstName: "NESTOR ALEXANDER",lastName: "LOPEZ ALEBRANDT" },
      { personId: 7039168, firstName: "NICOLAS",         lastName: "TISCHLER" },
      { personId: 7039511, firstName: "NORBERTAS",       lastName: "GIGAS" },
      { personId: 7039167, firstName: "SEBASTIAN",       lastName: "KONRAD",         position: "Guard" },
      { personId: 7039429, firstName: "SEBASTIAN",       lastName: "PAREDES" },
      { personId: 6852461, firstName: "TIAGO",           lastName: "TISCHLER" },
    ],
  },
  {
    teamName: "Deportivo Amambay",
    players: [
      { personId: 7039515, firstName: "DIEGO",           lastName: "ZARATE" },
      { personId: 7039175, firstName: "EDEGAR",          lastName: "ALVARENGA",      position: "Guard" },
      { personId: 7039180, firstName: "EDUARDO",         lastName: "MARQUES",        position: "Guard" },
      { personId: 7039177, firstName: "FERNANDO",        lastName: "BENITEZ",        position: "Guard" },
      { personId: 7039178, firstName: "GABRIEL",         lastName: "RIVEIRO",        position: "Guard" },
      { personId: 7039174, firstName: "HUGO",            lastName: "RAMOS",          position: "Guard" },
      { personId: 7039181, firstName: "LEONARDO",        lastName: "YCASSATTI",      position: "Guard" },
      { personId: 7039173, firstName: "LUIS",            lastName: "DE OLIVEIRA",    position: "Guard" },
      { personId: 7039191, firstName: "OSMAR",           lastName: "DO AMARAL",      position: "Guard" },
      { personId: 7039176, firstName: "PAULO",           lastName: "DIAS",           position: "Guard" },
      { personId: 7039179, firstName: "VICTOR",          lastName: "DA COSTA",       position: "Guard" },
      { personId: 6926306, firstName: "VICTOR",          lastName: "TRINDADE" },
    ],
  },
  {
    teamName: "Deportivo Campo Alto",
    players: [
      { personId: 6772715, firstName: "BENJAMIN",        lastName: "ARCE" },
      { personId: 7039194, firstName: "BRYAN",           lastName: "BURNS",          position: "Guard" },
      { personId: 7039128, firstName: "DIEGO",           lastName: "ORTEGA",         position: "Guard" },
      { personId: 7039125, firstName: "FRANCISCO",       lastName: "BOGARIN",        position: "Guard" },
      { personId: 7039404, firstName: "GENARO",          lastName: "ARAUJO" },
      { personId: 7039130, firstName: "GUILLERMO",       lastName: "ARAUJO",         position: "Guard" },
      { personId: 7039131, firstName: "JEFERSON",        lastName: "ARGUELLO",       position: "Guard" },
      { personId: 7039512, firstName: "JOSE CARLOS",     lastName: "DOS SANTOS" },
      { personId: 7039124, firstName: "JUAN",            lastName: "MARTI",          position: "Guard" },
      { personId: 7039127, firstName: "NICOLAS",         lastName: "REYERO",         position: "Guard" },
      { personId: 7039129, firstName: "OCTAVIO",         lastName: "CAPUTO",         position: "Guard" },
      { personId: 7039132, firstName: "OSCAR",           lastName: "TORO",           position: "Guard" },
      { personId: 7039516, firstName: "VICTOR",          lastName: "SILVA" },
    ],
  },
  {
    teamName: "Deportivo San José",
    players: [
      { personId: 7039150, firstName: "ALVARO",          lastName: "MORALES",        position: "Guard" },
      { personId: 6844303, firstName: "ANTONIO",         lastName: "MONTIEL",        position: "Guard" },
      { personId: 7039508, firstName: "CARLOS",          lastName: "VALLEJOS" },
      { personId: 7039148, firstName: "FEDERICO",        lastName: "FERNANDEZ",      position: "Guard" },
      { personId: 7039145, firstName: "FRANCO",          lastName: "BENITEZ",        position: "Guard" },
      { personId: 7039188, firstName: "IAN",             lastName: "HEALY",          position: "Guard" },
      { personId: 7039149, firstName: "JORGE",           lastName: "MARTINEZ",       position: "Guard" },
      { personId: 7039152, firstName: "JOSE",            lastName: "JARA",           position: "Guard" },
      { personId: 7039153, firstName: "JUAN",            lastName: "CARDOZO",        position: "Guard" },
      { personId: 7039151, firstName: "JUNIORS",         lastName: "PERALTA",        position: "Guard" },
      { personId: 7039187, firstName: "LUIS",            lastName: "ARREGUI",        position: "Guard" },
      { personId: 6646517, firstName: "MIGUEL",          lastName: "FLORES" },
      { personId: 7039154, firstName: "RAMON",           lastName: "SANCHEZ",        position: "Guard" },
      { personId: 7039507, firstName: "ROBIN",           lastName: "PERRY" },
      { personId: 7039147, firstName: "TOBIAS",          lastName: "GOMEZ",          position: "Guard" },
    ],
  },
  {
    teamName: "Félix Pérez Cardozo",
    players: [
      { personId: 7039164, firstName: "ADOLFO",          lastName: "LOPEZ",          position: "Guard" },
      { personId: 7039158, firstName: "AMARO",           lastName: "CALVO",          position: "Guard" },
      { personId: 7039161, firstName: "CLAUDIO",         lastName: "BELING",         position: "Guard" },
      { personId: 7039189, firstName: "DIEGO",           lastName: "FIGARI",         position: "Guard" },
      { personId: 7039160, firstName: "FABIO",           lastName: "GAUTO",          position: "Guard" },
      { personId: 7039156, firstName: "HENRY",           lastName: "LEIVA",          position: "Guard" },
      { personId: 7039155, firstName: "JOAQUIN",         lastName: "DUARTE",         position: "Guard" },
      { personId: 7039190, firstName: "JUAN",            lastName: "ABEIRO",         position: "Guard" },
      { personId: 6224761, firstName: "MATIAS",          lastName: "LOPEZ" },
      { personId: 7039157, firstName: "MAURICIO",        lastName: "ESCURRA",        position: "Guard" },
      { personId: 7039159, firstName: "MAXIMILIANO",     lastName: "GOMEZ",          position: "Guard" },
      { personId: 7040674, firstName: "MAXIMILIANO DAMIAN", lastName: "RIOS" },
      { personId: 7039163, firstName: "RICARDO",         lastName: "SARUBBI",        position: "Guard" },
    ],
  },
  {
    teamName: "Olimpia Kings",
    players: [
      { personId: 6844309, firstName: "ALEJANDRO",       lastName: "PERALTA",        position: "Guard" },
      { personId: 6649627, firstName: "ALEJANDRO",       lastName: "TALAVERA" },
      { personId: 7039114, firstName: "ALEXIS",          lastName: "NEGRETE",        position: "Guard" },
      { personId: 7039117, firstName: "EDGAR",           lastName: "RIVEROS",        position: "Guard" },
      { personId: 7039121, firstName: "JEREMIAH",        lastName: "WOOD",           position: "Guard" },
      { personId: 7039123, firstName: "MATEO",           lastName: "IRALA",          position: "Guard" },
      { personId: 7039122, firstName: "MAXIMILIANO BRUNO", lastName: "GIMENEZ",       position: "Guard" },
      { personId: 7039118, firstName: "PABLO",           lastName: "ESPINOZA",       position: "Guard" },
      { personId: 7039116, firstName: "RODNEY",          lastName: "MERCADO",        position: "Guard" },
      { personId: 7039119, firstName: "SEBASTIAN",       lastName: "PICTON",         position: "Guard" },
      { personId: 7038815, firstName: "TYREE",           lastName: "IHENACHO",       position: "Guard" },
      { personId: 7039120, firstName: "VICTOR",          lastName: "AQUINO",         position: "Guard" },
      { personId: 6082639, firstName: "VINCENZO",        lastName: "OCHIPINTI" },
    ],
  },
  {
    teamName: "San Alfonso",
    players: [
      { personId: 7039144, firstName: "ALAN",            lastName: "PENZKOFER",      position: "Guard" },
      { personId: 7039195, firstName: "ALEJANDRO",       lastName: "ACOSTA",         position: "Guard" },
      { personId: 7039138, firstName: "ALVARO",          lastName: "DOMINGUEZ",      position: "Guard" },
      { personId: 7039139, firstName: "FABRICIO",        lastName: "FRANCO",         position: "Guard" },
      { personId: 7039142, firstName: "FABRICIO",        lastName: "NUÑEZ",          position: "Guard" },
      { personId: 7039140, firstName: "JUAN",            lastName: "MEDINA",         position: "Guard" },
      { personId: 6555653, firstName: "LUIS",            lastName: "SOSA" },
      { personId: 7039186, firstName: "MAXSUEL",         lastName: "URNAU",          position: "Guard" },
      { personId: 7039141, firstName: "RENAN",           lastName: "DOS SANTOS",     position: "Guard" },
      { personId: 7039143, firstName: "SANTIAGO",        lastName: "PERALTA",        position: "Guard" },
    ],
  },
  {
    teamName: "Ciudad Nueva",
    players: [
      { personId: 6612744, firstName: "AIDER",           lastName: "BENITEZ" },
      { personId: 7039183, firstName: "CRISTIAN",        lastName: "DELEON",         position: "Guard" },
      { personId: 5627373, firstName: "ELIAS",           lastName: "MARTINEZ" },
      { personId: 7039137, firstName: "GIULIANO",        lastName: "GIRET",          position: "Guard" },
      { personId: 6682722, firstName: "LUCAS",           lastName: "BOGADO" },
      { personId: 7039136, firstName: "MATHIAS",         lastName: "MARTINEZ",       position: "Guard" },
      { personId: 6678536, firstName: "MATIAS",          lastName: "BAEZ" },
      { personId: 7039182, firstName: "MCCRY",           lastName: "FENNER",         position: "Guard" },
      { personId: 7039185, firstName: "MICHAEL",         lastName: "KAMARY",         position: "Guard" },
      { personId: 7039184, firstName: "MIGUEL",          lastName: "POLANCO",        position: "Guard" },
      { personId: 7040702, firstName: "NELSON",          lastName: "PERALTA BARRETO" },
      { personId: 6486201, firstName: "RAUL",            lastName: "OCAMPO" },
      { personId: 7039133, firstName: "SEBASTIAN",       lastName: "GALARZA",        position: "Guard" },
      { personId: 7039134, firstName: "THIAGO",          lastName: "MARTINEZ",       position: "Guard" },
    ],
  },
]

/** Flat map of personId → player for quick lookup */
export const PLAYER_BY_ID: Map<number, RegisteredPlayer & { teamName: string }> = new Map(
  LNB_ROSTERS.flatMap(team =>
    team.players.map(p => [p.personId, { ...p, teamName: team.teamName }])
  )
)
