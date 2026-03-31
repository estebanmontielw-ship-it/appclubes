# CPB CURSOS — SPEC DE UI/UX PARA CLAUDE CODE
## Diseño visual de módulos + Contenido expandido de estadísticas

---

## PARTE 1: INSTRUCCIONES DE UI PARA CLAUDE CODE

### Filosofía de diseño

El módulo NO debe mostrarse como una página larga que el usuario scrollea de arriba abajo con todo el contenido visible de golpe. Eso es lo que hace aburrido a un curso online.

La idea es **revelar el contenido progresivamente**, como si fuera una conversación o una clase real donde el profesor va avanzando de a uno.

---

### Estructura visual de cada módulo

```
┌─────────────────────────────────────────────────┐
│ HEADER DEL MÓDULO                               │
│ "Módulo 2 de 13 · Posesión"                     │
│ ⏱ 50 min  [barra de progreso del curso]         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SECCIÓN ACTIVA (1 a la vez)                     │
│                                                 │
│ [Título de la sección]                          │
│                                                 │
│ [Contenido de la sección — texto, tabla,        │
│  truco de memoria, caso práctico]               │
│                                                 │
│         [ ← Anterior ]  [ Siguiente → ]         │
└─────────────────────────────────────────────────┘

[● ○ ○ ○ ○]  ← dots indicando sección actual
```

Cada módulo se divide en **secciones internas** (entre 4 y 8 secciones por módulo). El usuario avanza sección por sección con el botón "Siguiente". Nunca ve todo el módulo de una sola vez.

---

### Componentes específicos a implementar

#### 1. Módulo dividido en secciones (sección-stepper)

```typescript
// Cada módulo tiene un array de secciones:
interface Seccion {
  id: string
  titulo: string
  tipo: 'intro' | 'concepto' | 'truco' | 'casos' | 'tabla' | 'quiz'
  contenido: string // markdown o HTML
  esOpcional?: boolean
}

// El componente muestra de a UNA sección a la vez
// Navegación: botones Anterior / Siguiente
// Indicador visual: dots o barra de progreso de la sección
// Al llegar a la última sección → botón "Marcar módulo como completado"
```

#### 2. Tarjetas expandibles (accordion/flip cards)

Para listas de ítems donde cada uno tiene una explicación más profunda:

```
┌─────────────────────────────────────────────────┐
│ 🏀 FGA — Field Goal Attempt              [ + ]  │
└─────────────────────────────────────────────────┘
        ↓ al hacer click:
┌─────────────────────────────────────────────────┐
│ 🏀 FGA — Field Goal Attempt              [ - ]  │
│                                                 │
│ En español: Intento de tiro de campo           │
│                                                 │
│ Qué es: Se registra cuando un jugador lanza    │
│ el balón hacia el aro rival en un intento      │
│ de anotar...                                   │
│                                                 │
│ 💡 Ejemplo: #7 lanza un triple. La pelota      │
│ no entra. → Se registra 1 FGA para #7.         │
└─────────────────────────────────────────────────┘
```

Usar `shadcn/ui Accordion` para esto.

#### 3. Pop-up "Consejos para estudiar" 🎯

Aparece automáticamente la PRIMERA VEZ que el usuario entra a cualquier módulo (se guarda en localStorage o DB que ya lo vio).

También tiene un botón fijo en la esquina: 💡 icono de bombilla que siempre está visible para reabrirlo.

```typescript
// Trigger: primera visita a un módulo del curso
// Condición: localStorage.getItem('vioConsejos_[cursoId]') !== 'true'
// Al cerrar: guardar en localStorage y en DB (campo usuarioVioConsejos)

// El modal tiene tabs o secciones:
// Tab 1: Cómo estudiar
// Tab 2: Cómo usar la plataforma
// Tab 3: Tips para el examen
```

**Contenido del pop-up — Cómo estudiar:**

```
🎯 CONSEJOS PARA SACARLE EL MÁXIMO A ESTE CURSO

📚 Cómo estudiar
• Avanzá de a un módulo por día, no todos juntos
• Tomá notas a mano — escribir ayuda a memorizar
• Antes de pasar al siguiente módulo, explicale el concepto a alguien 
  más (o en voz alta a vos mismo). Si podés explicarlo, lo entendiste.
• Los trucos de memoria de cada módulo son importantes — son reglas 
  que los estadísticos profesionales usan en partidos reales
• No saltes los casos prácticos — son la parte más importante

🖥️ Cómo usar la plataforma
• Avanzás sección por sección dentro de cada módulo
• Las tarjetas con [+] se pueden expandir para ver más detalle
• El botón 💡 en la esquina te abre estos consejos en cualquier momento
• Podés volver a secciones anteriores usando el botón ← Anterior
• El quiz al final del módulo hay que aprobarlo para continuar

📝 Para el examen
• Los exámenes combinan preguntas de opción múltiple y respuestas escritas
• Nota mínima para aprobar: 70%
• Podés rendir el examen más de una vez si no aprobás
• Las respuestas de texto las revisa un instructor, no son automáticas
• El certificado final se genera cuando completás todos los módulos
```

#### 4. Tarjeta "Truco de memoria" — diseño especial

Cada truco de memoria tiene un diseño visual diferente al resto del contenido. No es un párrafo más — es una tarjeta destacada:

```
┌─────────────────────────────────────────────────┐
│ 🧠  TRUCO PARA RECORDAR                         │
│ ─────────────────────────────────────────────── │
│                                                 │
│   Pensá en el estadístico como el NOTARIO      │
│   del partido.                                  │
│                                                 │
│   Un notario no opina, no interpreta, no toma  │
│   partido. Solo da fe de lo que ocurrió,       │
│   con precisión y en el momento justo.         │
│                                                 │
└─────────────────────────────────────────────────┘

Estilo: fondo levemente coloreado (azul claro o amarillo claro),
borde izquierdo accent color, ícono 🧠, 
tipografía levemente más grande que el cuerpo
```

#### 5. Tarjeta "Caso práctico"

```
┌─────────────────────────────────────────────────┐
│ 🏀  CASO PRÁCTICO                               │
│ ─────────────────────────────────────────────── │
│                                                 │
│  #22 blanco va al aro. El defensor #7 azul     │
│  lo foul mientras el balón está en el aire.    │
│  La pelota entra de todas formas.              │
│                                                 │
│  ¿Qué registrás?                               │
│                                                 │
│              [ Ver respuesta ]                  │
│                                                 │
│  ┌ respuesta oculta hasta click ─────────────┐ │
│  │ ✅ FGM para #22 + falta para #7 +         │ │
│  │    tiro libre adicional (2+1)             │ │
│  └────────────────────────────────────────── ┘ │
└─────────────────────────────────────────────────┘

Estilo: fondo blanco con borde verde accent,
respuesta oculta por defecto con botón toggle,
checkmark verde al revelar la respuesta
```

#### 6. Tabla resumen con highlighting

Las tablas de resumen al final de cada módulo deben tener:
- Zebra striping (filas alternadas)
- Columna de ✅/❌ con color (verde/rojo) no solo texto
- En mobile: colapsar a tarjetas apiladas

#### 7. Barra de progreso del módulo (secciones)

```
Sección 3 de 6 — Situaciones especiales
[████████░░░░░░░░░░] 50%
```

Actualiza en tiempo real al avanzar secciones.

#### 8. Mini quiz integrado — no al final solo

Los quizzes de opción múltiple van inline dentro de una sección, no todos juntos al final. Cuando el usuario responde:

```
Si responde CORRECTO:
┌─────────────────────────────────────────────────┐
│ ✅ ¡Correcto!                                   │
│ Exacto — si el jugador fue fouled y no convirtió│
│ no hay FGA. Va a tirar tiros libres.           │
│                    [ Siguiente sección → ]      │
└─────────────────────────────────────────────────┘

Si responde INCORRECTO:
┌─────────────────────────────────────────────────┐
│ ❌ No es esa.                                   │
│ Recordá: si fue fouled EN el tiro y no entró   │
│ → no hay FGA. El árbitro otorga tiros libres.  │
│                    [ Intentar de nuevo ]        │
└─────────────────────────────────────────────────┘
```

---

### Estructura de secciones recomendada por módulo

Cada módulo se divide así en el frontend:

```
Sección 1: Introducción / Por qué importa este tema (1-2 min lectura)
Sección 2: Definición oficial + explicación simple (3-5 min)
Sección 3: Truco de memoria (1 min)
Sección 4: Estadísticas detalladas con tarjetas expandibles (5-10 min)
Sección 5: Situaciones especiales (5-10 min)
Sección 6: Casos prácticos con respuesta oculta (5-10 min)
Sección 7: Tabla resumen (2 min)
Sección 8: Quiz de la sección (3-5 min)
```

---

## PARTE 2: CONTENIDO EXPANDIDO — ¿Qué hace exactamente un estadístico?

### Sección 4 del Módulo 1 — Tarjetas expandibles

Este bloque reemplaza la lista simple. Cada ítem es una tarjeta expandible.

---

#### ACCIONES OFENSIVAS

---

**Tarjeta 1: FGA — Field Goal Attempt**

**En español:** Intento de tiro de campo  
**Abreviatura:** FGA

**Qué es:**  
Se registra cada vez que un jugador lanza, tira o toca el balón hacia el aro rival con intención de anotar, mientras el balón está vivo. Es la unidad básica de la estadística de tiro.

**¿Incluye todo tipo de tiro?**  
Sí. Dobles, triples, mates, lay-ups, tiros en gancho, tiros al final del cuarto — todos son FGA si el balón estaba vivo y la intención era anotar.

**Ejemplo:**  
#7 lanza un triple. La pelota toca el aro y sale. → Se registra **1 FGA** para #7.  
#11 va al aro y mete un mate. → Se registra **1 FGA + 1 FGM** para #11.

**Lo que NO es FGA:**  
Un pase largo que accidentalmente entra al aro. Si no había intención de anotar, no es FGA.

---

**Tarjeta 2: FGM — Field Goal Made**

**En español:** Canasta convertida  
**Abreviatura:** FGM

**Qué es:**  
Se registra cuando un FGA resulta en una canasta válida. Un FGM **siempre** incluye también un FGA — son la misma jugada, pero con resultado positivo. El software lo registra automáticamente como ambos.

**Valores posibles:**  
- **2FGM:** canasta desde zona de dos puntos  
- **3FGM:** canasta desde detrás de la línea de tres puntos  
- El valor en puntos lo determina la posición del jugador, no el tipo de tiro

**Ejemplo:**  
#7 convierte un triple. → **1 FGA + 1 FGM** (el software escribe "3FGM #7").  
#22 mete un doble. → **1 FGA + 1 FGM** (el software escribe "2FGM #22").

**Dato importante:**  
Si el jugador fue fouled mientras lanzaba y la canasta ENTRÓ → FGM + tiro libre adicional. Si NO entró → solo tiros libres, sin FGA.

---

**Tarjeta 3: FTA — Free Throw Attempt**

**En español:** Intento de tiro libre  
**Abreviatura:** FTA

**Qué es:**  
Se registra cada vez que un jugador lanza un tiro libre. Los tiros libres son la consecuencia de ciertas faltas. Cada tiro libre que se intenta, entra o no, es una FTA.

**¿Cuándo se generan tiros libres?**  
- Falta en el acto de tiro (el tirador recibe los tiros libres)  
- Equipo contrario en situación de bonus (a partir de cierto número de faltas de equipo por cuarto)  
- Faltas técnicas o antideportivas  
- Faltas descalificantes

**Ejemplo:**  
#5 recibe falta en el acto de tiro en zona de dos. El árbitro otorga 2 tiros libres.  
#5 convierte el primero y falla el segundo.  
→ Se registran **2 FTA + 1 FTM** para #5.

**Caso especial:**  
Si un defensor comete una violación durante el tiro libre y el tiro falla → **no se registra FTA** para ese intento. Se le da al jugador un nuevo tiro libre sustituto.

---

**Tarjeta 4: FTM — Free Throw Made**

**En español:** Tiro libre convertido  
**Abreviatura:** FTM

**Qué es:**  
Se registra cuando un tiro libre entra. Cada FTM vale 1 punto. Al igual que FGM con FGA, un FTM siempre incluye también un FTA.

**Ejemplo:**  
#5 convierte ambos tiros libres de una falta. → **2 FTA + 2 FTM** para #5 (2 puntos).

---

**Tarjeta 5: AST — Assist (Asistencia)**

**En español:** Asistencia  
**Abreviatura:** AST o ASST

**Qué es:**  
Un pase que lleva directamente a que un compañero convierta una canasta. La asistencia reconoce al jugador que "preparó" la canasta con su pase.

**Regla clave:**  
Solo el **último pase antes de la canasta** puede ser asistencia. No importa si un pase anterior creó toda la jugada — la asistencia es del último que pasó.

**¿Siempre que alguien pasa y el receptor convierte hay asistencia?**  
No. Si el receptor tuvo que superar a su defensor en una acción 1 vs 1 clara, no hay asistencia. La asistencia reconoce que la canasta fue consecuencia directa del pase, sin que el tirador necesitara "ganarse" el tiro.

**Ejemplo con asistencia:**  
#8 pasa a #11 dentro de la zona. #11 convierte un lay-up sin driblar.  
→ **FGM #11 + AST #8** ✅

**Ejemplo sin asistencia:**  
#8 pasa a #11 afuera del perímetro. #11 dribblea, supera a su defensor, y convierte.  
→ **FGM #11** (sin AST, porque #11 superó a su defensor) ❌

---

**Tarjeta 6: TO — Turnover (Pérdida de balón)**

**En español:** Pérdida de balón / Turnover  
**Abreviatura:** TO

**Qué es:**  
Un error del equipo que ataca que resulta en que el equipo rival obtiene la posesión del balón. Puede ser por:  
- Pase malo (bad pass)  
- Pérdida de manejo (ball handling)  
- Violación (viaje, 3 segundos, 8 segundos, violación de shot clock)  
- Falta ofensiva  
- Goaltending ofensivo

**Importante:**  
Solo el equipo que **tiene la posesión** puede cometer una pérdida. Si el equipo defensor comete una violación, no es una pérdida del atacante.

**Ejemplo:**  
#3 hace un pase que va directo al defensor rival.  
→ **TO (pase malo) #3**

