---
name: CPB · LNB (Liga Nacional de Básquetbol — Masculino)
version: 1.0.0
status: stable
league: lnb
format: design.md/0.1
brand:
  mood: "oficial · editorial · estadio"
  palette_feel: "navy profundo + gold protagonista"

tokens:
  color:
    navy:
      "950": "#03081A"  # deepest bg / footer
      "900": "#081233"  # primary bg tone
      "800": "#0E1D4F"  # card end stop / horario bar end
      "700": "#132970"  # horario bar start
      "600": "#1E3FA8"  # bg top / glows
    blue:
      "500": "#2D56D4"  # mid accent
      "400": "#5A83F2"  # card border accent
    text:
      cream: "#F2F5FF"   # primary white
      softBlue: "#A6BEFF"  # eyebrow / labels / badge pill
      mutedBlue: "#8FA3CF"  # secondary text
      creamAlt: "#C5D3F2"
    accent:
      gold500: "#D4AF37"  # VS, badges, hairlines, icons
      gold400: "#E6C865"  # lighter gold (hover/highlight)
      red500:  "#C8261F"  # rare accent
      red400:  "#E63322"  # stronger accent

  typography:
    family:
      display: "Archivo Black"  # hero titles, scores
      heading: "Bebas Neue"     # LARGE display alt (parece a Anton)
      body: "Inter"              # eyebrows, labels, UI general
    weight:
      regular: 400
      bold: 700
      black: 900
    letterSpacing:
      tight: -4       # hero titles Archivo Black
      tighter: -2     # scores
      normal: 0
      loose: 2        # VS gold
      looser: 2.5     # labels (JUEGO 01, ESTADIO)
      loosest: 4      # eyebrow ("ESTA SEMANA EN LA LIGA")

  radius:
    sm: 8
    md: 12
    lg: 18
    xl: 22
    pill: 999

  spacing:
    xs: 6
    sm: 10
    md: 16
    lg: 22
    xl: 32

  gradient:
    bgHero: "linear-gradient(160deg, #1E3FA8 0%, #0E1D4F 38%, #081233 70%, #03081A 100%)"
    cardBg: "linear-gradient(155deg, rgba(30,60,140,0.48) 0%, rgba(14,29,79,0.70) 65%, rgba(8,18,51,0.78) 100%)"
    horarioBar: "linear-gradient(90deg, #132970 0%, #0E1D4F 100%)"
    goldHairline: "linear-gradient(90deg, transparent, rgba(212,175,55,0.53), transparent)"
    goldRadialInner: "radial-gradient(circle at 18% 22%, rgba(212,175,55,0.18) 0%, transparent 58%)"

  glow:
    blue:  "radial-gradient(circle, rgba(45,86,212,0.45) 0%, rgba(45,86,212,0) 65%)"
    gold:  "radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0) 65%)"
    red:   "radial-gradient(circle, rgba(230,51,34,0.22) 0%, rgba(230,51,34,0) 65%)"

  pattern:
    available:
      - clean      # solo glows
      - scratch    # rayones (default LNB — estilo oficial)
      - dots       # constelación grain (220 puntos)
      - court      # líneas de cancha (perspectiva)
      - halftone   # puntos radiales
      - speed      # diagonales (sensación de movimiento)
    default: scratch

