# Genius Sports API — Referencia Completa para CPB
## Contexto: Confederación Paraguaya de Básquetbol (LNB / LiveStats)

---

## RESUMEN DE LAS 4 APIs

| API | Propósito | Tipo |
|-----|-----------|------|
| **Warehouse REST** | Consultar datos históricos: matches, players, stats, teams | HTTP REST (GET/POST) |
| **Warehouse Livestream READ** | Recibir datos en tiempo real de partidos en curso | Long-running HTTP GET (streaming) |
| **Warehouse Livestream PUBLISH** | Enviar datos al warehouse desde la aplicación de captura | Long-running HTTP POST (streaming) |
| **LiveStats TV Feed** | Feed en-arena vía LAN para pantallas/TV | TCP socket puerto 7677 |

---

## 1. WAREHOUSE REST API

### Base URL
```
https://wh.sportingpulseinternational.com/v2/basketball/
```
(o endpoint asignado por GS)

### Autenticación
```
Header: x-api-key: {TU_API_KEY}
```
(El método `?ak=KEY` en query string está DEPRECATED)

### Endpoints principales

#### Matches
```
GET /v2/basketball/matches/{matchId}
GET /v2/basketball/matches?competitionId={id}&from={date}&to={date}
```
Retorna: match info, teams, players, scores, venue

#### Players / Persons
```
GET /v2/basketball/persons/{personId}
GET /v2/basketball/persons?name={name}&competitionId={id}
```
Retorna: personId (SPI ID), nombre, fecha de nacimiento, nacionalidad, foto

**CLAVE para CPB:** El `personId` en la API de GS = `spi_id` en FIBA Organizer

#### Teams
```
GET /v2/basketball/teams/{teamId}
GET /v2/basketball/teams?competitionId={id}
```

#### Competition Statistics (Box Score histórico)
```
GET /v2/basketball/matches/{matchId}/statistics
GET /v2/basketball/matches/{matchId}/players
```

#### Standings
```
GET /v2/basketball/competitions/{competitionId}/standings
```

### Formato de respuesta REST
```json
{
  "total": 100,
  "data": [...],
  "offset": 0,
  "limit": 20
}
```

### Coordenadas de cancha
- Origen (0,0) = esquina inferior izquierda
- Punto superior derecho = (100, 100)
- Porcentaje del ancho/alto total de la cancha
- Ejemplo: línea de 3 FIBA a 6.75m de 28m total → x = 6.75/28 * 100 = 24.1

---

## 2. WAREHOUSE LIVESTREAM READ API

### Propósito
Recibir stream de acciones en tiempo real durante un partido.

### Base URL (streaming)
```
GET https://live.wh.sportingpulseinternational.com/v2/basketball/read/{matchId}
Header: x-api-key: {TU_API_KEY}
```

### Importante
- Es una conexión LONG RUNNING (no hacer múltiples llamadas cortas)
- Una conexión por partido
- Conectar ANTES del inicio del partido
- Desconectar cuando status = `complete`
- Los mensajes se delimitan con `\r\n`

### Tipos de mensajes recibidos

#### `connection` — Estado de conexión (cada 10 seg si no hay datos)
```json
{
  "type": "connection",
  "status": "CONNECTED|NOTCONNECTED|LOST|COMPLETE",
  "instance": "84fdbdb207e13ec48f48225e72739eb2"
}
```

#### `matchInformation` — Info del partido (al conectar)
```json
{
  "type": "matchInformation",
  "match": {
    "matchId": 5198632,
    "matchTime": "2026-04-13 20:00:00",
    "matchNumber": 3,
    "roundNumber": "1",
    "matchType": "REGULAR",
    "externalId": "3"
  },
  "competition": {
    "competitionId": 663243,
    "competitionName": "LNB APERTURA 2026",
    "gender": "MALE",
    "year": 2026
  },
  "league": {
    "leagueId": 48110,
    "leagueName": "LNB APERTURA 2026"
  },
  "venue": {
    "venueName": "Estadio Ka'a Poty",
    "timezone": "America/Asuncion"
  }
}
```