**Ejemplo de equipo:**  
El equipo no logra tirar antes de que venza el shot clock.  
→ **TO (shot clock violation) equipo** ← se registra al equipo, no a un jugador individual

---

#### ACCIONES DEFENSIVAS

---

**Tarjeta 7: REB — Rebound (Rebote)**

**En español:** Rebote  
**Abreviatura:** REB

**Qué es:**  
La recuperación controlada de un balón vivo después de un tiro fallado (FGA o último FTA). El rebote registra quién recuperó la posesión después de un tiro errado.

**Dos tipos:**

**OREB — Offensive Rebound (Rebote ofensivo):**  
El equipo que falló el tiro recupera la pelota. Continúa la misma posesión.  
Ejemplo: #7 falla un tiro. Su compañero #11 agarra el rebote.  
→ **FGA #7 + OREB #11**

**DREB — Defensive Rebound (Rebote defensivo):**  
El equipo que NO tiró recupera la pelota. La posesión cambia.  
Ejemplo: #7 falla un tiro. El rival #4 agarra el rebote.  
→ **FGA #7 + DREB #4**

**Rebote de equipo:**  
Si el balón sale fuera sin que nadie lo agarre, el rebote se le asigna al equipo (no a un jugador individual).

---

**Tarjeta 8: STL — Steal (Robo)**

**En español:** Robo de balón  
**Abreviatura:** STL

**Qué es:**  
Se le otorga a un jugador defensor cuando sus acciones causan directamente que el equipo atacante cometa una pérdida de balón. El robo siempre debe involucrar tocar el balón.

**Regla clave:**  
Si hay un robo, **siempre debe haber una pérdida correspondiente** en el equipo atacante.  
Lo contrario no aplica: puede haber pérdida sin que haya robo.

**¿Cuándo hay robo?**  
- Interceptar un pase  
- Arrancar o desviar la pelota a un jugador que dribblea  
- Recoger una pelota suelta después de un error del atacante

**¿Cuándo NO hay robo?**  
- El balón muere (out of bounds) aunque el defensor lo haya tocado  
- Falta ofensiva (no se registra robo para el defensor)

**Ejemplo:**  
#4 azul intercepta un pase del equipo rojo.  
→ **TO (pase malo) #3 rojo + STL #4 azul**

---

**Tarjeta 9: BS — Blocked Shot (Tapón)**

**En español:** Tapón / Bloqueo de tiro  
**Abreviatura:** BS o BLK

**Qué es:**  
Se le otorga al defensor cuando hace contacto significativo con el balón durante un intento de tiro (FGA) y altera su trayectoria de forma que el tiro falla.

**Condición clave:**  
El tapón solo existe si el tiro FALLA. Si el jugador toca la pelota y de todas formas entra, no hay tapón.

**¿Puede taponearse antes de que el balón salga de la mano?**  
Sí. Si el balón estaba por encima de la altura del hombro y el defensor lo desvía, es FGA + tapón.  
Si el balón estaba por debajo del hombro, no es FGA — es pérdida + robo.

**Ejemplo:**  
#33 blanco salta y desvía el tiro de #11 negro. El tiro no entra.  
→ **FGA #11 negro + BS #33 blanco + rebote correspondiente**

**Ejemplo donde NO hay tapón:**  
#33 blanco toca el tiro de #11 negro, pero la pelota igual entra.  
→ **FGM #11 negro** (el toque no alteró la trayectoria suficientemente)

---

#### FALTAS

---

**Tarjeta 10: PF — Personal Foul (Falta personal)**

**En español:** Falta personal  
**Abreviatura:** PF

**Qué es:**  
Una falta cometida por un jugador al hacer contacto ilegal con un rival. Es el tipo de falta más común. Se registra contra el jugador que la cometió y a favor del jugador que la recibió.

**Tipos de faltas personales:**  
- **Falta no en el tiro:** el atacante no estaba en el acto de tiro → el equipo atacante saca de banda (o tiros libres si hay bonus)  
- **Falta en el tiro:** el atacante estaba tirando → tiros libres  
- **Falta de control de equipo (offensive foul):** es el atacante quien comete la falta → pérdida de balón  
- **Falta técnica:** por conducta antideportiva del jugador  
- **Falta antideportiva (unsportsmanlike):** contacto excesivo o intencional  
- **Falta descalificante:** la más grave, el jugador abandona el partido

**Siempre se registran dos lados:**  
- PF al jugador que la cometió  
- Foul Drawn (falta recibida) al jugador que la recibió

**Ejemplo:**  
#7 azul le pega en el brazo a #5 blanco que iba al aro.  
→ **PF #7 azul + Foul Drawn #5 blanco** (+ tiros libres si corresponde)

---

#### DATOS ADICIONALES (calculados automáticamente por el software)

---

**Tarjeta 11: Puntos en la zona (Points in the Paint)**

**En español:** Puntos en el pituco / en la zona  
**Técnico:** Points in the Paint

**Qué es:**  
Total de puntos que un equipo anotó con canastas desde dentro de la zona restringida (el área pintada debajo del aro). Incluye lay-ups, mates, tiros en gancho, etc.

Este dato lo calcula el software automáticamente según la posición de cada FGM. Vos no tenés que registrarlo manualmente.

---

**Tarjeta 12: Puntos de contraataque (Fast-Break Points)**

**En español:** Puntos de contraataque  
**Técnico:** Fast-Break Points

**Qué es:**  
Puntos anotados rápidamente (en menos de 8 segundos) después de un cambio de posesión, antes de que la defensa rival se organize en su zona.

El cambio de posesión puede venir de un robo, rebote defensivo o canasta convertida. Los puntos de contraataque incluyen FGM y FTM dentro de esa posesión de transición.

**Ejemplo:**  
#4 roba la pelota → pasa a #8 que va solo al aro → #8 convierte el lay-up.  
→ **FGM #8 = Fast-Break Points** (la defensa no tuvo tiempo de organizarse)

---

**Tarjeta 13: Puntos de segunda oportunidad (Second Chance Points)**

**En español:** Puntos de segunda oportunidad  
**Técnico:** Second Chance Points

**Qué es:**  
Puntos que se anotan después de un rebote ofensivo, antes de que el rival recupere la posesión. Son los puntos que "no deberían haber sido" porque el equipo ya había fallado el tiro, pero gracias al rebote ofensivo tuvieron otra oportunidad.

**Ejemplo:**  
#7 falla un tiro. #11 agarra el rebote ofensivo y convierte.  
→ **OREB #11 + FGM #11 = Second Chance Points**

---

## PARTE 3: ESTRUCTURA DE BASE DE DATOS PARA SECCIONES

Agregar al schema de Prisma (complementa el spec principal):

```prisma
// Agregar al modelo Modulo existente:
model SeccionModulo {
  id          String   @id @default(uuid())
  moduloId    String
  titulo      String
  contenido   String   @db.Text  // markdown con soporte de componentes especiales
  tipo        TipoSeccion
  orden       Int
  tieneQuiz   Boolean  @default(false)
  createdAt   DateTime @default(now())

  modulo      Modulo   @relation(fields: [moduloId], references: [id], onDelete: Cascade)
  quizzes     QuizSeccion[]
  progreso    ProgresoSeccion[]

  @@map("secciones_modulo")
}

enum TipoSeccion {
  INTRO
  CONCEPTO
  TRUCO_MEMORIA
  ESTADISTICAS_EXPANDIBLES
  SITUACIONES_ESPECIALES
  CASOS_PRACTICOS
  TABLA_RESUMEN
  QUIZ
}

model ProgresoSeccion {
  id          String   @id @default(uuid())
  usuarioId   String
  seccionId   String
  completado  Boolean  @default(false)
  completadoEn DateTime?

  usuario     Usuario        @relation(fields: [usuarioId], references: [id])
  seccion     SeccionModulo  @relation(fields: [seccionId], references: [id])

  @@unique([usuarioId, seccionId])
  @@map("progreso_secciones")
}

// Para los consejos - guardar si el usuario ya los vio
// Agregar al modelo Usuario:
// vioConsejos Boolean @default(false)
// vioConsejosEn DateTime?
```

---

## PARTE 4: COMPONENTE REACT RECOMENDADO — Tarjeta expandible de estadística