components:
  card:
    bg: "{gradient.cardBg}"
    border: "1.5px solid {blue.400}33"
    radius: "{radius.xl}"
    hairlineTop:
      position: "top:0 left:24 right:24 height:2"
      gradient: "{gradient.goldHairline}"
    innerTexture: "{gradient.goldRadialInner}"  # corner top-left

  header:
    layouts:
      - split      # logo izq + badge der + título left (default)
      - centered   # logo centrado + badge bajo + título centrado
    logo:
      position: "absolute top:28 left:48 (split) | top:28 center (centered)"
      baseSize:
        1_match: 200
        2_match: 175
        3to4: 145
        5plus: 120
    titleHero:
      font: "Archivo Black"
      size:
        1_match: 108
        2_match: 95
        3to4: 82
        5plus: 74
      letterSpacing: -4
      lineHeight: 0.92
      color: "{text.cream}"
    eyebrow:
      font: "Inter"
      weight: 600
      size: 17
      letterSpacing: 4
      color: "{text.softBlue}"
      default_pre: "ESTA SEMANA EN LA LIGA"
      default_resultado: "RESULTADOS DE LA FECHA"
    badge:
      shape: pill
      padding: "9px 20px"
      bg: "rgba(166,190,255,0.12)"
      border: "1px solid {blue.400}55"
      dot: "{accent.gold500}"
      text:
        font: "Inter"
        weight: 800
        size: 15
        letterSpacing: 2.5
        color: "{text.softBlue}"

  infoRow:
    layout: "3 columnas (ESTADIO | FECHA | HORA) + dividers verticales"
    bg: "rgba(3,8,26,0.55)"
    border: "1px solid rgba(166,190,255,0.18)"
    padding: "12px 14px"
    dividers:
      color: "rgba(166,190,255,0.18)"
      width: 1
      height: 32
    icons:
      style: "SVG inline stroke 1.8 color={accent.gold500}"
      set: [pin-map, calendar, clock]
    label:
      font: "Inter"
      weight: 800
      letterSpacing: 2.5
    value:
      font: "Inter"
      weight: 700
      color: "{text.cream}"
      # HORA usa Archivo Black para el número + "HS" chiquito gold al lado

  sponsorStrip:
    variants:
      with_bar: "bg dark rgba(3,8,26,0.78)"
      without_bar: "transparent + hairline superior gold suave"
    hairline:
      position: "top:0 of container"
      left: "10%"
      right: "10%"
      gradient: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)"
    logos:
      filter: "brightness(0) invert(1)"  # todos blancos unificados
      opacity: 0.85

  horarioBar:
    # Opcional. Por default OFF — la info row ya muestra HORA.
    default: off
    height: "max(44, cardH * 0.14)"
    bg: "{gradient.horarioBar}"
    label:
      text: "HORARIO | RESULTADO"
      color: "{text.softBlue}"
      font: "Inter weight 700 ls 3"
    value:
      text: "{time} HS | {home} - {away}"
      font: "Archivo Black"
      size: "cardH * 0.105"
---

# CPB · LNB — Liga Nacional de Básquetbol (Masculino) · Apertura 2026

Diseño system para los flyers de la **liga masculina**. Paleta **navy profundo + gold**. Feel **oficial · editorial**, protagonista del hero con pequeño respeto por la tradición deportiva (rayones, textura de cancha sutil).

## 🎯 Identidad

- **Color primario:** `navy.800` `#0E1D4F` y `navy.900` `#081233`
- **Accent de marca:** `gold.500` `#D4AF37` — se usa en VS, hairlines, iconos, dots de badge y score ganador
- **Contraste:** texto blanco crema `#F2F5FF` sobre fondos navy → cumple **WCAG AA** para texto de 14px+
- **Patrón por defecto:** `scratch` (rayones 80 líneas) — replica flyers oficiales LNB
- **Fuente hero:** Archivo Black 900 — títulos gigantes left-aligned

## 📐 Layout por cantidad de partidos

Los flyers se auto-adaptan según `count` (cantidad de partidos seleccionados):

| count | cardH base | logoSize team | nameFontSize | vsFontSize |
|-------|-----------|---------------|--------------|------------|
| 1     | 480       | 150           | 28           | 58         |
| 2     | 400       | 120           | 24           | 48         |
| 3     | 295       | 90            | 20           | 40         |
| 4+    | 240       | 75            | 17           | 34         |

Para **Historia 9:16** se multiplica todo por `vMult = 1.4` (a menos que `safeZones` esté activado, que lo devuelve a 1.0).

## 🧩 Anatomía del Match Card