#### `teams` — Equipos y jugadores
```json
{
  "type": "teams",
  "teams": [{
    "teamNumber": 1,
    "detail": {
      "teamId": 4738037,
      "teamName": "COLONIAS GOLD",
      "teamCode": "COL"
    },
    "players": [{
      "pno": 1,
      "personId": 1678949,
      "familyName": "PAREDES",
      "firstName": "SEBASTIAN",
      "shirtNumber": "5",
      "playingPosition": "G",
      "starter": 1,
      "active": 1,
      "dob": "2001-03-15",
      "externalId": "..."
    }]
  }]
}
```

**CLAVE:** `personId` en este mensaje = `spi_id` en FIBA Organizer. Si ese ID no existe en FO → error "Person with SPI id XXXXXXX cannot be found"

#### `status` — Estado del partido
```json
{
  "type": "status",
  "status": "inprogress|finished|complete|prematch...",
  "period": {"current": 2, "periodType": "REGULAR"},
  "periodStatus": "started",
  "clock": "08:45:00",
  "clockRunning": 1,
  "scores": [
    {"teamNumber": 1, "score": 45},
    {"teamNumber": 2, "score": 38}
  ]
}
```

#### `action` — Acción del partido (canasta, falta, etc.)
```json
{
  "type": "action",
  "actionNumber": 712,
  "messageId": 925,
  "actionType": "2pt|3pt|freethrow|foul|rebound|turnover|assist|block|steal|substitution|timeout",
  "success": 1,
  "teamNumber": 1,
  "pno": 3,
  "personId": 7039114,
  "period": {"current": 2, "periodType": "REGULAR"},
  "clock": "05:32:00",
  "x": 24.1,
  "y": 50.0,
  "area": "paint"
}
```

#### `boxscore` — Estadísticas acumuladas
```json
{
  "type": "boxscore",
  "teams": [{
    "teamNumber": 1,
    "statistics": {
      "sPoints": 45,
      "sTwoPointersMade": 8,
      "sThreePointersMade": 5,
      "sFreeThrowsMade": 9,
      "sReboundsTotal": 22,
      "sAssists": 10,
      "sSteals": 5,
      "sBlocks": 3,
      "sTurnovers": 8,
      "sFoulsPersonal": 12
    },
    "players": [{
      "pno": 1,
      "statistics": { "sPoints": 14, ... }
    }]
  }]
}
```

---

## 3. WAREHOUSE LIVESTREAM PUBLISH API

### Propósito
La app de captura (LiveStats) envía datos al warehouse. No relevante para consumir datos, pero útil entender la estructura.

### Conexión
```
POST https://live.wh.sportingpulseinternational.com/v2/basketball/publish
  ?streamKey={STREAM_KEY}&timestamp={UNIX_TIMESTAMP}
```

### Características
- Conexión bidireccional (long-running socket)
- Puertos 80 o 5522
- 1 conexión master, múltiples backup
- Timeout si no hay mensaje en 20 segundos
- `messageId` debe ser único y secuencial (no saltar números)

### Mensaje de setup
```json
{
  "message": {
    "type": "setup",
    "messageId": 1,
    "periods": {"number": 4, "length": 10, "overtime": 1, "lengthOvertime": 5},
    "shotClock": 24,
    "maxFoulsPersonal": 5,
    "maxFoulsTechnical": 2,
    "foulsBeforeBonus": 4,
    "timeouts": {"style": "period", "period1": 2, "period2": 2, "period3": 2, "period4": 2, "extratime": 1}
  }
}
```

---

## 4. LIVESTATS TV FEED (IN-ARENA)

### Propósito
Feed local en el venue vía TCP socket LAN. Para pantallas de TV, marcadores, etc.