```tsx
// /components/cursos/TarjetaEstadistica.tsx
'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TarjetaEstadisticaProps {
  abreviatura: string
  nombreES: string
  nombreEN: string
  icono: string
  descripcion: string
  reglasClave: string[]
  ejemplos: { situacion: string; resultado: string }[]
  noEs?: string // qué NO es esa estadística
}

export function TarjetaEstadistica({
  abreviatura, nombreES, nombreEN, icono,
  descripcion, reglasClave, ejemplos, noEs
}: TarjetaEstadisticaProps) {
  const [abierta, setAbierta] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      {/* Header — siempre visible */}
      <button
        onClick={() => setAbierta(!abierta)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icono}</span>
          <div>
            <span className="font-semibold text-base">{abreviatura}</span>
            <span className="text-muted-foreground mx-2">—</span>
            <span className="text-muted-foreground">{nombreEN}</span>
          </div>
        </div>
        {abierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Contenido expandido */}
      {abierta && (
        <div className="px-4 pb-4 pt-0 border-t border-border">
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-1">En español</p>
            <p className="font-medium mb-4">{nombreES}</p>

            <p className="text-sm mb-4">{descripcion}</p>

            {reglasClave.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Reglas clave</p>
                <ul className="space-y-1">
                  {reglasClave.map((regla, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{regla}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ejemplos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Ejemplos</p>
                <div className="space-y-2">
                  {ejemplos.map((ej, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground mb-1">🏀 {ej.situacion}</p>
                      <p className="font-medium text-green-700 dark:text-green-400">→ {ej.resultado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {noEs && (
              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-sm">
                <p className="text-red-700 dark:text-red-400 font-medium mb-1">❌ Lo que NO es {abreviatura}</p>
                <p className="text-red-600 dark:text-red-300">{noEs}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

*Este documento es el complemento de UI/UX al CPB_MASTER_SPEC.md.*
*Implementar en Sprint 3 (módulo de cursos) junto con el contenido de los módulos.*
-e 

---


# CURSO INICIAL PARA ESTADÍSTICOS — CPB
## Contenido completo · Módulos 1 al 3

---

# MÓDULO 1
## El rol del estadístico en el basketball
**Duración estimada:** 45 min  
**Objetivo:** Entender qué hace un estadístico, por qué importa y cuál es la mentalidad correcta para el rol.

---

### ¿Por qué existen los estadísticos?

El basketball es uno de los deportes más rápidos del mundo. En 40 minutos de juego pueden suceder más de 200 jugadas distintas: tiros, rebotes, pérdidas, faltas, robos. Nadie puede recordarlas todas. Por eso existe el estadístico: para capturar todo lo que pasa en la cancha con precisión, en tiempo real.

Pero no es solo llenar una planilla. Las estadísticas que vos registrás tienen consecuencias reales:

- Los **entrenadores** las usan durante el partido para tomar decisiones tácticas
- Las **federaciones** las usan para rankings, selecciones nacionales y acreditaciones
- Los **medios de comunicación** las usan para informar al público
- Los **jugadores** las usan para entender su propio rendimiento
- Los **scouts** las usan para detectar talentos

Un número mal registrado puede cambiar la historia de un partido. Un patrón de errores puede afectar la carrera de un jugador. **Tu trabajo importa más de lo que parece.**

---

### ¿Qué hace exactamente un estadístico?

Durante el partido, el estadístico registra en tiempo real:

**Acciones ofensivas:**
- Tiros de campo intentados (FGA) y convertidos (FGM)
- Tiros libres intentados (FTA) y convertidos (FTM)
- Asistencias (AST)
- Pérdidas de balón (TO)

**Acciones defensivas:**
- Rebotes ofensivos y defensivos (REB)
- Robos (STL)
- Tapones (BS)

**Faltas:**
- Faltas personales, técnicas, antideportivas, descalificantes
- Faltas recibidas

**Datos adicionales:**
- Puntos en el pituco (paint)
- Puntos de contraataque (fast-break points)
- Puntos de segunda oportunidad (second chance points)

---

### Los 5 principios del buen estadístico

Estos principios vienen directo del Manual FIBA 2024 y son la base de todo lo que vas a aprender en este curso.

#### 1. Registrás lo que VES, no lo que querés que pase
No importa si tu equipo favorito juega. No importa si el jugador es estrella o suplente. Registrás lo que realmente sucedió. Si una asistencia no fue asistencia, no la anotás. Si un tiro libre no entró, es una FTA sin FTM.

#### 2. Las mismas reglas para los dos equipos, siempre
Si algo es asistencia para el equipo A, es asistencia para el equipo B en la misma situación. La consistencia es no negociable.

#### 3. Ante la duda, no inventés
Si no viste bien la jugada, no adivinés. Hay situaciones ambiguas — el manual FIBA las cubre — pero si genuinamente no sabés qué pasó, es mejor pedir criterio al jefe de mesa que registrar algo incorrecto.

#### 4. Los datos no se comparten hasta la publicación oficial
El marcador parcial, las estadísticas individuales, cualquier dato del partido — no se comparte con nadie externo mientras el partido está en curso. Esto incluye redes sociales, mensajes de texto, y conversaciones en la mesa.

#### 5. Trabajás en equipo con la mesa de oficiales
El estadístico es parte de un equipo que incluye el anotador, el cronometrador y el operador del marcador de 24 segundos. Todos deben estar coordinados. Si hay una duda, se comunican internamente antes de registrar.

---

### Las herramientas que vas a usar

Según el nivel de competencia, el estadístico trabaja con:

**Planilla oficial FIBA** (en papel o digital)  
Es el documento base. Tiene columnas para cada acción, por cuarto, por jugador. Aprender a leerla y completarla correctamente es obligatorio.

**Software estadístico**  
En competencias oficiales se usa software como FIBA LiveStats o Genius Sports. El software ayuda a calcular automáticamente algunos totales, pero vos seguís siendo responsable de que los datos de entrada sean correctos. *Basura entra, basura sale.*

**Conocimiento profundo de las Reglas Oficiales de Basketball**  
Esto es clave. Sin entender cuándo hay falta, cuándo hay posesión, o cuándo termina una jugada, no podés registrar correctamente. Este curso asume que conocés las reglas básicas. Si no las conocés bien, te recomendamos repasar el reglamento FIBA antes de continuar.

---

### 🧠 Truco para recordar tu rol

Pensá en el estadístico como el **notario del partido**. Un notario no opina, no interpreta más allá de lo que ve, no toma partido. Solo da fe de lo que ocurrió, con precisión y en el momento justo. Si algo no fue claro, lo consulta antes de firmarlo.

---

### ✅ Resumen del módulo

| Concepto | Lo que necesitás saber |
|----------|----------------------|
| Para qué sirven las estadísticas | Decisiones tácticas, rankings, prensa, scouts |
| Qué registrás | FGA/FGM, FTA/FTM, REB, AST, TO, STL, BS, faltas |
| Principio #1 | Registrás lo que VES, no lo que querés |
| Principio #2 | Mismas reglas para ambos equipos |
| Principio #3 | Ante la duda, no inventés |
| Tu herramienta principal | Planilla FIBA + software estadístico |

---

### 📝 Quiz rápido — Módulo 1

**Pregunta 1:** El equipo local convierte una canasta espectacular. Vos no estás seguro si el jugador tenía un pie en la línea de tres puntos o no. ¿Qué hacés?
- A) Lo anotás como triple porque fue espectacular  
- B) Lo anotás como doble y seguís  
- **C) Consultás con el árbitro o el jefe de mesa para confirmar antes de registrar**  
- D) No anotás nada y esperás el replay

**Pregunta 2:** Un jugador del equipo visitante (el que a vos no te gusta) hace un robo increíble. Según el principio de consistencia, ¿qué anotás?
- A) Nada, porque el equipo local va a recuperar el balón
- **B) Robo (STL) para el jugador visitante y pérdida (TO) para el local**  
- C) Solo la pérdida, el robo no es tan importante
- D) Depende de si el robo fue intencional

---

# MÓDULO 2
## La posesión: el concepto que lo explica todo
**Duración estimada:** 50 min  
**Objetivo:** Dominar el concepto de posesión porque TODAS las demás estadísticas dependen de entender cuándo un equipo tiene la pelota y cuándo la pierde.

---

### Por qué la posesión es el concepto más importante

Antes de poder registrar un rebote, tenés que saber quién tenía la posesión. Antes de registrar una pérdida, tenés que saber quién estaba en control. Antes de decidir si un rebote es ofensivo o defensivo, tenés que saber quién atacaba.

**La posesión es el punto de partida de todo.**

Si entendés bien la posesión, el 80% de las situaciones complejas se resuelven solas.

---

### Definición oficial (FIBA 2024)

La posesión de un equipo **comienza** cuando:
- Un jugador de ese equipo tiene el control de un balón vivo (lo sostiene o lo driblea)
- O el balón está a disposición de un jugador para ser jugado

La posesión **continúa** mientras:
- Un jugador de ese equipo tiene control del balón
- O el balón se está pasando entre compañeros

La posesión **termina** cuando:
- El equipo rival gana el control del balón
- Se convierte una canasta (FGM) o el último tiro libre (FTM)
- Se falla un tiro (FGA o último FTA) y el rival obtiene el rebote defensivo

---

### 🧠 Truco para entender la posesión: la regla del "semáforo"

Imaginá un semáforo para cada equipo:

🟢 **Verde = Posesión activa** → El equipo tiene el balón. Pueden cometer pérdidas, faltas ofensivas. Solo ellos pueden anotar.

🟡 **Amarillo = Posesión en transición** → El balón está en el aire (pase o tiro). Nadie tiene control definitivo todavía.

🔴 **Rojo = Sin posesión** → El otro equipo tiene el balón.

Cuando registrás cualquier estadística, primero preguntate: ¿quién tiene el verde?

---

### Cuándo el control importa (y cuándo no)

El manual FIBA introduce el concepto de **"mini-posesiones"**: situaciones donde el control cambia por una fracción de segundo de un equipo al otro y vuelve.

**Ejemplo real:** Un defensor roza el balón que está en manos de un atacante, el balón rebota en el cuerpo del atacante y lo recupera.

¿Hubo una nueva posesión para el defensor? **No.** Para efectos estadísticos, ese toque no cuenta como cambio de posesión.

La regla práctica: si el cambio de control fue tan breve que no permitió al equipo hacer nada con el balón, tratalo como si no hubiera ocurrido.

---

### Situaciones comunes y cómo resolverlas

#### Situación 1: Canasta convertida
Equipo A convierte. La posesión del equipo A **termina** en el momento exacto de la canasta. El equipo B **comienza** su posesión cuando saca de fondo.

#### Situación 2: Tiro fallado + rebote ofensivo
Equipo A falla el tiro. El jugador A5 atrapa el rebote.

¿Terminó la posesión del equipo A? **No.** Un rebote ofensivo es la continuación de la misma posesión. No es una nueva posesión. El equipo A sigue atacando.

Esto importa para las estadísticas avanzadas (puntos por posesión, por ejemplo).

#### Situación 3: Tiro fallado + rebote defensivo
Equipo A falla el tiro. El jugador B3 atrapa el rebote.

Ahora sí: la posesión del equipo A **termina**. La posesión del equipo B **comienza**.

#### Situación 4: Pelota dividida (held ball)
Dos jugadores de equipos distintos agarran la pelota al mismo tiempo. Los árbitros cobran "pelota dividida" y la flecha de posesión alterna determina quién se la lleva.

- Si la flecha favorece al equipo atacante → **no se registra nada** (siguen en posesión)
- Si la flecha favorece al equipo defensor → **pérdida para el atacante** + considerar si hubo robo

---

### Casos prácticos — ¿Quién tiene la posesión?

> **Caso A:** El jugador #7 del equipo rojo está dribbleando. El defensor #4 del equipo azul le mete la mano y toca la pelota brevemente, pero #7 la recupera y sigue dribbleando.
>
> ¿Quién tiene la posesión? → **Equipo rojo** (mini-posesión, no cuenta el toque)

> **Caso B:** El jugador #7 rojo pasa la pelota. El pase es interceptado por #4 azul, quien la agarra firmemente.
>
> ¿Quién tiene la posesión? → **Equipo azul** (intercepción = nueva posesión) → se registra pérdida + robo

> **Caso C:** El equipo rojo falla un tiro. La pelota rebota, dos jugadores de ambos equipos saltan al mismo tiempo. La flecha de posesión alterna favorece al equipo azul.
>
> ¿Quién tiene la posesión? → **Equipo azul** → pérdida para equipo rojo (por mini-posesión en situación de pelota dividida)

> **Caso D:** El jugador #7 rojo falla un tiro de tres. La pelota toca el aro, rebota hacia afuera y #7 rojo la agarra de nuevo y tira.
>
> ¿Hubo una nueva posesión? → **No.** El rebote ofensivo es continuación de la misma posesión del equipo rojo.

---

### ⚠️ Error más común en este módulo

Confundir **posesión para estadísticas** con **posesión según las reglas de juego**.

El reglamento FIBA define posesión de una manera para cobrar violaciones (como los 8 segundos). Las estadísticas usan una definición **similar pero no idéntica**. En este curso aprendés la definición estadística. No siempre coinciden.

---

### ✅ Resumen del módulo

| Concepto | Clave |
|----------|-------|
| La posesión empieza | Cuando un jugador tiene el balón vivo o está a su disposición |
| La posesión termina | Rival gana control / canasta convertida / rebote defensivo |
| Mini-posesión | Cambio de control tan breve que no cuenta estadísticamente |
| Rebote ofensivo | Continúa la misma posesión, NO es una nueva posesión |
| Pelota dividida | Depende de la flecha alterna: puede ser pérdida o nada |

---

### 📝 Quiz rápido — Módulo 2

**Pregunta 1:** El equipo A falla un tiro. El jugador A5 salta y toca la pelota para intentar meterla, pero no entra. El jugador A8 agarra el rebote. ¿Qué registrás?
- A) Nueva posesión para el equipo A + nueva estadística de posesión
- **B) Continuación de la misma posesión del equipo A + rebote ofensivo A8**
- C) Pérdida del equipo A porque fallaron el tiro
- D) Nada hasta que alguien convierta

**Pregunta 2:** ¿En cuál de estas situaciones la posesión estadística del equipo atacante TERMINA definitivamente?
- A) Un defensor toca la pelota mientras el atacante driblea pero él la recupera
- B) El atacante falla un tiro y su compañero agarra el rebote ofensivo
- **C) El atacante falla un tiro y el defensor agarra el rebote**
- D) El atacante hace un pase que su compañero atrapa

**Pregunta 3 (texto abierto):** Describí con tus palabras qué es una "mini-posesión" y por qué no se registra estadísticamente.

---

# MÓDULO 3
## Tiros de campo (Field Goals): FGA y FGM
**Duración estimada:** 75 min  
**Objetivo:** Saber exactamente cuándo registrar un intento de tiro (FGA) y cuándo registrar una canasta convertida (FGM), incluyendo todas las situaciones especiales.

---

### Los dos términos que más vas a usar

**FGA — Field Goal Attempt (Intento de tiro de campo)**  
Se registra cuando un jugador lanza, tira o toca con control el balón vivo hacia el aro rival en un intento de anotar.

**FGM — Field Goal Made (Canasta convertida)**  
Se registra cuando ese intento resulta en una canasta. Un FGM **siempre** cuenta también como FGA. El software lo registra automáticamente.

---

### 🧠 Truco para recordar cuándo registrar FGA

La pregunta que te hacés cada vez que ves un tiro:

> **"¿El jugador estaba intentando meter la pelota en el aro, con el balón vivo?"**

Si la respuesta es SÍ → FGA.  
Si la respuesta es NO → no es FGA.

Así de simple como punto de partida. Ahora veamos los casos que complican todo.

---

### ¿Desde dónde se puede tirar?

Un FGA puede ocurrir **desde cualquier punto de la cancha**. No importa dónde está parado el jugador — si el movimiento tiene intención de anotar, es FGA.

Esto incluye:
- Tiros de media cancha al final del cuarto (si el balón salió de la mano antes del buzzer)
- Tip-ins (toques en el aire intentando meter la pelota) — siempre que haya control e intención
- Tiros bloqueados — se registra FGA igualmente

---

### Situaciones especiales — Las que más confunden

#### Caso 1: Falta durante el tiro

**Regla:** Si el jugador recibe una falta EN el acto de tiro y **no convierte** la canasta → **NO se registra FGA**. Va a tirar tiros libres.

Si recibe la falta EN el acto de tiro y **convierte** la canasta → **SÍ se registra FGM** (y también se agregan los tiros libres).

> **Ejemplo real:**
> #22 blanco va al aro, el defensor lo foul antes de que el tiro salga. El árbitro para el juego.
> → **No se registra FGA.** #22 tira tiros libres.
>
> #22 blanco va al aro, lanza, el defensor lo foul mientras el balón está en el aire, y la pelota entra.
> → **FGM para #22** + tiros libres (el 1+1 o 2+1 según corresponda).

#### Caso 2: Falta del atacante durante el tiro

Si el jugador que ataca comete una falta **antes** de que el tiro salga → **NO hay FGA** (falta de equipo en control).

Si la falta del atacante ocurre **después** de que el tiro salió → **SÍ hay FGA**, aunque la canasta no cuente.

> **La clave:** ¿El balón ya estaba en el aire cuando ocurrió la falta?
> Los árbitros te lo indican: si es falta de control de equipo, el tiro no contó. Si el árbitro no señala control de equipo, el tiro ya estaba en el aire.

#### Caso 3: Tiro bloqueado

Si la pelota es bloqueada → **SÍ se registra FGA** (+ blocked shot para el defensor). No importa si el balón ya salió de la mano o no.

Ojo: el bloqueo solo se registra si el defensor **altera significativamente la trayectoria** de la pelota y el tiro falla. Si el defensor toca la pelota pero entra igual → FGM, pero **no hay blocked shot**.

#### Caso 4: Goaltending defensivo

El defensor toca ilegalmente la pelota cuando ya está en trayectoria descendente hacia el aro. Los árbitros cobran goaltending.

→ **Se otorga FGM** al tirador, aunque la pelota no haya entrado.  
→ **No hay estadística** para el jugador que cometió el goaltending.

#### Caso 5: Goaltending ofensivo

Un atacante toca ilegalmente la pelota cuando está sobre el aro.

→ **No hay FGA** para el tirador.  
→ Se registra una **pérdida de balón (TO)** para el jugador que cometió el goaltending ofensivo.

#### Caso 6: Canasta en el propio aro (own basket)

Un defensor, accidentalmente, mete la pelota en su propio aro.

→ Los puntos se le acreditan al **capitán en cancha del equipo rival** como FGM.  
→ Si esto ocurrió durante una situación de rebote, el equipo atacante también recibe un **rebote ofensivo de equipo**.
→ Si el mismo equipo tenía posesión antes de meter en su propio aro, se registra también una **pérdida de balón**.

---

### Fast-break points (Puntos de contraataque)

Se consideran puntos de contraataque cuando:
1. Hubo un cambio de posesión (pérdida, rebote defensivo, o canasta convertida)
2. El equipo anotó en **menos de 8 segundos** antes de que la defensa pudiera organizarse en media cancha

Los puntos de contraataque pueden incluir tanto FGM como FTM, si la falta ocurrió durante el contraataque.

> **Tip práctico:** Si ves que el equipo sale corriendo rápido después de recuperar la pelota y anota antes de que los defensores crucen la línea media, probablemente son fast-break points. El cronómetro y el contexto visual te confirman.

---

### Tabla resumen: ¿Registrás FGA o no?

| Situación | FGA? | FGM? |
|-----------|------|------|
| Tiro normal que entra | ✅ | ✅ |
| Tiro normal que falla | ✅ | ❌ |
| Tiro al final del cuarto (balón salió antes del buzzer) | ✅ | Solo si entra |
| Jugador fouled en el tiro, canasta NO entra | ❌ | ❌ |
| Jugador fouled en el tiro, canasta SÍ entra | ✅ | ✅ |
| Tiro bloqueado | ✅ | ❌ |
| Goaltending defensivo | ✅ | ✅ (otorgada) |
| Goaltending ofensivo | ❌ | ❌ |
| Atacante comete falta ANTES de lanzar | ❌ | ❌ |
| Atacante comete falta DESPUÉS de lanzar | ✅ | Solo si entra |
| Tip-in controlado con intención | ✅ | Solo si entra |

---

### Casos prácticos — Decidí vos

> **Caso 1:** #11 negro va al aro. El defensor #4 blanco lo foul mientras #11 ya tiene el brazo en el aire lanzando. La pelota entra igual.
>
> ¿Qué registrás? → **FGM para #11 negro** + falta personal a #4 blanco + falta recibida por #11 negro. (El 2+1 le corresponde a #11)

> **Caso 2:** #8 verde intenta un mate (dunk). El defensor #33 amarillo le bate la pelota cuando todavía está a la altura de la cintura.
>
> ¿Qué registrás? → La pelota estaba **debajo de la altura del hombro** → **NO hay FGA ni blocked shot**. Es una **pérdida de balón para #8 verde** + robo para #33 amarillo (si el defensor recupera el control del balón vivo).

> **Caso 3:** Quedan 2 segundos. #6 rojo recibe el balón y lanza desde media cancha. Suena el buzzer mientras la pelota está en el aire. La pelota entra.
>
> ¿Qué registrás? → Si el balón salió de la mano de #6 antes del buzzer → **FGM** (triple si estaba en zona de tres). El árbitro confirma.

> **Caso 4:** #30 blanco lanza al aro. El defensor #7 azul toca la pelota en el aire, pero la pelota entra igual.
>
> ¿Qué registrás? → El toque no alteró la trayectoria suficientemente para impedir la canasta. → **FGM para #30 blanco**. **No hay blocked shot** para #7 azul.

---

### ⚠️ Los 3 errores más comunes en este módulo

**Error 1:** Registrar FGA cuando el jugador fue fouled en el tiro y no convirtió.
→ Recordá: si fue fouled Y no entró → no hay FGA, hay tiros libres.

**Error 2:** No registrar FGA cuando el tiro fue bloqueado.
→ El bloqueo no elimina el FGA. El intento existió.

**Error 3:** Confundir cuándo el balón estaba por debajo del hombro vs. ya en el aire.
→ La posición del balón en el momento del contacto determina si es FGA+bloqueo o pérdida+robo.

---

### ✅ Resumen del módulo

| Concepto | Lo que necesitás saber |
|----------|----------------------|
| FGA | Cualquier intento de anotar con balón vivo, desde cualquier lugar |
| FGM | FGA que resulta en canasta (siempre incluye FGA) |
| Falta durante tiro + canasta no entra | No hay FGA |
| Falta durante tiro + canasta entra | Sí hay FGM |
| Tiro bloqueado | Siempre hay FGA |
| Goaltending defensivo | FGM otorgada |
| Goaltending ofensivo | No hay FGA, hay pérdida |
| Pelota debajo del hombro | No es FGA, es pérdida/robo |

---

### 📝 Quiz rápido — Módulo 3

**Pregunta 1 (opción múltiple):**
#15 amarillo está yendo al aro. Antes de lanzar, el defensor #9 verde lo foul. El árbitro para el juego. #15 no llegó a lanzar. ¿Qué registrás?
- **A) No se registra FGA. #15 va a tirar tiros libres.**
- B) FGA para #15 amarillo + tiros libres
- C) FGA fallado para #15 + falta para #9
- D) Pérdida para #15 amarillo

**Pregunta 2 (opción múltiple):**
El defensor bate la pelota cuando está a la altura del ojo del atacante (arriba del hombro), la pelota sale a la tribuna. ¿Qué registrás?
- A) Pérdida + robo
- **B) FGA + blocked shot + el rebote corresponde según posesión**
- C) FGA + no hay blocked shot porque el balón salió
- D) No se registra nada hasta que el árbitro cobre

**Pregunta 3 (texto abierto):**
Explicá la diferencia entre goaltending defensivo y goaltending ofensivo, y qué estadísticas genera cada uno.

---

*Módulos 4 al 13 — próxima entrega*
-e 

---

# CURSO INICIAL PARA ESTADÍSTICOS — CPB
## Contenido completo · Módulos 4 al 13
### Basado en el Manual del Estadístico FIBA 2024 (Versión 1.0)

---

# MÓDULO 4
## Tiros libres (Free Throws): FTA y FTM
**Duración estimada:** 55 min
**Objetivo:** Registrar correctamente cada tiro libre incluyendo las situaciones de violación, que son las que más errores generan.

---

### Por qué los tiros libres son más complejos de lo que parecen

A primera vista, el tiro libre parece lo más fácil de registrar: el jugador tira, entra o no entra. Pero hay situaciones con violaciones — del defensor, del tirador, o del compañero — que cambian completamente qué se registra.

Dominar este módulo te va a salvar de los errores más frecuentes en partidos oficiales.

---

### Definiciones oficiales

**FTA — Free Throw Attempt (Intento de tiro libre)**
Se registra cada vez que un jugador lanza un tiro libre, **EXCEPTO** cuando hay violación defensiva y el tiro falla (en ese caso se repite y solo se registra el tiro sustituto).

**FTM — Free Throw Made (Tiro libre convertido)**
Se registra cuando el tiro libre entra y vale 1 punto.
Un FTM **siempre** incluye también un FTA. El software lo registra automáticamente.

---

### 🧠 Truco para recordar las violaciones

Usá la regla del **"¿quién arruinó el tiro?"**:

- **El defensor arruinó el tiro (violación defensiva):**
  - Si entró → **FTM** (el gol vale, se protege al tirador)
  - Si no entró → **no se registra nada** de ese tiro. Se repite. Solo registrás el sustituto.

- **El tirador o su compañero arruinaron el tiro (violación ofensiva):**
  - Si entró → **FTA sin FTM** (el gol se anula, igual cuenta el intento)
  - Si no entró → **FTA** normalmente

La lógica es justa: si el defensor hizo trampa, el tirador no pierde nada. Si el tirador o su equipo hicieron trampa, pagan las consecuencias.

---

### Situaciones especiales detalladas

#### Caso 1: Violación DEFENSIVA + tiro entra
El resultado del tiro vale. Se registra **FTM**.
El equipo defensor puede protestar, pero el punto es válido.

#### Caso 2: Violación DEFENSIVA + tiro NO entra
El tiro no se registra. Se le da al tirador un tiro sustituto.
Solo cuando ese tiro sustituto se ejecute, registrás el resultado.
Si el sustituto entra → **FTM**. Si falla → **FTA**.

#### Caso 3: Violación del TIRADOR
El tiro se anula aunque haya entrado. Se registra **FTA** (el intento existió, pero sin punto).
Si era el último de la serie → el equipo defensor recibe posesión fuera de banda + **rebote de equipo defensor**.

#### Caso 4: Violación de un COMPAÑERO del tirador
Igual que la violación del tirador: el tiro se anula, se registra **FTA**.
Si era el último de la serie → rebote de equipo defensor.

#### Caso 5: Jugador incorrecto tira el tiro libre
Los árbitros anulan los FTAs/FTMs resultantes del error. Se registra un **turnover de equipo**.

#### Caso 6: Falta técnica antes del inicio del período
Los tiros libres se tiran al comienzo del período siguiente. Las estadísticas se acreditan al **nuevo período**, no al anterior.

---

### Rebotes y tiros libres — la regla clave

**Los tiros libres que NO son el último de la serie NO generan rebote.**

¿Por qué? Porque el balón está muerto — si falla el primero de dos, el tirador simplemente tira el segundo. No hay disputa por la pelota.

**Solo el ÚLTIMO tiro libre fallado de una serie genera rebote** (y situación de posesión en disputa).

| Situación | ¿Hay rebote? |
|-----------|-------------|
| Falla el 1° de 2 tiros libres | ❌ No (balón muerto) |
| Falla el 2° de 2 tiros libres | ✅ Sí |
| Falla el único tiro libre de una técnica | ✅ Sí |
| Falla el 1° de 3 tiros libres (falta antideportiva) | ❌ No |
| Falla el 3° de 3 tiros libres | ✅ Sí |

---

### Casos prácticos

> **Caso A:** El jugador #5 azul lanza el primer tiro libre de dos. Mientras el balón está en el aire, un defensor pisa la línea de carril (violación defensiva). El tiro falla.
>
> ¿Qué registrás? → **Nada de ese tiro.** Se le da un tiro sustituto. Solo registrás el resultado del sustituto.

> **Caso B:** El jugador #5 azul lanza el segundo tiro libre de dos. Su compañero #8 azul pisa la línea (violación del compañero). El tiro entra.
>
> ¿Qué registrás? → **FTA para #5 azul, sin FTM.** El punto se anula. El equipo defensor recibe posesión. Rebote de equipo defensor.

> **Caso C:** El jugador #5 azul lanza el primer tiro libre de dos. El árbitro cobra violación ofensiva de #8 azul. El tiro falla.
>
> ¿Qué registrás? → **FTA para #5 azul.** El balón está muerto, el equipo defensor recibe posesión. Rebote de equipo defensor.

> **Caso D:** #5 azul lanza el primer de dos y convierte, luego el segundo y convierte.
>
> ¿Qué registrás? → **2 FTA + 2 FTM para #5 azul.** Simple.

---

### ⚠️ Los 3 errores más frecuentes en tiros libres

**Error 1:** Registrar FTA cuando hubo violación defensiva y el tiro falló.
→ No hay FTA. Se repite. Esperá el sustituto.

**Error 2:** No registrar FTA cuando el tirador violó pero el tiro entró.
→ El punto se anula PERO sí hay FTA. El intento fue real.

**Error 3:** Esperar el rebote después del primer tiro libre de una serie de dos.
→ No hay rebote hasta el último. El balón está muerto entre tiros.

---

### ✅ Tabla resumen

| Situación | FTA | FTM | Rebote |
|-----------|-----|-----|--------|
| Entra normalmente | ✅ | ✅ | No aplica |
| Falla normalmente (no es último) | ✅ | ❌ | ❌ |
| Falla normalmente (es último) | ✅ | ❌ | ✅ |
| Violación defensiva + entra | ✅ | ✅ | No aplica |
| Violación defensiva + falla | ❌ | ❌ | ❌ (se repite) |
| Violación ofensiva + entra | ✅ | ❌ | ✅ (equipo defensor) |
| Violación ofensiva + falla | ✅ | ❌ | ✅ (si es último) |

---

### 📝 Quiz — Módulo 4

**P1 (opción múltiple):**
El defensor comete violación de carril. El tiro libre falla. ¿Qué registrás?
- A) FTA sin FTM
- **B) Nada — se da un tiro sustituto y solo se registra ese**
- C) FTA + violación defensiva
- D) Rebote de equipo

**P2 (opción múltiple):**
¿En cuál de estos casos SÍ hay rebote después de un tiro libre?
- A) Falla el primer tiro libre de una serie de dos
- B) Entra el primer tiro libre de una serie de dos
- **C) Falla el último tiro libre de la serie**
- D) El defensor comete violación en el primer tiro libre de dos

**P3 (texto abierto):**
Un jugador falla el único tiro libre de una falta técnica. El compañero del tirador pisó la línea (violación ofensiva). El tiro falló igual. Explicá qué se registra y por qué.

---

# MÓDULO 5
## Rebotes: quién recupera el balón y por qué importa
**Duración estimada:** 65 min
**Objetivo:** Asignar correctamente cada rebote, distinguir entre ofensivo y defensivo, y manejar los casos especiales con precisión.

---

### Por qué los rebotes son más que "agarrar la pelota"

El rebote no es solo registrar quién agarra el balón. Es determinar si la posesión cambió o continuó, si la jugada terminó o sigue, y quién merece estadísticamente el crédito cuando varias personas tocan el balón.

Un error en el rebote contamina otras estadísticas. Si errás quién tiene el rebote, podés errarte el turnover que vino después, o la asistencia que generó el siguiente ataque.

---

### Definición oficial (FIBA 2024)

Un rebote es la **recuperación controlada** de un balón vivo por un jugador o equipo, incluyendo el derecho a la pelota para un saque desde afuera después de un FGA o último FTA fallado.

**Dos tipos:**
- **OREB — Offensive Rebound:** El equipo que falló el tiro recupera la pelota → la posesión **continúa**
- **DREB — Defensive Rebound:** El equipo que no tiró recupera la pelota → la posesión **cambia**

---

### 🧠 Truco: la regla del "¿quién atacaba?"

Cuando cae un rebote, preguntate una sola cosa:

> **"¿El equipo que recuperó la pelota era el que estaba atacando o el que estaba defendiendo?"**

- Estaba atacando → **OREB**
- Estaba defendiendo → **DREB**

El tipo de tiro, la distancia, el tiempo del partido — nada de eso importa para clasificar el rebote.

---

### ¿Cómo se "obtiene" un rebote? Más formas de las que pensás

Según el manual FIBA, un rebote se puede obtener de estas maneras:

1. Ser el primero en controlar el balón, aunque haya tocado varias manos antes
2. Tocar el balón en un palmeo controlado con intención de anotar (tip-in)
3. Desviar el balón de forma controlada hacia un compañero o hacia un lugar donde un compañero pueda recogerlo
4. Desviar el balón hacia un rival de forma que el balón salga fuera y TU equipo obtenga el saque
5. Disputar el balón simultáneamente con un rival y que la flecha de posesión alterna favorezca a tu equipo

---

### Rebote de equipo — cuándo nadie se lleva el crédito individual

Se registra **rebote de equipo** (no a un jugador) cuando:

| Situación | Tipo |
|-----------|------|
| El balón sale fuera antes de que alguien lo controle | Al equipo que recibe el saque |
| Hay falta antes de que alguien lo controle | Al equipo que tira los libres |
| Dos o más del mismo equipo disputan el held ball | Rebote de equipo (no al individuo) |
| El balón se enclava en el aro o soporte | Al equipo que recibe posesión |
| Un defensor palmea accidentalmente en su propio aro | Rebote ofensivo de equipo del atacante |

---

### Situaciones que NO generan rebote

⚠️ Esto es crítico — muchos estadísticos registran rebotes donde no deben:

- ❌ Después de un tiro libre que **no es el último** de la serie (balón muerto)
- ❌ Cuando el período termina después de un tiro fallado (balón muerto)
- ❌ Cuando el reloj de posesión vence después del tiro, antes de que alguien controle el balón → es turnover, no rebote
- ❌ Después de una falta antideportiva que incluye tiros libres → no hay rebote en el último FTA fallado

---

### Las mini-posesiones en rebotes (FIBA 2024)

Esta es una situación específica: un jugador **salta, controla el balón** pero luego cae y pierde el control. Por ejemplo, cae fuera de la cancha con el balón.

En este caso, aunque ese jugador tuvo "control" momentáneo, el manual FIBA establece que se le da **rebote de equipo al equipo contrario**, no al jugador que cayó.

La lógica: "control" en este contexto requiere también controlar el propio cuerpo. Si no podés hacer nada útil con el balón porque caés, no se considera control real.

---

### Casos prácticos

> **Caso A:** #21 rojo falla un tiro. El balón rebota, y #5 rojo lo toca antes de que #8 azul lo agarre firmemente.
>
> ¿Quién tiene el rebote? → **#8 azul.** El rebote va a quien **controla**, no a quien toca primero.

> **Caso B:** #21 rojo falla un tiro. Tres jugadores saltan y el balón toca manos de varios antes de que #14 rojo lo controle.
>
> ¿Quién tiene el rebote? → **#14 rojo.** OREB (el que ataca recupera la pelota).

> **Caso C:** #21 rojo falla un tiro. #9 rojo salta, agarra el balón en el aire, pero cae fuera de la cancha.
>
> ¿Qué se registra? → **DREB de equipo azul.** #9 rojo tuvo contacto pero no "control" en el sentido estadístico. El equipo defensor recibe el saque.

> **Caso D:** #21 rojo falla un tiro. Nadie controla el balón y suena el reloj de posesión (shot clock). Los árbitros cobran la violación.
>
> ¿Qué se registra? → **Turnover de equipo rojo (shot clock violation). No hay rebote.** El balón está muerto.

> **Caso E:** #21 rojo falla el primer tiro libre de dos.
>
> ¿Hay rebote? → **No.** El balón está muerto, #21 tira el segundo.

> **Caso F:** Después de un tiro fallado, #11 azul y #4 rojo agarran el balón al mismo tiempo (held ball). La flecha de posesión alterna favorece al equipo azul.
>
> ¿Qué se registra? → **OREB #11 azul** (solo un jugador de azul estaba en disputa).

> **Caso G:** Después de un tiro fallado, #11 azul y #7 azul (ambos del mismo equipo) agarran el balón junto con #4 rojo. Held ball. La flecha favorece al equipo azul.
>
> ¿Qué se registra? → **OREB de equipo azul** (más de un jugador del mismo equipo involucrado → rebote de equipo, no individual).

---

### ✅ Tabla resumen

| Quién recupera | Tipo | ¿Cambia posesión? |
|---------------|------|--------------------|
| El equipo atacante | OREB | ❌ Continúa |
| El equipo defensor | DREB | ✅ Cambia |
| Nadie (sale fuera) | Rebote de equipo | Según a quién se le da el saque |
| Jugador controla pero cae fuera | DREB equipo rival | ✅ Cambia |

---

### 📝 Quiz — Módulo 5

**P1:** #5 blanco falla un triple. Varios jugadores tocan el balón y finalmente #10 rojo (equipo defensor) lo controla. ¿Qué se registra?
- A) OREB #10 rojo
- **B) DREB #10 rojo**
- C) Rebote de equipo

**P2:** #5 blanco falla el primer tiro libre de dos. ¿Hay rebote?
- A) Sí, DREB al equipo defensor
- **B) No, el balón está muerto**
- C) Sí, OREB al equipo atacante

**P3:** Después de un tiro fallado, #9 azul salta, controla el balón, pero cae fuera de la cancha. ¿Qué se registra?
- A) OREB #9 azul
- **B) DREB de equipo rojo (rival)**
- C) No se registra nada

**P4 (texto abierto):** Describí dos situaciones donde NO se registra rebote después de un tiro fallado, y explicá por qué.

---

# MÓDULO 6
## Pérdidas de balón (Turnovers): tipos y criterios
**Duración estimada:** 70 min
**Objetivo:** Identificar correctamente cuándo hay pérdida, qué tipo es, a quién se le asigna, y cuándo hay (o no hay) robo correspondiente.

---

### La pérdida: el error que le da la pelota al rival

Una pérdida de balón (turnover) es cualquier error del equipo ofensivo que resulta en que el rival gana la posesión. No hay un límite — cualquier equipo puede perder el balón en cualquier momento, mientras lo tenga.

---

### Definición oficial (FIBA 2024)

Una pérdida es un error de un jugador u equipo ofensivo que resulta en que el equipo defensivo gana la posesión, incluyendo:
- Un pase malo
- Un error de manejo del balón
- Cualquier tipo de violación u falta ofensiva

**Regla fundamental:** Una pérdida SOLO puede cometerla el equipo que tiene control del balón.

---

### 🧠 Truco: el "semáforo" de la pérdida

Para decidir si hay pérdida, preguntate:

1. 🟢 **¿El equipo tenía posesión?** → Si no, no puede haber pérdida
2. 🟡 **¿Perdió la posesión por un error propio?** → Si fue un tiro fallado normal, no es pérdida
3. 🔴 **¿El rival ganó la posesión como resultado?** → Si sí, hay pérdida

---

### Los tipos de pérdida — Manual FIBA 2024

| Tipo | Descripción | ¿Jugador o equipo? |
|------|-------------|-------------------|
| Pase malo (Bad pass) | El pase es interceptado o sale fuera | Jugador (el pasador, salvo que el receptor debió atrapar) |
| Manejo de balón (Ball handling) | Pierde control mientras dribblea o sostiene | Jugador |
| Viaje (Travel) | Pasos ilegales | Jugador |
| Doble dribleo | Driblea dos veces | Jugador |
| 3 segundos | Permanece 3s en la zona pintada | Jugador |
| 5 segundos (individual) | No saca en 5 segundos | Jugador |
| 5 segundos (saque lateral) | No saca en 5 segundos desde afuera | **Equipo** |
| 8 segundos | No pasa a zona de ataque en 8s | **Equipo** |
| Shot clock (24s) | No tiran antes que venza el reloj | **Equipo** |
| Campo atrás (Backcourt) | El equipo vuelve a su propio campo | Jugador |
| Falta ofensiva | Carga, pantalla ilegal, etc. | Jugador |
| Goaltending ofensivo | Toca el balón ilegalmente sobre el aro | Jugador |
| Falta descalificante en posesión | Equipo tiene el balón cuando ocurre | Jugador (si está en cancha) o Equipo |

---

### La regla del pasador vs. el receptor

Cuando el pase es malo y el balón se pierde, el turnover va al **pasador**. Pero hay una excepción: si el pase era bueno y el receptor lo soltó cuando debía haberlo atrapado, el turnover va al **receptor**.

> **¿Cómo decidís?** Preguntate: si el receptor hubiera prestado atención y tuviera habilidad normal, ¿habría atrapado ese pase? Si sí → el turnover es del receptor. Si no → es del pasador.

Cuando un pase malo hace que el receptor cometa una violación (por ejemplo, pisa fuera al intentar atraparlo), el turnover es igual del **pasador** — él causó originalmente el problema.

---

### Held ball y pérdidas

Cuando el equipo defensor fuerza un held ball:
- Flecha favorece al **atacante** → **No se registra nada** (siguen en posesión)
- Flecha favorece al **defensor** → **Pérdida** al atacante + potencial **robo** al defensor que inició la acción

---

### Cuándo NO hay pérdida aunque parezca que sí

- Falta técnica mientras el atacante tiene posesión → **No hay pérdida** (salvo que ya se haya producido un robo antes)
- Faltas técnicas simultáneas (ambos equipos) → Penalidades se cancelan, el equipo atacante conserva → **No hay pérdida**
- El equipo recupera posesión en un held ball → **No hay pérdida**

---

### Casos prácticos

> **Caso A:** #11 blanco hace un pase directo hacia las manos del defensor #5 rojo, quien lo intercepta.
>
> → **Pérdida (pase malo) #11 blanco + Robo #5 rojo.**

> **Caso B:** #11 blanco hace un pase perfecto hacia #3 blanco, quien lo deja caer y el balón sale fuera.
>
> → **Pérdida (manejo de balón) #3 blanco.** El pase era bueno → el error fue del receptor.

> **Caso C:** #11 blanco hace un pase y el defensor #5 rojo lo desvía. El balón termina por tocar de nuevo a #11 blanco antes de salir fuera.
>
> → **Pérdida (fuera de campo) #11 blanco. Sin robo.** El balón murió (salió fuera).

> **Caso D:** El equipo blanco no logra tirar antes de que venza el shot clock.
>
> → **Pérdida (shot clock violation) equipo blanco.** Sin robo — no hay un jugador defensor que causara el error.

> **Caso E:** Se cobra falta técnica al #7 rojo mientras su equipo tiene la pelota. No hubo robo previo.
>
> → **Falta técnica #7 rojo. No hay pérdida.** Su equipo conserva la posesión.

---

### ✅ Tabla resumen — pérdida vs. robo

| ¿Hay pérdida? | ¿Hay robo? | Situación típica |
|--------------|-----------|-----------------|
| ✅ Sí | ✅ Sí | Intercepción, robo de dribbling |
| ✅ Sí | ❌ No | Viaje, shot clock, sale fuera sin tocar defensor |
| ✅ Sí | ❌ No | Falta ofensiva (carga) |
| ❌ No | ❌ No | Held ball con flecha al atacante, falta técnica sola |

---

### 📝 Quiz — Módulo 6

**P1:** #20 rojo hace un excelente pase, pero #3 rojo lo deja caer. ¿A quién se le asigna la pérdida?
- A) A #20 rojo (pasador)
- **B) A #3 rojo (el pase era bueno, el error fue del receptor)**
- C) Pérdida de equipo

**P2:** #27 azul comete una pantalla ilegal (falta ofensiva). ¿Hay robo para el defensor?
- A) Sí, el defensor provocó la falta
- **B) No, las faltas ofensivas generan pérdida pero nunca robo**
- C) Solo si el defensor tocó el balón

**P3:** El equipo blanco tiene posesión y reciben una falta técnica por protestas del banco. ¿Hay pérdida?
- **A) No, el equipo conserva la posesión a pesar de la técnica**
- B) Sí, pérdida de equipo
- C) Depende de si el equipo marcaba abajo o arriba

**P4 (texto abierto):** Explicá la diferencia entre una pérdida de jugador y una pérdida de equipo. Dá dos ejemplos de cada una.

---

# MÓDULO 7
## Asistencias (Assists): el arte de reconocer el último pase
**Duración estimada:** 70 min
**Objetivo:** Aplicar con precisión los criterios FIBA para decidir cuándo un pase merece el crédito de asistencia.

---

### La estadística más subjetiva del basketball

La asistencia es, sin dudas, la estadística que más debate genera entre estadísticos. Dos personas pueden ver la misma jugada y una registrarla como asistencia y la otra no.

Por eso el Manual FIBA 2024 establece criterios muy específicos según la zona de la cancha y la acción del tirador después de recibir. Tu trabajo es aplicar esos criterios con consistencia, no con opinión.

---

### Definición oficial (FIBA 2024)

Una asistencia es un pase que **lleva directamente** a que un compañero anote.

Pero "directamente" tiene reglas según dónde y cómo.

---

### 🧠 Truco: el árbol de decisión de la asistencia

```
¿El compañero anotó?
    └── NO → No hay asistencia
    └── SÍ →
        ¿Este fue el ÚLTIMO pase antes del tiro?
            └── NO → No hay asistencia
            └── SÍ →
                ¿Dónde recibió el pase?
                    └── DENTRO de la pintura → SIEMPRE asistencia ✅
                    └── FUERA de la pintura →
                        ¿Anotó SIN driblear?
                            └── SÍ → SIEMPRE asistencia ✅
                            └── NO (dribleó) →
                                ¿Tuvo que superar a su defensor en 1v1?
                                    └── NO → Asistencia ✅
                                    └── SÍ → NO hay asistencia ❌