```
┌────────────────────────────────────────────────┐
│ ── hairline gold top 2px ─────────────────────│
│ • JUEGO 0X                       (radial gold  │
│                                    en esquina) │
│   ┌──┐                  VS                ┌──┐ │
│   │  │   DEPORTIVO              OLIMPIA   │  │ │
│   │  │    SAN JOSE               KINGS    │  │ │
│   └──┘                   —                └──┘ │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ 📍ESTADIO   │ 📅FECHA      │ 🕐HORA 19:30│  │
│  │  Coundou    │  JUE 23 ABR  │  HS         │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Elementos críticos (no los remuevas):**
1. Gold hairline top (2px, gradient transparent→gold→transparent)
2. Badge "JUEGO 0X" con dot gold + label `softBlue`
3. VS en `gold.500` con Archivo Black (no gradient)
4. Info row inline con 3 iconos (pin, calendar, clock)
5. Radial gold sutil en esquina superior-izquierda (textura)

## 🖼️ Headers (split vs centered)

### Split (default)
- Logo absolute `top:28 left:48`, tamaño = `logoBaseSize * logoScale`
- Badge "FECHA X" absolute `top:28 right:48`, pill
- Título Archivo Black left-aligned (2 líneas)
- `paddingTop = 28 + logoSize + 24` (crítico: reserva espacio REAL del logo)

### Centered (alt, estilo V1 LNB oficial)
- Logo absolute `top:28` horizontal center
- Badge debajo del logo (en flow)
- Eyebrow + título centrados

**Cuándo usar cuál:**
- `split`: flyers con título gigante protagonista
- `centered`: flyers de lanzamiento / resultados oficiales donde el logo lidera

## 🎨 Patrones de fondo

| Variant   | Uso recomendado                     |
|-----------|-------------------------------------|
| `clean`   | Cuando hay muchas cards + sponsors  |
| `scratch` | **Default** — editorial oficial     |
| `dots`    | Feel "grain/poster"                 |
| `court`   | Template Tabla de Posiciones        |
| `halftone`| Resultado Final (alto impacto)      |
| `speed`   | Template Jugador del Partido        |

## ⚠️ Satori constraints (críticas)

Satori (`@vercel/og`) no es CSS estándar. Respetar:

1. **Cada `<span>` con texto** necesita `display: "flex"` en el padre
2. **No usar `background-image: url()`** — usar `<img>` absolute o gradientes
3. **No `radial-gradient(ellipse ...)`** — solo `circle`
4. **No CSS `grid`** — usar `flex` + width %
5. **`letter-spacing` negativo agresivo** (ej. -4) puede causar overlap — cap a -4 máx
6. **Transform solo con scale+translate** — no `transform-origin`
7. **Pre-calcular randoms** — `Math.random()` en render rompe el cache
8. **Fuentes custom** hay que registrarlas como binarios en `ImageResponse({ fonts })`

## 📦 Assets disponibles

Ya cargados en `/public/`:

- `/public/fonts/ArchivoBlack-Regular.ttf` (display)
- `/public/fonts/BebasNeue-Regular.ttf` (heading alt)
- `/public/fonts/Inter-Regular.ttf` (body 400)
- `/public/fonts/Inter-Bold.ttf` (body 700)
- `/public/fonts/Inter-Black.ttf` (body 900)
- `/public/logos/lnb.png` (logo de la liga)
- `/public/logos/molten.png`, `kyrios.png`, `powerade.png` (sponsors)

## 🔧 Implementación actual

- **Tokens en código:** `lib/themes/lnb.ts`
- **Backgrounds en código:** `lib/flyer/lnb-backgrounds.tsx`
- **Renderer:** `app/api/admin/flyer-v2/route.tsx`
- **Designer UI:** `app/(admin)/oficiales/admin/diseno-v2/page.tsx`

## 📋 Reglas de uso (do / don't)

**DO:**
- Usar gold solo como accent (VS, iconos, hairlines). Nunca como fondo.
- Mantener títulos hero en Archivo Black con letter-spacing -4
- Respetar paddingTop dinámico en header (= 28 + logoSize + 24)
- Default pattern: `scratch` para flyers oficiales / `clean` para minimalistas

**DON'T:**
- No mezclar navy con rojos saturados (el red accent existe pero es rarísimo)
- No usar fuentes del sistema — siempre las 3 cargadas
- No crear cards sin hairline top (rompe la identidad)
- No poner el título en 1 sola línea si tiene 2 palabras (siempre en 2 líneas hero)