### Conexión
```
TCP socket → IP_LIVESTATS_PC : 7677
```
(Puerto puede cambiar — confirmar con estadístico en venue)

### Inicialización (enviar al conectar, antes de 5 segundos)
```json
{
  "type": "parameters",
  "types": "se,ac,mi,te,box,pbp"
}
```

Tipos disponibles:
| Código | Descripción |
|--------|-------------|
| `st` | status |
| `se` | setup |
| `ac` | action |
| `mi` | matchInformation |
| `te` | teams |
| `of` | officials |
| `su` | summary |
| `box` | boxscore |
| `pbp` | play-by-play |
| `sd` | standings |
| `sc` | schedule |
| `cs` | competition statistics |

### Ping (cada 10 seg si no hay datos)
```json
{"type": "ping", "timestamp": "2026-04-13 20:15:34:01"}
```

---

## RELACIÓN DE IDs — CPB/FIBA Organizer ↔ Genius Sports

| Campo en FO | Campo en GS API | Descripción |
|-------------|-----------------|-------------|
| `spi_id` (persona) | `personId` en teams/action messages | ID de la persona en Genius Sports |
| `team_id` | `teamId` en detail | ID del equipo |
| `competition_id` | `competitionId` | ID de la competencia (LNB 2026 = 663243) |
| `league_id` | `leagueId` | ID de la liga (LNB APERTURA 2026 = 48110) |
| `game_id` | `matchId` | ID del partido |

---

## PROBLEMA FRECUENTE: "Person with SPI id XXXXXXX cannot be found"

**Causa:** El jugador tiene `personId` en el XML de LiveStats pero no existe en FIBA Organizer con ese `spi_id`.

**Solución en FO:**
1. Ir a Contenido → Personas → Añadir
2. Crear el perfil con nombre, fecha de nacimiento, nacionalidad
3. FO asignará automáticamente el SPI ID al hacer el Person Matching (Mapa de Jugadores)
4. En el Mapa de Jugadores seleccionar manualmente el nuevo perfil

**Verificación:** En FO, ir a Tools → Person Merging para detectar duplicados después de crear perfiles nuevos.

---

## ESTADÍSTICAS INDIVIDUALES (nombres de campos)

```
sPoints              Puntos totales
sTwoPointersMade     Tiros de 2 anotados
sTwoPointersAttempted Tiros de 2 intentados
sThreePointersMade   Triples anotados
sThreePointersAttempted Triples intentados
sFreeThrowsMade      Tiros libres anotados
sFreeThrowsAttempted  Tiros libres intentados
sReboundsOffensive   Rebotes ofensivos
sReboundsDefensive   Rebotes defensivos
sReboundsTotal       Rebotes totales
sAssists             Asistencias
sSteals              Robos
sBlocks              Tapones
sTurnovers           Pérdidas
sFoulsPersonal       Faltas personales
sFoulsTechnical      Faltas técnicas
sFoulsOn             Faltas recibidas
sMinutes             Minutos jugados
sEfficiency          Eficiencia (custom formula)
```

---

## EJEMPLO PYTHON — Conectar al Read Stream

```python
import requests
import json

API_KEY = "tu_api_key_aqui"
MATCH_ID = 5198632  # Game ID de FO

url = f"https://live.wh.sportingpulseinternational.com/v2/basketball/read/{MATCH_ID}"
headers = {"x-api-key": API_KEY}

with requests.get(url, headers=headers, stream=True) as r:
    buffer = ""
    for chunk in r.iter_content(chunk_size=None, decode_unicode=True):
        buffer += chunk
        while "\r\n" in buffer:
            msg, buffer = buffer.split("\r\n", 1)
            if msg.strip():
                data = json.loads(msg)
                print(f"Type: {data['type']}")
                if data['type'] == 'teams':
                    for team in data['teams']:
                        for player in team.get('players', []):
                            print(f"  Player SPI ID: {player['personId']} - {player['firstName']} {player['familyName']}")
                elif data['type'] == 'status' and data.get('status') == 'complete':
                    print("Match complete - disconnecting")
                    break
```

