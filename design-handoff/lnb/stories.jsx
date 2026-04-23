/* global React */

/* ============================================================
   EQUIPOS LNB MASCULINO 2026 (placeholders — reemplazar logos
   cuando los carguen)
   ============================================================ */
const LNB_TEAMS = [
  { name: 'DEPORTIVO SAN JOSE',   short: 'SJO',  color: '#A8C9E4', accent: '#0B5FB8', logo: 'assets/crest-san-jose.png' },
  { name: 'OLIMPIA KINGS',        short: 'OLI',  color: '#0A0A0A', accent: '#FFFFFF', logo: 'assets/crest-olimpia-kings.png' },
  { name: 'DEPORTIVO AMAMBAY',    short: 'AMA',  color: '#1E4DB8', accent: '#E63322', logo: 'assets/crest-amambay.png' },
  { name: 'DEPORTIVO CAMPOALTO',  short: 'CAM',  color: '#E63322', accent: '#FFD400', logo: 'assets/crest-campoalto.png' },
  { name: 'FELIX PEREZ CARDOZO',  short: 'FPC',  color: '#E63322', accent: '#FFFFFF', logo: 'assets/crest-felix-perez.png' },
  { name: 'SAN ALFONZO',          short: 'SAL',  color: '#1E2A44', accent: '#D4AF37', logo: 'assets/crest-san-alfonzo.png' },
  { name: 'CIUDAD NUEVA',         short: 'CACN', color: '#E63322', accent: '#FFFFFF', logo: 'assets/crest-ciudad-nueva.png' },
  { name: 'COLONIAS GOLD',        short: 'COL',  color: '#FFB400', accent: '#121212', logo: 'assets/crest-colonias.png' },
];

const LNB_SPONSORS = [
  { name: 'Kyrios',   logo: 'assets/kyrios.png',   label: null },
  { name: 'Molten',   logo: 'assets/molten.png',   label: null },
  { name: 'Powerade', logo: 'assets/powerade.png', label: null },
];

const LNB_LOGO = 'assets/logo-lnb.png';

window.LNB_TEAMS = LNB_TEAMS;
window.LNB_SPONSORS = LNB_SPONSORS;
window.LNB_LOGO = LNB_LOGO;
