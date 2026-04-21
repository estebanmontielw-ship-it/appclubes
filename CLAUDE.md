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

### Endpoint de jugadores por partido — CRÍTICO
- `GET /matches/{matchId}/players` **sin parámetros solo devuelve los jugadores del equipo LOCAL**.
- Para obtener ambos equipos, llamar **una vez por competidor** con `?teamId={teamId}` y combinar:
  ```typescript
  const teamIds = m.competitors.map(c => c.teamId)
  const arrays = await Promise.all(
    teamIds.map(tid => geniusFetch(`/matches/${matchId}/players?teamId=${tid}`))
  )
  return arrays.flat()
  ```
- Sin esto, los equipos visitantes tienen 0 stats aunque hayan jugado.

### Errores comunes a evitar
1. **No asumir `competitors[0]` = local.** Usar `isHomeCompetitor`.
2. **No usar `matchTime.slice(0,5)` directo.** El string incluye la fecha — siempre hacer split primero.
3. **No usar `roundNumber` como jornada.** Siempre es `"0"`. Calcular con `matchNumber / matchesPerJornada`.
4. **No pasar objetos anidados (como `venue`) directo al JSX.** React crashea al intentar renderizar un object. Extraer siempre el string antes.
5. **`scoreString`** puede ser `""` (vacío) para partidos no jugados. Tratar string vacío como null.
6. **No usar `for...of` sobre Map/Set ni spread `[...Set]`.** TypeScript target ES5 no lo soporta. Usar siempre `Array.from(map.entries())` y `Array.from(new Set(...))`.

### Variables de entorno requeridas
```
GENIUS_SPORTS_API_KEY=...         # API key de Genius Sports Warehouse
GENIUS_LNB_COMPETITION_ID=48603  # ID fijo de la competencia LNB 2026 (opcional, se auto-detecta)
```

### Endpoint de debug
`GET /api/genius/debug-match` → devuelve los primeros 2 partidos con todos sus campos crudos.
Útil para diagnosticar cuando algo nuevo falla en producción (el sandbox no tiene API key).

---

## Genius Sports — Livestream READ API (datos en tiempo real)

Base URL: `https://live.wh.sportingpulseinternational.com/v2/basketball/read/{matchId}`
Auth: `x-api-key` header (misma API key)

### Uso
- Conexión **long-running GET** — una sola conexión por partido, no hacer polling.
- Conectar ANTES del inicio del partido.
- Los mensajes se delimitan con `\r\n`.
- Desconectar cuando llega `status: "complete"`.

### Tipos de mensajes del stream
| Tipo | Descripción | Cuándo llega |
|------|-------------|--------------|
| `connection` | Estado de la conexión | Cada 10 seg si no hay datos |
| `matchInformation` | Info del partido (competición, venue) | Al conectar |
| `setup` | Configuración (períodos, shot clock, timeouts) | Al conectar |
| `teams` | Equipos y jugadores con sus SPI IDs | Al conectar + updates |
| `officials` | Árbitros | Al conectar |
| `status` | Marcador, reloj, período actual | Cada cambio |
| `action` | Acción individual (canasta, falta, etc.) | Tiempo real |
| `boxscore` | Estadísticas acumuladas por jugador/equipo | Cada acción |
| `playbyplay` | Play-by-play con coordenadas en cancha | Cada acción |
| `standings` | Clasificación actualizada | Cada partido |
| `schedule` | Calendario de partidos | Al conectar |

### Endpoints adicionales del Livestream
```
# Stream en tiempo real
GET https://live.wh.sportingpulseinternational.com/v2/basketball/read/{matchId}
  ?types=se,ac,mi,te,box,pbp&fromMessageId=0

# Replay de mensajes pasados (partidos ya jugados)
GET https://live.wh.sportingpulseinternational.com/v2/basketball/readlog/{matchId}
  ?fromMessageId=0&toMessageId=9999
```