---

## NOTAS OPERATIVAS CPB

- **Temporada activa:** LNB APERTURA 2026 (season_id=663243, league_id=48110)
- **Torneo:** Liga Nacional de Basquetbol Apertura 2026 (tournament_id=41808)
- **8 equipos:** Olimpia Kings, Deportivo Campoalto, Ciudad Nueva, San Alfonzo, Deportivo San José, Félix Pérez Cardozo, Colonias Gold, Deportivo Amambay
- **Ticket Genius Sports activo:** #468016 (restauración de perfiles)
- **Acción pendiente:** Crear SEBASTIAN PAREDES (SPI ID 1678949, Colonias Gold) en FO → Contenido → Personas → Añadir

---

## 5. WAREHOUSE REST API — LISTA COMPLETA DE ENDPOINTS (242 total)

### Base URL
```
https://wh.sportingpulseinternational.com/v2/basketball/
```
Header requerido: `x-api-key: {TU_API_KEY}`

### Autenticación
- Header: `x-api-key` (método recomendado)
- Query param: `?ak=KEY` (DEPRECATED)

### Parámetros comunes opcionales
- `fields` — Partial response (seleccionar campos específicos)
- `offset` / `limit` — Paginación
- `externalId` — Filtrar por ID externo del sistema origen

### Formato de respuesta
```json
{
  "total": 100,
  "data": [...],
  "offset": 0,
  "limit": 20
}
```

---

### ENTITIES

#### Leagues
- GET — Get a list of leagues
- GET — Get a league by Id
- POST — Create a new league
- PUT — Update an existing league

#### Competitions
- GET — Get a list of competitions
- GET — Get a list of competitions in a league
- GET — Get a list of competitions with same externalId
- GET — Get a competition by Id
- POST — Create a new competition
- PUT — Update an existing competition
- DELETE — Delete an existing competition

#### Clubs
- GET — Get a list of clubs
- GET — Get a list of clubs in a league
- GET — Get a list of clubs with same externalId
- GET — Get a club by Id
- POST — Create a new club
- PUT — Update an existing club
- DELETE — Delete an existing club

#### Teams
- GET — Get a list of teams
- GET — Get a list of teams in a league
- GET — Get a list of teams with same externalId
- GET — Get a list of teams in a club
- GET — Get a list of teams in a competition
- GET — Get a team by Id
- POST — Create a new team
- PUT — Update an existing team
- DELETE — Delete an existing team

#### Venues
- GET — Get a list of venues
- GET — Get a list of venues in a league
- GET — Get a list of venues with same externalId
- GET — Get a venue by Id
- POST — Create a new venue
- PUT — Update an existing venue
- DELETE — Delete an existing venue

#### Persons ⭐ (MÁS IMPORTANTE PARA CPB)
- GET — Get a list of persons in a league
- GET — Get a list of persons in a club
- GET — Get a list of persons in a team
- GET — **Get a list of persons in a team for a competition**
- GET — **Get a list of persons in a team for a match**
- GET — **Get a person by Id**  → `/v2/basketball/persons/{personId}`
- GET — Get a list of persons with same externalId
- POST — Create a new person
- PUT — Update an existing person
- DELETE — Delete an existing person

**Campos clave de Person:**
```json
{
  "personId": 1678949,        // = spi_id en FIBA Organizer
  "firstName": "SEBASTIAN",
  "familyName": "PAREDES",
  "dob": "2001-03-15",        // fecha de nacimiento
  "nationalityCode": "PY",   // ISO 3166 2 letras
  "height": 185,
  "externalId": "..."         // ID externo del sistema CPB
}
```

#### Roles
- GET — Get a list person roles for a league
- GET — Get a list person roles for a competition
- GET — Get a list person roles for a person
- GET — Get a role item by Id
- POST — Create a new role
- PUT — Update a role item
- DELETE — Delete an existing role

