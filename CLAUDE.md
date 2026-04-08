# Claude Code – Project Memory

## Genius Sports Warehouse API (Basketball)

Base URL: `https://api.wh.geniussports.com/v1/basketball`
Auth: `x-api-key` header (`GENIUS_SPORTS_API_KEY` env var)
Lib: `lib/genius-sports.ts`

### Campo clave por campo — lo que realmente devuelve

#### Fecha y hora del partido
- **NO existe `matchDate`** como campo separado.
- Todo viene en **`matchTime`** como string con espacio: `"2026-04-13 20:30:00"`.
- Para parsear: split en `" "` → parte 0 = fecha `"2026-04-13"`, parte 1 = hora `"20:30:00"`.
- `roundNumber` siempre viene como `"0"` (string) → ignorar, no es la jornada real.

#### Local / Visitante
- El campo correcto es **`isHomeCompetitor`** dentro de cada objeto en `competitors[]`.
  - `isHomeCompetitor: 1` → **local** (equipo de casa)
  - `isHomeCompetitor: 0` → **visitante**
- Genius **NO** usa `competitorType`, `homeAway`, `qualifier`, ni `position` para esto.
- Genius ordena `competitors[]` por `competitorId` ascendente, **NO** por local/visitante.
  - → Nunca asumir que `competitors[0]` es el local.

#### Score (resultado)
- Partidos jugados: score en **`scoreString`** (string, ej. `"85"`). Parsear con `parseInt`.
- `score` numérico puede existir en algunos endpoints pero no es fiable.
- `completionStatus: "NOT_COMPLETE"` / `"COMPLETE"` y `matchStatus: "COMPLETE"` para saber si terminó.

#### Número de jornada
- **No existe campo de jornada real.** `roundNumber` siempre es `"0"`.
- `matchNumber` es el número secuencial del partido en la competencia (1, 2, 3… 56).
- Para calcular la jornada: `Math.ceil(matchNumber / matchesPerJornada)`
  - `matchesPerJornada = Math.floor(numEquipos / 2)` (ej. 8 equipos → 4 partidos/jornada)

#### Venue (cancha)
- Puede venir como `m.venueName` (string) o como objeto `m.venue` con:
  - `m.venue.venueName` – nombre de la cancha
  - `m.venue.locationName` / `m.venue.suburb` – ciudad
- Usar `extractVenue(m)` del lib para manejar ambas formas.

#### Logos de equipos
- `competitor.images.logo.T1.url` – thumbnail 75×75 (uso en tarjetas)
- `competitor.images.logo.S1.url` – small 200×200
- `competitor.images.logo.L1.url` – large 600×600

#### IDs útiles
- `matchId` – ID único del partido. Usado para la URL de estadísticas en vivo.
- `competitorId` / `teamId` – mismo valor, ID del equipo.
- `competitionId` – ID de la competencia (LNB = `48603` en 2026, guardar en `GENIUS_LNB_COMPETITION_ID`).

### URL de estadísticas en vivo (FibaLiveStats)
```
https://fibalivestats.dcd.shared.geniussports.com/u/FPB/{matchId}/
```
- `FPB` = código de la federación (Federación Paraguaya de Básquetbol).
- Funciona para partidos en curso (live) y para boxscore final.

### Estructura de la respuesta de schedule
```
GET /competitions/{competitionId}/matches?limit=100
→ { response: { data: Match[] } }  ó  { data: Match[] }

Match {
  matchId: number
  matchNumber: number          // secuencial 1-N, NO jornada
  matchTime: string            // "YYYY-MM-DD HH:MM:SS"
  matchStatus: string          // "SCHEDULED" | "COMPLETE" | ...
  roundNumber: string          // siempre "0", ignorar
  hostingTeamId: number        // ID del equipo local (alternativa a isHomeCompetitor)
  venue: object | null         // { venueName, locationName, ... }
  competitors: Competitor[]    // ordenados por competitorId ASC, no por home/away

  Competitor {
    competitorId: number
    teamId: number             // igual que competitorId
    competitorName: string
    teamCode: string           // sigla (ej. "CIU")
    isHomeCompetitor: 0 | 1   // ← EL campo real para local/visitante
    scoreString: string        // score del partido si está terminado ("85")
    images: { logo: { T1: { url }, S1: { url }, L1: { url } } }
  }
}
```

### Errores comunes a evitar
1. **No asumir `competitors[0]` = local.** Usar `isHomeCompetitor`.
2. **No usar `matchTime.slice(0,5)` directo.** El string incluye la fecha — siempre hacer split primero.
3. **No usar `roundNumber` como jornada.** Siempre es `"0"`. Calcular con `matchNumber / matchesPerJornada`.
4. **No pasar objetos anidados (como `venue`) directo al JSX.** React crashea al intentar renderizar un object. Extraer siempre el string antes.
5. **`scoreString`** puede ser `""` (vacío) para partidos no jugados. Tratar string vacío como null.

### Variables de entorno requeridas
```
GENIUS_SPORTS_API_KEY=...         # API key de Genius Sports Warehouse
GENIUS_LNB_COMPETITION_ID=48603  # ID fijo de la competencia LNB 2026 (opcional, se auto-detecta)
```

### Endpoint de debug
`GET /api/genius/debug-match` → devuelve los primeros 2 partidos con todos sus campos crudos.
Útil para diagnosticar cuando algo nuevo falla en producción (el sandbox no tiene API key).