```

---

### Las reglas una por una

**Regla 1: Solo el último pase**
Aunque el penúltimo pase haya creado toda la jugada, la asistencia es del último pase. Siempre.

**Regla 2: Solo una asistencia por canasta**
No importa cuántos pases hubo — solo el último cuenta.

**Regla 3: Pase dentro de la pintura = siempre asistencia**
"Dentro de la pintura" significa que el receptor tenía uno o ambos pies dentro o sobre la línea del área, y anotó sin salir de la pintura.

**Regla 4: Pase fuera de la pintura + sin dribleo = siempre asistencia**
Si recibió afuera y tiró directo (sin driblear o con un dribleo de balance), siempre es asistencia.

**Regla 5: Pase fuera de la pintura + con dribleo**
Aquí está la complejidad. Solo hay asistencia si el tirador **no necesitó superar a su defensor** en una situación 1v1 directa.

¿Cuándo SÍ hay asistencia aunque haya dribleo?
- El defensor estaba desequilibrado cuando el tirador recibió el pase
- El defensor no estaba directamente entre el tirador y el aro

¿Cuándo NO hay asistencia con dribleo?
- El defensor estaba de frente, equilibrado, directamente entre el tirador y el aro, y el tirador tuvo que superarlo

**Regla 6: Falta en el tiro + tiros libres**
Si el receptor fue faleado en el acto de tiro y convierte **al menos un tiro libre** → hay asistencia igual que si hubiera convertido un FGM.

**Regla 7: Contraataque coast to coast — no hay asistencia**
Si el jugador recibe el pase en su propia mitad de cancha y va solo hasta el aro, no hay asistencia para el pasador.

**Regla 8: Pase desviado — no hay asistencia**
Si el pase fue claramente desviado y terminó con un jugador diferente al que iba destinado, no hay asistencia.

**Regla 9: Pases de saque (inbound passes)**
Un saque puede ser asistencia si el receptor convierte directamente o con mínima acción.

---

### Casos prácticos

> **Caso A:** #8 verde pasa a #11 verde dentro de la pintura. #11 dribblea una vez, el defensor lo presiona y convierte igual.
>
> → **FGM #11 + AST #8.** Pase dentro de la pintura → siempre asistencia, sin importar el dribleo.

> **Caso B:** #7 rojo pasa a #9 rojo fuera de la pintura. #9 tira directo sin driblear y convierte.
>
> → **FGM #9 + AST #7.** Pase fuera + sin dribleo = siempre asistencia.

> **Caso C:** #7 rojo pasa a #3 rojo fuera de la pintura. #3 dribblea dos veces, supera a su defensor que estaba de frente y convierte.
>
> → **FGM #3. Sin asistencia.** Superó al defensor en 1v1 directo fuera de la pintura.

> **Caso D:** #7 rojo pasa a #3 rojo fuera de la pintura. #3 dribblea hacia el aro, pero el defensor ya estaba detrás de él (bien anticipado por #3). Convierte.
>
> → **FGM #3 + AST #7.** No hubo una situación 1v1 directa — el defensor no estaba entre #3 y el aro.

> **Caso E:** #7 rojo hace un pase largo a #9 rojo en la propia mitad de rojo. #9 va solo hasta el aro y convierte.
>
> → **FGM #9 (fast-break). Sin asistencia.** Recibió en su propia mitad = coast to coast, sin asistencia.

> **Caso F:** #12 amarillo saca desde el fondo, pasa a #21 que convierte directamente.
>
> → **FGM #21 + AST #12.** Los saques pueden ser asistencia.

> **Caso G:** #7 rojo hace pase largo a #9 rojo, quien entrega a #10 rojo para un layup convertido.
>
> → **FGM #10 + AST #9.** El pase de #7 creó la jugada, pero la asistencia es del **último pase**: #9.

---

### ✅ Resumen visual

| Situación | ¿Asistencia? |
|-----------|-------------|
| Pase dentro de la pintura, receptor convierte | ✅ Siempre |
| Pase fuera, receptor anota sin driblear | ✅ Siempre |
| Pase fuera, receptor dribblea pero no supera defensor 1v1 | ✅ Sí |
| Pase fuera, receptor supera defensor en 1v1 directo | ❌ No |
| Pase en propia mitad de cancha (coast to coast) | ❌ No |
| Penúltimo pase (aunque haya creado la jugada) | ❌ No |
| Receptor es faleado + convierte al menos 1 TL | ✅ Sí |
| Pase desviado a jugador diferente del destinado | ❌ No |

---

### 📝 Quiz — Módulo 7

**P1:** #21 amarillo pasa a #11 amarillo dentro de la pintura. #11 dribblea una vez y convierte. ¿Hay asistencia?
- **A) Sí, pase dentro de la pintura siempre es asistencia**
- B) No, porque dribblea antes de tirar
- C) Depende del defensor

**P2:** #7 rojo hace un gran pase que crea la jugada, pero antes de tirar #9 rojo le pasa a #10 rojo que convierte. ¿Quién tiene la asistencia?
- A) #7 rojo (creó la jugada)
- **B) #9 rojo (hizo el último pase)**
- C) Ambos comparten la asistencia

**P3:** #5 azul recibe el pase en su propia mitad de cancha, va solo al aro y convierte un layup espectacular. ¿Hay asistencia para el pasador?
- A) Sí, el pase inició el contraataque
- **B) No, recibió en su propia mitad (coast to coast)**
- C) Solo si fue en menos de 8 segundos

**P4 (texto abierto):** Describí la diferencia entre "asistencia en pase dentro de la pintura" y "asistencia en pase fuera de la pintura con dribleo". ¿Por qué las reglas son diferentes?

---

# MÓDULO 8
## Robos (Steals) y Tapones (Blocked Shots)
**Duración estimada:** 75 min
**Objetivo:** Registrar correctamente las grandes jugadas defensivas con la distinción clave entre robo/pérdida y tapón/pérdida.

---

### Las acciones defensivas más emocionantes — y las que más confunden

Un robo y un tapón son las dos estadísticas defensivas individuales más vistosas. También son las que generan más errores, porque involucran contacto con el balón en situaciones rápidas donde hay que decidir en fracciones de segundo.

---

## PARTE A: ROBOS (STL — Steals)

### Definición oficial (FIBA 2024)

Un robo se acredita a un jugador defensivo cuando **sus acciones causan directamente** que un jugador ofensivo cometa una pérdida de balón.

**El robo siempre debe involucrar tocar el balón**, pero no necesariamente controlarlo.

---

### 🧠 Truco del robo: "sin pérdida no hay robo, pero sin robo puede haber pérdida"

La relación es asimétrica:
- **Si hay robo → SIEMPRE hay pérdida correspondiente**
- **Si hay pérdida → NO siempre hay robo**

Antes de registrar un robo, buscá la pérdida. Si no encontrás a quién asignarle la pérdida, revisá si realmente hay robo.

---

### ¿Cómo se genera un robo? Las tres formas válidas

1. **Interceptar o desviar un pase** — el defensor toca el balón en el aire y lo deflecta
2. **Arrancar el balón** — al jugador que driblea o sostiene el balón
3. **Recoger un balón suelto** — después de un error del atacante (se levanta del piso luego de que el atacante lo perdió)

---

### Cuándo NO hay robo

| Situación | ¿Hay robo? |
|-----------|-----------|
| El balón sale fuera aunque el defensor lo tocó | ❌ No (balón muerto) |
| Falta ofensiva (carga) — el defensor la provocó | ❌ No (falta, no robo) |
| El defensor crea un held ball pero la flecha favorece al atacante | ❌ No |
| Violación del atacante no causada por el defensor | ❌ No |

**Excepción importante:** El balón muerto normalmente no genera robo, pero si el defensor causó un held ball y **su equipo gana posesión por la flecha alterna**, SÍ hay robo.

---

### ¿A quién se le asigna el robo cuando participaron varios defensores?

**El robo va al jugador que PRIMERO deflectó o tocó el balón e inició la pérdida**, aunque después otro jugador haya recogido el balón suelto.

> Ejemplo: #5 rojo desvía el pase con la mano, el balón rebota libre y #8 rojo lo levanta.
> → **STL #5 rojo** (quien inició la acción), no a #8.

---

### Casos prácticos — Robos

> **Caso A:** #4 azul intercepta firmemente un pase del equipo rojo y sigue el juego.
>
> → **Pérdida (pase malo) del pasador rojo + STL #4 azul.**

> **Caso B:** #11 blanco desvía un pase de #30 azul. El balón toca de nuevo a #30 azul antes de salir fuera. El equipo blanco recibe el saque.
>
> → **Pérdida (fuera de campo) #30 azul. Sin robo.** El balón murió (salió fuera), aunque #11 blanco lo inició.

> **Caso C:** #15 amarillo desvía un pase. El balón va a #14 rojo, quien pelea con #45 azul por el balón (held ball). La flecha favorece al equipo azul.
>
> → **Pérdida #pasador_rojo + STL #15 amarillo.** La excepción del held ball con flecha al defensor.

> **Caso D:** #11 negro va al aro, el defensor #12 amarillo se planta y el árbitro cobra carga a #11 negro.
>
> → **Pérdida (falta ofensiva) #11 negro. Sin robo.** La falta ofensiva no genera robo.

---

## PARTE B: TAPONES (BS — Blocked Shots)

### Definición oficial (FIBA 2024)

Un tapón se acredita cuando un jugador defensivo hace **contacto apreciable** con el balón para **alterar la trayectoria** de un FGA y el tiro **falla**.

Debe ser una detención o deflexión clara del tiro.

---

### 🧠 La regla del hombro — la más importante del módulo

Esta es la regla que más errores genera:

**¿El balón estaba por ENCIMA del hombro del atacante cuando fue tocado por el defensor?**

- ✅ **SÍ, por encima del hombro** → El atacante estaba en acto de tiro → **FGA + Tapón + Rebote**
- ❌ **NO, por debajo del hombro** → El atacante no estaba en acto de tiro → **Pérdida + Robo** (sin FGA, sin tapón)

Por qué importa: la estadística de FIBA define el "acto de tiro" como un movimiento hacia arriba y/o hacia adelante hacia el aro con intención de anotar. Si el balón está por debajo del hombro, el jugador no está en ese movimiento aún.

---

### ¿Cuándo NO hay tapón aunque el defensor toque el balón?

| Situación | ¿Hay tapón? |
|-----------|------------|
| El tiro entra a pesar del contacto | ❌ No (FGM, no tapón) |
| El defensor toca el balón después de que tocó el aro | ❌ No (no puede haber tapón post-rebote) |
| El tirador fue faleado antes del tiro (no hay FGA) | ❌ No (sin FGA, sin tapón) |
| El balón estaba por debajo del hombro | ❌ No (es pérdida + robo) |

---

### Después del tapón: siempre hay rebote

Todo tapón genera una situación de rebote (FGA fallado → alguien recupera). El rebote se asigna normalmente.

**Excepción:** Si el período termina o hay violación de reloj inmediatamente después del tapón.

---

### Casos prácticos — Tapones

> **Caso A:** #6 rojo tira un triple. El defensor #7 blanco lo toca ligeramente, pero el balón entra igual.
>
> → **FGM #6 rojo. Sin tapón.** El toque no alteró la trayectoria — la canasta fue válida.

> **Caso B:** #9 blanco va al aro para un layup. El defensor #10 azul le golpea el balón cuando está a la altura de la cadera de #9.
>
> → **Pérdida (manejo) #9 blanco + STL #10 azul.** Debajo del hombro = no es acto de tiro = no hay FGA ni tapón.

> **Caso C:** #13 verde tira un triple. El balón toca el aro, y el defensor #5 blanco lo palmea afuera.
>
> → **3FGA #13 verde + OREB equipo verde.** No puede haber tapón después de que el balón tocó el aro.

> **Caso D:** A2 va al aro y el defensor B1 lo falea en el acto de tiro. A2 igual lanza, y B2 (otro defensor) le tapona el tiro.
>
> → **Falta personal B1, foul drawn A2. Sin FGA, sin tapón.** Como hubo falta en el acto de tiro y el tiro normalmente no se registra (ya que B1 lo faleó primero), tampoco puede haber tapón.

---

### ✅ Tabla resumen — Robos y Tapones

| Acción | ¿Hay robo? | ¿Hay tapón? | Nota |
|--------|-----------|------------|------|
| Intercepción limpia de pase | ✅ | ❌ | + pérdida al pasador |
| Balón golpeado debajo del hombro | ✅ (si equipo lo recupera) | ❌ | + pérdida por manejo |
| Balón golpeado encima del hombro + tiro falla | ❌ | ✅ | + FGA + rebote |
| Balón golpeado encima del hombro + tiro entra | ❌ | ❌ | Solo FGM |
| Sale fuera aunque defensor lo tocó | ❌ | ❌ | Balón muerto |
| Carga / falta ofensiva | ❌ | ❌ | Solo pérdida |

---

### 📝 Quiz — Módulo 8

**P1:** #9 blanco va al aro. El defensor le golpea el balón cuando está a la altura de la cintura. El balón va al equipo defensor. ¿Qué se registra?
- A) FGA + Tapón + Rebote defensor
- **B) Pérdida (manejo) #9 blanco + Robo al defensor**
- C) FGA fallado + Rebote defensor

**P2:** #6 rojo tira un triple. El defensor lo toca ligeramente y el balón entra. ¿Qué se registra?
- **A) FGM #6 rojo. Sin tapón.**
- B) FGA fallado + Tapón al defensor
- C) FGM #6 rojo + Tapón al defensor

**P3:** #5 azul desvía un pase rival. El balón sale fuera de la cancha. El equipo azul recibe el saque. ¿Hay robo para #5 azul?
- A) Sí, causó la pérdida
- **B) No, el balón murió (salió fuera)**
- C) Sí, porque el equipo azul obtiene la posesión

**P4 (texto abierto):** Explicá la "regla del hombro" con tus palabras y dá un ejemplo donde aplica para que sea tapón y otro donde aplica para que sea pérdida+robo.

---

# MÓDULO 9
## Faltas: tipos, registro y situaciones especiales
**Duración estimada:** 70 min
**Objetivo:** Registrar correctamente todos los tipos de faltas, entender cuándo generan tiros libres y cuándo no, y manejar la estadística de "falta recibida".

---

### Las faltas: la categoría que define los partidos

Las faltas son una de las estadísticas más impactantes: determinan quién tira tiros libres, cuándo un jugador se va al banco con problemas de faltas, y si un equipo está en situación de bonus. Un error en el registro de faltas puede afectar decisiones críticas del partido.

---

### Tipos de faltas — Manual FIBA 2024

| Tipo | Abreviatura | Quién la comete | Genera tiros libres |
|------|------------|----------------|---------------------|
| Falta personal | PF | Jugador en cancha | Depende (tiro o bonus) |
| Falta en el tiro (shooting foul) | PF shooting | Jugador en cancha | ✅ Siempre |
| Falta no-tiro (non-shooting) | PF non-shooting | Jugador en cancha | Solo en bonus |
| Falta ofensiva (carga/pantalla ilegal) | PF offensive | Jugador atacante | ❌ Nunca (va TL al otro) |
| Falta técnica | TF | Jugador, entrenador o banco | ✅ (1 TL) |
| Falta antideportiva | UF | Jugador en cancha | ✅ (2 TL + posesión) |
| Falta descalificante | DF | Jugador, entrenador o personal | ✅ (2 TL) + expulsión |

---

### 🧠 Truco: la diferencia entre "shooting" y "non-shooting"

Una falta **"en el acto de tiro"** (shooting foul) es aquella que el árbitro **señala expresamente** como tal — cuando el jugador estaba en el movimiento de tiro cuando lo falearon.

Una falta **"non-shooting"** resulta en tiros libres solo porque el equipo está en **situación de bonus** (acumulación de faltas de equipo en el período).

La diferencia importa para el registro: si el árbitro no señala que fue en el acto de tiro, es non-shooting.

---

### Foul Drawn — La "otra cara" de cada falta

Cada vez que un jugador es faleado, se le acredita un **Foul Drawn** (falta recibida). Siempre son dos estadísticas:

- **PF** al que cometió la falta
- **Foul Drawn** al que la recibió

**Excepción:** En las faltas descalificantes que no involucran contacto físico directo con un jugador (ej: insulto al árbitro), puede no haber Foul Drawn.

---

### Faltas técnicas al entrenador — cuidado aquí

Las faltas técnicas cobradas al **entrenador o al banco** se registran **contra el entrenador**, y **NO cuentan como faltas de equipo** ni como faltas personales de jugadores. Son un registro aparte.

---

### Situaciones especiales

#### Falta técnica + turnover
Si se cobra una falta técnica mientras el equipo atacante tiene posesión y **hubo un robo previo en esa misma acción**:
- Se registra el robo normalmente
- Se registra la falta técnica al jugador correspondiente

Si NO hubo robo previo, la falta técnica sola no genera pérdida.

#### Doble falta (faltas simultáneas)
Cuando ambos equipos cometen faltas al mismo tiempo:
- Ambas faltas se registran normalmente
- Las penalidades se cancelan
- El equipo atacante conserva la posesión
- **No hay pérdida ni robo**

#### Falta descalificante en posesión
Si el jugador que comete la falta descalificante está en cancha cuando el equipo tiene posesión:
- **DF + Turnover al jugador**

---

### Casos prácticos

> **Caso A:** #7 azul va al aro. El defensor #3 blanco lo foul mientras #7 tiene el brazo extendido lanzando. El árbitro cobra falta en el acto de tiro.
>
> → **PF (shooting) #3 blanco + Foul Drawn #7 azul.** #7 tira tiros libres. No hay FGA (el tiro salió pero hubo falta).

> **Caso B:** #7 azul va al aro. El defensor #3 blanco lo foul mientras #7 está driblando (antes de saltar). El equipo azul está en bonus.
>
> → **PF (non-shooting) #3 blanco + Foul Drawn #7 azul.** Como hay bonus, #7 tira tiros libres igual, pero la falta no fue en el acto de tiro.

> **Caso C:** A3 driblea y comete carga contra B2.
>
> → **Pérdida (falta ofensiva) A3 + PF (offensive) A3 + Foul Drawn B2. Sin robo.**

> **Caso D:** El entrenador del equipo rojo protesta y recibe una falta técnica.
>
> → **TF al entrenador rojo.** No cuenta como falta de equipo. Los TL los tira el rival.

> **Caso E:** A1 comete una falta descalificante insultando al árbitro mientras su equipo defiende (no tiene posesión).
>
> → **DF A1. No hay pérdida** (no tenía posesión). Expulsión del partido.

> **Caso F:** A1 comete una falta descalificante golpeando a B2 mientras su equipo ataca.
>
> → **DF A1 + Turnover A1 + Foul Drawn B2.** Tenía posesión + contacto físico con B2.

---

### ✅ Tabla resumen

| Tipo de falta | Pérdida | Robo | Tiros libres |
|--------------|---------|------|-------------|
| PF defensiva (en el tiro) | ❌ | ❌ | ✅ 2 ó 3 TL |
| PF defensiva (non-shooting + bonus) | ❌ | ❌ | ✅ 2 TL |
| PF ofensiva (carga) | ✅ | ❌ | ❌ |
| Falta técnica (jugador atacante) | ❌ (salvo robo previo) | ❌ | ✅ 1 TL rival |
| Falta antideportiva | Depende posesión | ❌ | ✅ 2 TL + posesión |
| Falta descalificante en posesión | ✅ | ❌ | ✅ 2 TL |
| Falta descalificante sin posesión | ❌ | ❌ | ✅ 2 TL |

---

### 📝 Quiz — Módulo 9

**P1:** El árbitro cobra falta al defensor. El jugador atacante estaba driblando, no en el acto de tiro. El equipo atacante está en bonus. ¿Qué tipo de falta es?
- **A) PF non-shooting (genera TL solo por bonus)**
- B) PF shooting
- C) Falta técnica

**P2:** A3 va con el balón y comete carga contra B2. ¿Se registra robo para B2?
- A) Sí, B2 provocó la pérdida
- **B) No, las faltas ofensivas generan pérdida pero NUNCA robo**
- C) Solo si B2 tocó el balón

**P3:** El entrenador del equipo azul recibe una falta técnica. ¿Cuenta como falta de equipo azul?
- A) Sí
- **B) No, las técnicas al entrenador no cuentan como faltas de equipo**
- C) Solo si es la segunda técnica del entrenador

**P4 (texto abierto):** Describí qué pasa estadísticamente cuando hay una doble falta (ambos equipos cometen falta simultáneamente). ¿Qué se registra y qué no?

---

# MÓDULO 10
## Datos adicionales y estadísticas avanzadas
**Duración estimada:** 60 min
**Objetivo:** Entender qué son las estadísticas avanzadas, cómo se calculan, y cuáles el software maneja automáticamente.

---

### Lo que el software calcula por vos — pero que tenés que entender

Hay estadísticas que el estadístico **no registra manualmente** — el software las calcula en base a los datos que vos ingresás. Pero si no entendés qué representan, no podés verificar que el software esté calculando correctamente, ni podés responder preguntas del comisionado o del entrenador en el partido.

---

### Minutos jugados (MIN)

**Cómo se calcula:** El software registra cada sustitución y calcula el tiempo que cada jugador estuvo en cancha.

**Reglas de redondeo (FIBA 2024):**
- Menos de 30 segundos en el minuto → se redondea **hacia abajo**
- 30 segundos o más → se redondea **hacia arriba**
- Entre 0.1 y 0.9 segundos → se redondea a 1 segundo
- 0 minutos pero estuvo en cancha → se muestra como 1 minuto
- Si le faltó exactamente 1 minuto para completar el partido → se redondea hacia abajo (indica que no jugó completo)
- Jugador que nunca entró → **DNP** (Did Not Play)

---

### Las 5 estadísticas de producción adicional

#### 1. Puntos en la pintura (Points in the Paint)
Total de puntos anotados desde dentro de la zona restringida (el área pintada bajo el aro). Incluye lay-ups, mates, ganchos, cualquier FGM que se origina dentro de la zona.
El software lo calcula según la ubicación registrada de cada FGM.

#### 2. Puntos de contraataque (Fast-Break Points)
Puntos anotados rápidamente (máximo 8 segundos) antes de que la defensa se organice, después de un cambio de posesión (robo, rebote defensivo, o canasta convertida).
Incluye tanto FGM como FTM dentro de esa posesión de transición.

#### 3. Puntos de segunda oportunidad (Second Chance Points)
Puntos anotados después de un rebote ofensivo, antes de que el equipo rival recupere la posesión.
Ejemplo: #7 falla → #11 rebote ofensivo → #11 convierte = Second Chance Points.

#### 4. Puntos de pérdida del rival (Points off Turnovers)
Total de puntos anotados por un equipo en la posesión que sigue inmediatamente a una pérdida del equipo rival.
No incluye los puntos en posesiones adicionales que comenzaron con una falta durante un FGA/FGM posterior.

#### 5. Puntos del banco (Bench Points)
Total de puntos anotados por jugadores que no fueron parte del quinteto inicial (starting five).

---

### Las métricas de análisis

#### Eficiencia individual (Efficiency Rating)
**Fórmula FIBA oficial:**
```
EFF = (PTS + REB + AST + STL + BS) - (FGA - FGM + FTA - FTM + TO)
```

¿Qué significa? Los tiros fallados, tiros libres fallados y pérdidas **restan** de las contribuciones positivas.

Ejemplo: Jugador con 20 puntos (8/15 tiros, 4/6 TL), 8 rebotes, 5 asistencias, 2 robos, 1 tapón, 3 pérdidas.
- EFF = (20 + 8 + 5 + 2 + 1) - ((15-8) + (6-4) + 3) = 36 - 12 = **24**

#### Plus/Minus (+/-)
Diferencia de puntos del equipo mientras el jugador está en cancha.
Si el equipo hizo 15 puntos y recibió 10 mientras #7 jugó → su +/- es **+5**.

#### Puntos por posesión
Puntos del equipo dividido por el número de posesiones de ese equipo.
Mide la eficiencia ofensiva real, descontando la velocidad del juego.

---

### Estadísticas del marcador del partido

El Manual FIBA 2024 también define estas métricas globales del partido:

- **Score Tied:** Cantidad de veces que el marcador estuvo empatado durante el juego (excluye el 0-0 inicial)
- **Lead Changed:** Cantidad de veces que la ventaja pasó de un equipo al otro
- **Largest Lead:** La mayor ventaja que cada equipo tuvo y el momento en que ocurrió
- **Largest Scoring Run:** La mayor racha de puntos consecutivos de un equipo sin que el rival anotara

---

### Sistema de Replay Instantáneo (IRS) y Desafío del Entrenador (HCC)

El estadístico también debe registrar **cualquier uso del IRS o HCC** durante el partido, incluyendo el tipo de revisión.

**Tipos de revisión que se registran:**
- Tiro soltado antes de la chicharra (fin de período)
- Corrección del reloj / reloj de posesión
- Violación del shot clock (tiro antes de la señal)
- Falta fuera del acto de tiro (¿canasta sí o no?)
- Goaltending
- Fuera de la cancha
- ¿2 o 3 puntos?
- ¿2 o 3 tiros libres?
- Actualización de tipo de falta (subir/bajar categoría)
- Identificar al tirador de TL correcto
- Acto de violencia

---

### ✅ Resumen — ¿Qué calcula el software y qué registrás vos?

| Estadística | ¿La registrás vos? | ¿La calcula el software? |
|-------------|-------------------|--------------------------|
| FGA, FGM, FTA, FTM, AST, TO, STL, BS, PF | ✅ Vos | — |
| MIN jugados | Solo sustituciones | ✅ Software |
| Fast-break points | Solo el contexto | ✅ Software |
| Second chance points | Solo el contexto | ✅ Software |
| Eficiencia (EFF) | ❌ | ✅ Software |
| +/- | ❌ | ✅ Software |
| Score tied / lead changed | ❌ | ✅ Software |
| Uso de IRS/HCC | ✅ Vos | — |

---

### 📝 Quiz — Módulo 10

**P1:** ¿Qué es el "Efficiency Rating" según FIBA?
- A) Porcentaje de tiros convertidos
- **B) (PTS+REB+AST+STL+BS) - (FGA-FGM + FTA-FTM + TO)**
- C) Puntos por posesión del jugador

**P2:** Un jugador juega 9 minutos y 31 segundos. ¿Cómo se registra?
- A) 9 minutos
- **B) 10 minutos (30 segundos o más → redondea hacia arriba)**
- C) 9.5 minutos

**P3:** ¿Qué son los "Second Chance Points"?
- A) Los puntos del segundo tiempo
- **B) Puntos anotados después de un rebote ofensivo**
- C) El segundo intento de tiro libre

**P4 (texto abierto):** Explicá con tus palabras qué mide el Plus/Minus (+/-) y por qué es útil para un entrenador.

---

# MÓDULO 11
## Tipos de tiros: de básico a avanzado
**Duración estimada:** 45 min
**Objetivo:** Identificar y clasificar correctamente los distintos tipos de tiros según los estándares FIBA.

---

### Por qué importa clasificar el tipo de tiro

En competencias de alto nivel, el software pide que el estadístico ingrese no solo si fue FGA/FGM, sino también **qué tipo de tiro fue**. Esta información permite análisis más profundos: ¿cuántos mates hizo el equipo? ¿cuántos tiros de step-back? ¿cuál es el porcentaje de conversión en lay-ups vs jump shots?

El Manual FIBA 2024 establece dos niveles: **básico** (para estadísticos menos experimentados) y **avanzado** (para competencias de alto nivel).

---

### 🧠 Truco: la clasificación parte del movimiento, no del resultado

No importa si el tiro entró o no para clasificarlo. Lo que importa es **el movimiento con el que se ejecutó**.

---

### Tipos básicos (FIBA 2024)

| Tipo | En español | Descripción |
|------|-----------|-------------|
| Jump Shot | Tiro en suspensión | El jugador salta y lanza en la cima del salto. Es el tiro más común, especialmente desde media y larga distancia. |
| Lay-up | Bandeja | Tiro de corta distancia, generalmente con efecto en el tablero. El jugador sostiene la pelota desde abajo y la suelta con movimiento ascendente. |
| Dunk | Mate | El jugador lleva el balón por encima del aro y lo empuja hacia abajo. Sus manos tocan el borde del aro. |
| Putback Dunk | Mate de rebote | Rebote ofensivo seguido inmediatamente de un mate. |
| Putback Tip-in | Palmeo de rebote | Rebote ofensivo seguido de un palmeo controlado que mete la pelota. El jugador no vuelve al piso antes de anotar. |

---

### Tipos avanzados (FIBA 2024)

| Tipo | En español | Descripción clave |
|------|-----------|------------------|
| Driving Lay-up | Bandeja en penetración | Bandeja después de una penetración en dribleo, ya sea con defensa organizada o en contraataque. |
| Reverse Lay-up | Bandeja de reversa | El jugador penetra por un lado del aro y anota desde el otro lado, usando el tablero como escudo. |
| Euro Step | Euro step | Dos pasos largos alternados (uno a cada lado) después del dribleo, antes de la bandeja. Técnica para evitar al defensor. |
| Alley-Oop Lay-up | Alley-oop de bandeja | El jugador atrapa el pase en el aire y anota con bandeja antes de tocar el piso. |
| Alley-Oop Dunk | Alley-oop de mate | El jugador atrapa el pase en el aire y anota con mate antes de tocar el piso. |
| Hook Shot | Gancho | Tiro con una mano, el jugador está de costado al aro y suelta el balón en un arco circular por encima de su cabeza. |
| Floating Jump Shot | Tiro flotado (floater) | Se lanza con un solo pie, como bandeja pero desde más lejos. Alto arco para pasar por encima de los defensores altos. |
| Fade-away Jump Shot | Tiro de retroceso | El jugador salta hacia atrás (lejos del aro) para crear espacio con el defensor. |
| Turn-around Jump Shot | Tiro girando | El jugador recibe de espaldas al aro, gira en el aire, y lanza. Puede girar completamente o parcialmente. |
| Step-back Jump Shot | Tiro con paso atrás | El jugador finta una penetración, da un paso atrás para crear espacio, y lanza. |
| Pull-up Jump Shot | Tiro en parada | El jugador frena abruptamente el dribleo y lanza, con los defensores aún en posición defensiva baja. |

---

### Recomendación FIBA para estadísticos iniciales

El manual sugiere que los sistemas de software permitan **dos niveles de operación**: básico (solo los 5 tipos fundamentales) y completo (todos los tipos avanzados). Los estadísticos que recién comienzan trabajarán con el nivel básico hasta ganar experiencia.

Para este curso, debés conocer todos los tipos, pero en la práctica inicial trabajarás principalmente con jump shot, lay-up y dunk.

---

### 📝 Quiz — Módulo 11

**P1:** Un jugador penetra al aro, da dos pasos alternados en direcciones opuestas para esquivar al defensor, y convierte una bandeja. ¿Qué tipo de tiro es?
- A) Driving Lay-up
- **B) Euro Step**
- C) Floating Jump Shot

**P2:** Un jugador agarra el pase en el aire, sin tocar el piso, y clava el balón. ¿Qué tipo de tiro es?
- A) Putback Dunk
- **B) Alley-Oop Dunk**
- C) Dunk normal

**P3 (texto abierto):** ¿Cuál es la diferencia entre un Putback Dunk y un Alley-Oop Dunk? Describí cada uno con un ejemplo de jugada.

---

# MÓDULO 12
## Situaciones complejas: casos que combinan múltiples estadísticas
**Duración estimada:** 65 min
**Objetivo:** Resolver situaciones de partido que involucran varias estadísticas simultáneas — las que generan más dudas en la práctica real.

---

### Por qué este módulo existe

Los módulos anteriores te enseñaron cada estadística por separado. Pero en un partido real, las jugadas no vienen de a una — vienen encadenadas, rápidas, y a veces una sola jugada genera 4 ó 5 estadísticas distintas.

Este módulo te entrena en leer la secuencia completa de una jugada y registrar todo correctamente y en orden.

---

### Método: la secuencia cronológica

La clave para no perderte es registrar las estadísticas **en el orden en que ocurrieron**. El manual FIBA usa siempre este formato:

```
Acción 1 (jugador) — Acción 2 (jugador) — Acción 3 (jugador)...
```

Siempre empieza por lo que pasó primero y avanzá en el tiempo.

---

### Caso complejo 1: Contraataque con final dramático

> Después de un tiro fallado por #11 blanco, el #7 rojo agarra el rebote. Pasa de inmediato a #6 rojo en la propia mitad. #6 rojo va solo al aro. El defensor #21 blanco lo falea para parar el contraataque. #6 rojo tira dos libres y convierte el primero.

Secuencia completa:
1. **FGA #11 blanco** (tiro fallado)
2. **DREB #7 rojo** (cambio de posesión)
3. *(El pase de #7 a #6 no genera estadística individual — solo el movimiento del ataque)*
4. **PF (non-shooting) #21 blanco** (falta para parar el contraataque — si hay bonus)
5. **Foul Drawn #6 rojo**
6. **FTM #6 rojo** (convierte el primero)
7. **FTA #6 rojo sin FTM** (falla el segundo)
8. **DREB equipo blanco** (rebote del último TL fallado)

¿Los puntos de #6 son fast-break points? → **Sí**, si el contraataque comenzó antes de que la defensa se organizara.

---

### Caso complejo 2: La jugada del goaltending + canasta propia

> #11 negro falla un lay-up. La pelota rebota y #33 amarillo la palmea accidentalmente hacia adentro del propio aro de amarillo. En cancha como capitán de negro está el #9 negro.

Secuencia:
1. **2FGA #11 negro** (intento de layup fallado)
2. **OREB equipo negro** (situación de rebote antes de la canasta en aro propio → rebote ofensivo de equipo)
3. **2FGM #9 negro** (el FGM se acredita al capitán del equipo que se beneficia)

¿Hay estadística para #33 amarillo? **No.** La canasta en el aro propio no genera estadística para quien la metió.

---

### Caso complejo 3: Held ball con múltiples consecuencias

> #32 amarillo está driblando. #11 rojo le manotea el balón. #23 amarillo y #45 rojo agarran el balón al mismo tiempo (held ball). La flecha de posesión alternada favorece al equipo rojo.

Secuencia:
1. **Pérdida (manejo de balón) #32 amarillo**
2. **STL #11 rojo** (quien inició la acción tocando el balón)
3. **DREB equipo rojo** (ganan posesión por flecha alterna — rebote de equipo, no a #45 rojo porque más de un jugador de rojo estaba involucrado)

No hay estadística para #23 amarillo (el atacante en el held ball) ni para #45 rojo individualmente.

---

### Caso complejo 4: Falta técnica + robo simultáneo

> #3 azul le roba la pelota a #6 blanco mientras este driblea. Inmediatamente después, #8 azul (que no tiene el balón) insulta al árbitro y recibe una falta técnica.

Secuencia:
1. **Pérdida (manejo) #6 blanco**
2. **STL #3 azul**
3. **TF #8 azul** (la falta técnica es independiente y no anula el robo que ya ocurrió)

¿Hay pérdida para el robo? **Sí** (#6 blanco ya perdió la pelota antes de la técnica). La falta técnica no retroactivamente elimina el robo.

---

### Caso complejo 5: Tiro al final del cuarto con falta

> Quedan 2 segundos. #5 azul lanza desde media cancha. El defensor #14 rojo lo falea mientras el balón está en el aire. El balón entra igual. El árbitro da la canasta válida.

Secuencia:
1. **3FGM #5 azul** (el balón salió antes de la falta y entró — el gol es válido)
2. **PF (shooting) #14 rojo** (falta en el acto de tiro, aunque el tiro haya entrado)
3. **Foul Drawn #5 azul**
4. **FTA/FTM #5 azul** (el tiro adicional del 3+1 al comienzo del siguiente período)

---

### Caso complejo 6: Doble turnover simultáneo

> #3 blanco hace un pase malo. #5 rojo lo intercepta, pero de inmediato pierde el control del balón. #7 rojo lo recoge y hace un pase que también es interceptado por #4 blanco.

Secuencia:
1. **Pérdida (pase malo) #3 blanco**
2. **STL #5 rojo** (interceptó el pase)
3. **Pérdida (manejo) #5 rojo** (perdió el control inmediatamente — la mini-posesión sí fue real aquí porque #5 tuvo control momentáneo)
4. *(#7 rojo recoge el balón — no hay estadística nueva para el rebote porque fue continuación)*
5. **Pérdida (pase malo) #7 rojo**
6. **STL #4 blanco**

---

### 📝 Quiz — Módulo 12

**P1 (caso práctico):**
#21 rojo falla un tiro. #9 rojo salta por el rebote, lo controla en el aire, pero cae y pierde el balón fuera de la cancha. ¿Qué estadísticas se registran?

- A) OREB #9 rojo + Pérdida #9 rojo
- **B) DREB equipo azul (rival) — porque #9 no controló su cuerpo**
- C) OREB equipo rojo + Pérdida de equipo

**P2 (caso práctico):**
#11 amarillo va al aro. El defensor lo falea mientras el balón está en el aire (falta en el tiro). #11 falla la bandeja pero el árbitro cobra falta. ¿Hay FGA para #11?
- **A) No — fue faleado en el tiro y no convirtió, por lo tanto no hay FGA**
- B) Sí, siempre hay FGA cuando hay un intento
- C) Solo hay FGA si el árbitro decide que el tiro era válido

**P3 (texto abierto):**
Describí la secuencia completa de estadísticas para esta jugada: "#5 azul roba la pelota a #11 rojo que estaba driblando. #5 azul pasa a #8 azul en la propia mitad azul. #8 va solo al aro y convierte un mate antes de que la defensa se organice. #3 rojo, el capitán en cancha, recibe el saque de fondo."

---

# MÓDULO 13
## Examen final integrador
**Duración estimada:** 60 min
**Nota mínima para certificar:** 70%

---

### Instrucciones

Este examen integra contenido de todos los módulos del curso. Tiene preguntas de opción múltiple y preguntas de respuesta abierta. Las preguntas de texto abierto serán revisadas por un instructor.

Tomá el tiempo que necesitás. Podés consultar tus apuntes antes de comenzar (no durante). Si no llegaste a 70%, podés rendir nuevamente después de repasar los módulos que necesites.

---

### Sección A: Opción múltiple (10 preguntas)

**A1.** Un jugador falla el primer tiro libre de dos. Un defensor cometió violación de carril. ¿Qué se registra?
- A) FTA sin FTM + rebote defensivo
- **B) Nada del tiro — se repite, solo se registra el resultado del tiro sustituto**
- C) FTA sin FTM y el tiro se repite
- D) FTM para el tirador igual

**A2.** #15 amarillo lanza un triple con 1 segundo restante. El balón sale de su mano antes del buzzer y entra. ¿Qué se registra?
- A) No se registra nada (tiempo terminó)
- B) FGA sin FGM (la canasta no vale)
- **C) 3FGM #15 amarillo — el balón salió antes del buzzer**
- D) Depende de si el árbitro lo confirma

**A3.** Un defensor palmea el balón cuando el atacante lo tiene a la altura de la cadera, antes de empezar el movimiento de tiro. El defensor recupera el balón. ¿Qué se registra?
- **A) Pérdida (manejo) + Robo al defensor — no hay FGA ni tapón**
- B) FGA + Tapón + Rebote defensor
- C) FGA fallado + Robo defensor
- D) Solo pérdida, sin robo

**A4.** #7 rojo hace pase a #9 rojo fuera de la pintura. #9 dribblea tres veces, el defensor está de frente equilibrado, y #9 lo supera y convierte. ¿Hay asistencia para #7?
- A) Sí, el pase inició la jugada
- **B) No — #9 superó al defensor en 1v1 directo fuera de la pintura**
- C) Depende de cuánto driblé #9
- D) Solo si fue en la zona de tres puntos

**A5.** Después de un tiro fallado, el reloj de posesión vence antes de que alguien controle el balón. ¿Qué se registra?
- A) Rebote defensivo de equipo + Turnover
- **B) Solo Turnover (shot clock) — no hay rebote porque el balón está muerto**
- C) Solo rebote defensivo de equipo
- D) Rebote ofensivo + Turnover

**A6.** El equipo A tiene posesión. El jugador A2 recibe una falta técnica por protestas, pero ningún jugador había robado ni perdido el balón. ¿Hay pérdida?
- **A) No, la falta técnica por sí sola no genera pérdida si el equipo mantiene posesión**
- B) Sí, toda falta técnica genera pérdida
- C) Solo si es la segunda técnica del partido
- D) Solo si era el equipo atacante

**A7.** #31 verde agarra un rebote defensivo, pasa a #2 verde, quien pasa a #8 verde, quien falla un lay-up pero agarra su propio rebote y convierte. ¿Hay asistencia?
- A) Sí, para #2 verde (último pase antes de la canasta)
- **B) No — hubo un FGA y un rebote ofensivo entre el último pase y la canasta**
- C) Sí, para #31 verde (creó el contraataque)
- D) Sí, para #2 verde y #31 comparten

**A8.** Un jugador salta para agravar el rebote, controla el balón en el aire, pero cae fuera de la cancha. ¿Qué se registra?
- A) OREB al jugador que lo controló
- **B) DREB de equipo rival (porque no controló su cuerpo = no es control estadístico real)**
- C) Pérdida + rebote de equipo rival
- D) No se registra nada

**A9.** Goaltending OFENSIVO cometido por el atacante. ¿Qué se registra?
- A) FGM al tirador
- B) FGA fallado + rebote defensivo
- **C) No hay FGA — se registra Turnover al jugador que cometió el goaltending**
- D) FGA + rebote defensivo + Turnover

**A10.** ¿Qué mide el "Plus/Minus" (+/-) de un jugador?
- A) Sus puntos anotados menos sus errores
- B) Su porcentaje de tiro ajustado
- **C) La diferencia de puntos del equipo (a favor y en contra) mientras ese jugador está en cancha**
- D) La diferencia entre asistencias y pérdidas

---

### Sección B: Casos prácticos con secuencia completa (3 preguntas abiertas)

**B1.** Describí la secuencia completa de estadísticas para esta jugada:
> "#20 azul lanza un triple. El balón toca el aro. El defensor #4 rojo lo palmea con intención de sacarlo, y el balón sale fuera de la cancha. El equipo azul recibe el saque."

*(Instrucción para el instructor: respuesta correcta = 3FGA #20 azul + OREB equipo azul. No hay tapón porque el balón ya tocó el aro. El saque de afuera corresponde a equipo azul porque el defensor lo envió fuera.)*

**B2.** Describí la secuencia completa de estadísticas para esta jugada:
> "#5 blanco roba el balón mientras #11 verde driblea. #5 blanco pasa inmediatamente a #3 blanco en la propia mitad del equipo blanco. #3 blanco va solo hasta el aro contrario y convierte antes de que ningún defensor verde cruce la mitad. #9 verde, capitán, saca de fondo."

*(Instrucción para el instructor: TO (manejo) #11 verde + STL #5 blanco + 2FGM #3 blanco (fast-break points). Sin asistencia para #5 blanco — el pase fue en propia mitad, coast to coast.)*

**B3.** Describí la secuencia completa de estadísticas para esta jugada:
> "#7 amarillo intenta un layup. El defensor #12 negro lo toca cuando el balón está en la mano de #7 por encima de su hombro. El tiro falla. El balón sale fuera de la cancha sin que nadie lo controle. El equipo amarillo recibe el saque."

*(Instrucción para el instructor: FGA #7 amarillo + BS #12 negro + OREB equipo amarillo (el balón salió fuera pero equipo amarillo recibe el saque = rebote de equipo ofensivo).)*

---

### Sección C: Pregunta de integración final

**C1 (texto abierto largo):**
> Describí qué hace que un estadístico sea considerado "de nivel FIBA". Nombrar al menos 5 principios o características, con ejemplos de cómo se aplican en situaciones reales de partido.

*(Instrucción para el instructor: evaluar que el alumno mencione: imparcialidad, consistencia entre equipos, no inventar ante la duda, conocer las reglas del basketball, registrar en orden cronológico, trabajo en equipo con la mesa, conocimiento de tipos especiales de jugadas, uso correcto del software. No hay una respuesta única — evaluar comprensión y profundidad.)*

---

*Felicitaciones por llegar al examen final.*
*Al aprobar este módulo, recibirás tu certificado oficial de Estadístico Inicial CPB.*
*El certificado incluye tu nombre, fecha de aprobación, y un código QR de verificación.*

---

*Curso desarrollado para la Confederación Paraguaya de Basketball (CPB)*
*Basado en el Manual del Estadístico FIBA 2024 (Versión 1.0)*
*Portal CPB Oficiales — cpb.com.py/oficiales*