---

### MATCH RELATED

#### Tournaments
- GET — Get a list of tournaments
- GET — Get a list of tournaments in a competition
- GET — Get a tournament by Id
- POST — Create a new tournament
- PUT — Update an existing tournament

#### Rounds
- GET — Get a list of rounds in a tournament
- GET — Get a round by Id
- POST — Create a new round
- PUT — Update an existing round

#### Matches ⭐
- GET — **Get a list of matches by competition**
- GET — **Get a match by Id** → `/v2/basketball/matches/{matchId}`
- GET — Get a list of matches by competition with live scores
- GET — Get a list of matches with same externalId
- POST — Create a new match
- PUT — Update an existing match
- DELETE — Delete a specific match
- DELETE — Delete multiple matches in a competition

#### Match Players ⭐ (CLAVE para Person Matching)
- GET — **List of players in the match** → `/v2/basketball/matches/{matchId}/players`
- GET — **List of players in the match for a team** → `/v2/basketball/matches/{matchId}/teams/{teamId}/players`

Retorna: personId (SPI ID), nombre, dorsal, posición, starter, dob

#### Match Staff
- GET — Get List of Match Staff in the league
- GET — Get List of Match Staff in a competition
- GET — Get List of Staff in a match
- GET — Get List of roles for a person in a match
- GET — Get List of staff for a team in a match
- GET — Get staff details for a person in a match
- POST — Create a new match staff record
- DELETE — Delete match staff records

#### Match Competitors
- GET — Get a list of competitors for a match
- GET — Get the detail about a specific match competitor
- PUT — Update an existing competitor in a match
- DELETE — Delete an existing competitor from a match

---

### STATISTICS

#### Match Actions
- GET — Get Match Actions List → `/v2/basketball/matches/{matchId}/actions`
- GET — Get details for a specific action in a match
- POST — Create a new match action
- PUT — Update a match action
- DELETE — Delete Match Actions
- DELETE — Delete a single Match Action

**Action types:** `2pt`, `3pt`, `freethrow`, `foul`, `rebound`, `turnover`, `assist`, `block`, `steal`, `substitution`, `timeout`

#### Team Match Statistics ⭐
- GET — Get team match statistics for a competition
- GET — Get a team's match statistics for a competition
- GET — **Get team match statistics for a match** → `/v2/basketball/matches/{matchId}/teamstatistics`
- GET — Get a team's statistics in a match
- GET — Get a team's statistics for a particular period in a match
- GET — Get a team's statistics for a particular REGULAR period in a match

#### Person Match Statistics ⭐ (BOX SCORE)
- GET — Get person match statistics for a competition
- GET — Get person match statistics for a team in a competition
- GET — Get a person match statistics for a person in a competition
- GET — **Get person match statistics for a match** → `/v2/basketball/matches/{matchId}/personstatistics`
- GET — Get a person match statistics for a team in a match
- GET — Get a person's statistics in a match
- GET — Get a person's statistics for a particular period in a match

#### Team/Person Competition Statistics
- GET — Get team statistics for a competition
- GET — Get person competition statistics for a competition
- GET — Get person competition statistics for a team in a competition
- GET — Get a person competition statistics for a person in a competition

#### Person Career Statistics
- GET — Get Person Base Career Statistics
- GET — Get Person Career Statistics

#### Standings
- GET — Get a competition's standings
- GET — Get detailed standings
- POST/PUT/DELETE — Manage standing configurations and adjustments

---

### ENDPOINTS CLAVE PARA CPB (resumen ejecutivo)