### Estructura del mensaje `action`
```json
{
  "type": "action",
  "actionNumber": 712,
  "actionType": "2pt|3pt|freethrow|foul|rebound|turnover|assist|block|steal|substitution|timeout",
  "success": 1,
  "teamNumber": 1,
  "pno": 3,
  "personId": 7039114,
  "period": { "current": 2, "periodType": "REGULAR" },
  "clock": "05:32:00",
  "x": 24.1,
  "y": 50.0,
  "area": "paint"
}
```

### Coordenadas de cancha
- Origen (0,0) = esquina inferior izquierda
- (100, 100) = esquina superior derecha
- Porcentaje del ancho/alto total de la cancha

---

## Genius Sports — Relación de IDs con FIBA Organizer

| Campo en FIBA Organizer | Campo en Genius Sports | Descripción |
|-------------------------|------------------------|-------------|
| `spi_id` (persona) | `personId` en teams / action messages | **⚠️ NO son el mismo ID — ver nota** |
| `team_id` | `teamId` en detail | ID del equipo |
| `competition_id` | `competitionId` | ID de la competencia |
| `league_id` | `leagueId` | ID de la liga |
| `game_id` | `matchId` | ID del partido |

**⚠️ CRÍTICO — IDs de persona NO coinciden:**
- El campo "Person Id" que muestra FIBA Organizer en sus rosters (rango 5M–7M, ej. `7039138`) es un ID interno de FIBA.
- El `personId` que devuelve Genius Sports Warehouse API en `/matches/{matchId}/players` (rango 1M–3M, ej. `2734598`) es un ID interno de Genius/SPI.
- Son sistemas **completamente separados**. El mismo jugador tiene un ID distinto en cada sistema.
- **Para cruzar jugadores entre los dos sistemas, usar normalización de nombre** (`firstName + familyName`), no el ID.
- El error "Person with SPI id XXXXXXX cannot be found" en FibaLiveStats se refiere al ID de Genius (1M–3M range), que debe existir en FIBA Organizer como `spi_id`.

### IDs de la LNB APERTURA 2026
```
competitionId:  48603   ← el que usa la app (v1 API)
leagueId:       48110
tournamentId:   41808
```

---

## Error frecuente: "Person with SPI id XXXXXXX cannot be found"

**Causa:** El jugador tiene `personId` en el XML de LiveStats pero no existe en FIBA Organizer con ese `spi_id`.

**Solución en FIBA Organizer:**
1. Ir a Contenido → Personas → Añadir
2. Crear el perfil con nombre, fecha de nacimiento, nacionalidad
3. FO asignará automáticamente el SPI ID en el Person Matching (Mapa de Jugadores)
4. En Mapa de Jugadores seleccionar manualmente el nuevo perfil

**Verificación:** Tools → Person Merging para detectar duplicados después de crear perfiles nuevos.

**Caso conocido:** SEBASTIAN PAREDES (SPI ID 1678949, Colonias Gold) — ticket GS #468016.

---

## Campos de estadísticas individuales (Livestream / Box Score)

```
sPoints                  Puntos totales
sTwoPointersMade         Tiros de 2 anotados
sTwoPointersAttempted    Tiros de 2 intentados
sThreePointersMade       Triples anotados
sThreePointersAttempted  Triples intentados
sFreeThrowsMade          Tiros libres anotados
sFreeThrowsAttempted     Tiros libres intentados
sReboundsOffensive       Rebotes ofensivos
sReboundsDefensive       Rebotes defensivos
sReboundsTotal           Rebotes totales
sAssists                 Asistencias
sSteals                  Robos
sBlocks                  Tapones
sTurnovers               Pérdidas
sFoulsPersonal           Faltas personales
sFoulsTechnical          Faltas técnicas
sFoulsOn                 Faltas recibidas
sMinutes                 Minutos jugados
sEfficiency              Eficiencia
```