```
# Buscar persona por SPI ID
GET /v2/basketball/persons/{spiId}

# Listar jugadores de un partido (para verificar person matching)
GET /v2/basketball/matches/{matchId}/players

# Box score de un partido
GET /v2/basketball/matches/{matchId}/personstatistics

# Estadísticas por equipo en un partido
GET /v2/basketball/matches/{matchId}/teamstatistics

# Todos los partidos de una competición
GET /v2/basketball/competitions/{competitionId}/matches
# O bien:
GET /v2/basketball/matches?competitionId={id}

# Jugadores de un equipo en una competición
GET /v2/basketball/competitions/{competitionId}/teams/{teamId}/persons

# Standings de la LNB
GET /v2/basketball/competitions/{competitionId}/standings
```

### IDs de CPB para usar en los endpoints:
```
league_id (LNB APERTURA 2026):    48110
competition_id (LNB APERTURA 2026): 663243
tournament_id:                     41808
season_id:                         663243

Partidos del 13/04/2026:
  matchId 5198633 — Olimpia Kings vs Deportivo Campoalto
  matchId 5198632 — Colonias Gold vs Deportivo Amambay
  matchId 5198631 — Ciudad Nueva vs San Alfonzo
  matchId 5198630 — Deportivo San José vs Félix Pérez Cardozo
```

---

## 6. LIVESTREAM READ — ENDPOINTS ADICIONALES

```
# Read stream (long-running GET)
GET https://live.wh.sportingpulseinternational.com/v2/basketball/read/{matchId}
Header: x-api-key: {KEY}
Params: ?types=se,ac,mi,te,box,pbp&fromMessageId=0

# Read log stream (replay de mensajes pasados)
GET https://live.wh.sportingpulseinternational.com/v2/basketball/readlog/{matchId}
Header: x-api-key: {KEY}
Params: ?fromMessageId=0&toMessageId=9999
```

### Tipos de mensajes del Read Stream — LISTA COMPLETA
| Tipo | Descripción | Frecuencia |
|------|-------------|-----------|
| `connection` | Estado de la conexión | Cada 10 seg si no hay datos |
| `matchInformation` | Info del partido (competición, venue, etc.) | Al conectar |
| `setup` | Configuración del partido (períodos, shot clock) | Al conectar |
| `teams` | Equipos y jugadores con sus SPI IDs | Al conectar + updates |
| `officials` | Árbitros | Al conectar |
| `status` | Marcador, reloj, período actual | Cada cambio |
| `action` | Acción individual (canasta, falta, etc.) | Tiempo real |
| `boxscore` | Estadísticas acumuladas | Cada acción |
| `playbyplay` | Play-by-play con coordenadas en cancha | Cada acción |
| `standings` | Clasificación actualizada | Cada partido |
| `schedule` | Calendario de partidos | Al conectar |

---

## 7. TV FEED (LIVESTATS) — TIPOS DE MENSAJES COMPLETOS

### Conexión: TCP socket → `IP_LIVESTATS:7677`

### Parámetros de suscripción (enviar en los primeros 5 seg):
```json
{
  "type": "parameters",
  "types": "se,ac,mi,te,box,pbp,of,su,sd,sc,cs",
  "playbyplayOnConnect": 1,
  "fromMessageId": 0
}
```

### Tipos de mensajes TV Feed:
| Código | Tipo | Descripción |
|--------|------|-------------|
| `st` | status | Estado del partido, reloj, marcador |
| `se` | setup | Configuración (períodos, timeouts, shot clock) |
| `ac` | action | Acción individual en tiempo real |
| `mi` | matchInformation | Info de competición, venue, equipos |
| `te` | teams | Jugadores (con personId = SPI ID) |
| `of` | officials | Árbitros |
| `su` | summary | Resumen del período actual |
| `box` | boxscore | Stats completas por jugador y equipo |
| `pbp` | playbyplay | Play-by-play con coordenadas |
| `sd` | standings | Clasificación |
| `sc` | schedule | Calendario |
| `cs` | competitionStatistics | Estadísticas de temporada |

### Message especiales TV Feed:
- `ping` — keepalive cada 10 segundos
- `parameters` — enviado por el cliente al conectar

