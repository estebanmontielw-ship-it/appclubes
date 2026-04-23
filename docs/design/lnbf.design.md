---
name: CPB · LNBF (Liga Nacional de Básquetbol — Femenino)
version: 1.0.0
status: stable
league: lnbf
format: design.md/0.1
brand:
  mood: "premium · fashion deportivo"
  palette_feel: "morado profundo + gold + ñandutí"

tokens:
  color:
    violet:
      "950": "#0E0418"  # deepest bg
      "900": "#1A0A2E"
      "800": "#2B0E4D"  # card end stop
      "700": "#3C1370"  # bg top / horario bar start
      "600": "#5A1FA3"  # glow
      "500": "#7B2CDE"
      "400": "#A45AFF"  # borders
      "300": "#C9A0FF"  # eyebrow / labels
    text:
      cream: "#FAF5FF"
      white: "#FFFFFF"
    accent:
      gold500: "#FFC857"  # más cálido que LNB (orange-ish)
      gold400: "#FFD985"
      red500:  "#E63946"  # raramente usado
      azure500: "#4361EE"

  typography:
    family:
      display: "Archivo Black"  # hero titles, scores
      heading: "Bebas Neue"
      body: "Inter"              # eyebrows, labels, UI
    weight:
      regular: 400
      bold: 700
      black: 900
    letterSpacing:
      tight: -4
      tighter: -2
      normal: 0
      loose: 2
      looser: 2.5
      loosest: 4

  radius:
    sm: 8
    md: 16
    lg: 20
    xl: 28
    pill: 999

  spacing:
    xs: 6
    sm: 10
    md: 16
    lg: 22
    xl: 32

  gradient:
    bgHero: "linear-gradient(160deg, #3C1370 0%, #2B0E4D 35%, #1A0A2E 70%, #0E0418 100%)"
    cardBg: "linear-gradient(155deg, rgba(60,19,112,0.50) 0%, rgba(43,14,77,0.68) 65%, rgba(14,4,24,0.78) 100%)"
    horarioBar: "linear-gradient(90deg, #3C1370 0%, #2B0E4D 100%)"
    goldHairline: "linear-gradient(90deg, transparent, rgba(255,200,87,0.53), transparent)"
    goldRadialInner: "radial-gradient(circle at 18% 22%, rgba(255,200,87,0.18) 0%, transparent 58%)"

  glow:
    violet: "radial-gradient(circle, rgba(123,44,222,0.45) 0%, rgba(123,44,222,0) 65%)"
    gold:   "radial-gradient(circle, rgba(255,200,87,0.25) 0%, rgba(255,200,87,0) 65%)"

  pattern:
    available:
      - clean    # solo glows
      - dots     # constelación gold (default)
      - nandu    # patrón ñandutí (rombos) — referencia cultural paraguaya
      - court    # líneas de cancha
    default: dots

components:
  card:
    bg: "{gradient.cardBg}"
    border: "1.5px solid {violet.400}33"
    radius: "{radius.lg}"
    hairlineTop:
      position: "top:0 left:24 right:24 height:2"
      gradient: "{gradient.goldHairline}"
    innerTexture: "{gradient.goldRadialInner}"

  header:
    layouts:
      - split      # logo izq + badge der + título left (default)
      - centered   # logo centrado arriba
    logo:
      position: "absolute top:28 left:48 | top:28 center"
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
      color: "{text.white}"
    eyebrow:
      font: "Inter"
      weight: 600
      size: 17
      letterSpacing: 4
      color: "{violet.300}"
      default_pre: "ESTA SEMANA EN LA LIGA"
      default_resultado: "RESULTADOS DE LA FECHA"
    badge:
      shape: pill
      padding: "9px 20px"
      bg: "rgba(201,160,255,0.12)"
      border: "1px solid {violet.400}55"
      dot: "{accent.gold500}"
      text:
        font: "Inter"
        weight: 800
        size: 15
        letterSpacing: 2.5
        color: "{violet.300}"

  infoRow:
    layout: "3 columnas (ESTADIO | FECHA | HORA) + dividers verticales"
    bg: "rgba(3,8,26,0.55)"
    border: "1px solid rgba(201,160,255,0.18)"
    padding: "12px 14px"
    icons:
      style: "SVG inline stroke 1.8 color={accent.gold500}"
      set: [pin-map, calendar, clock]
    label:
      font: "Inter"
      weight: 800
      letterSpacing: 2.5
      color: "{violet.300}"
    value:
      font: "Inter"
      weight: 700
      color: "{text.white}"

  sponsorStrip:
    variants:
      with_bar: "bg violet deep rgba(14,4,24,0.75)"
      without_bar: "transparent + hairline superior"
    hairline:
      position: "top:0 of container"
      left: "10%"
      right: "10%"
      gradient: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)"
    logos:
      filter: "brightness(0) invert(1)"
      opacity: 0.85

  horarioBar:
    default: off
    height: "max(44, cardH * 0.14)"
    bg: "{gradient.horarioBar}"
    label:
      color: "{violet.300}"
      font: "Inter weight 700 ls 3"
    value:
      font: "Archivo Black"
      size: "cardH * 0.105"
---

# CPB · LNBF — Liga Nacional de Básquetbol (Femenino) · Apertura 2026

Design system para los flyers de la **liga femenina**. Paleta **morado profundo + gold**. Feel **premium fashion deportivo** con referencia cultural paraguaya (patrón ñandutí opcional).

## 🎯 Identidad

- **Color primario:** `violet.800` `#2B0E4D` y `violet.900` `#1A0A2E`
- **Accent de marca:** `gold.500` `#FFC857` (más cálido que LNB, leves tonos naranja)
- **Contraste:** texto blanco `#FFFFFF` sobre fondos violet → cumple **WCAG AA**
- **Patrón por defecto:** `dots` (constelación de puntos dorados)
- **Pattern signature:** `nandu` — rombos estilizados del tejido ñandutí
- **Fuente hero:** Archivo Black 900

## 🎨 Diferencias clave con LNB

| Aspecto        | LNB                    | LNBF                     |
|----------------|------------------------|--------------------------|
| Hue            | Navy blue              | Purple/violet            |
| Gold tone      | `#D4AF37` (amber warm) | `#FFC857` (golden warm)  |
| Pattern default| `scratch` (rayones)    | `dots` (constelación)    |
| Cultural ref   | Oficial / deportivo    | Ñandutí paraguayo        |
| Feel           | Estadio tradicional    | Editorial fashion        |

## 📐 Layout por cantidad de partidos

Los flyers se auto-adaptan según `count` (idéntico a LNB):

| count | cardH base | logoSize team | nameFontSize | vsFontSize |
|-------|-----------|---------------|--------------|------------|
| 1     | 480       | 150           | 28           | 58         |
| 2     | 400       | 120           | 24           | 48         |
| 3     | 295       | 90            | 20           | 40         |
| 4+    | 240       | 75            | 17           | 34         |

Para **Historia 9:16** se multiplica todo por `vMult = 1.4`.

## 🧩 Anatomía del Match Card

Idéntica estructura que LNB (hairline gold top, JUEGO 0X badge, VS gold, info row con iconos) — **solo cambia la paleta**.

## 🎨 Patrones de fondo

| Variant   | Uso recomendado                          |
|-----------|------------------------------------------|
| `clean`   | Minimalista, solo glows violeta + gold   |
| `dots`    | **Default** — constelación gold sutil    |
| `nandu`   | Firmas culturales / especiales           |
| `court`   | Tabla de Posiciones                      |

## 📦 Assets

Mismos fonts que LNB (Archivo Black / Bebas Neue / Inter).

Logo LNBF en `/public/logos/lnbf.png`.

## 🔧 Implementación actual

- **Tokens en código:** `lib/themes/lnbf.ts`
- **Backgrounds en código:** `lib/flyer/lnbf-backgrounds.tsx`
- **Renderer:** `app/api/admin/flyer-v2/route.tsx`
- **Designer UI:** `app/(admin)/oficiales/admin/diseno-v2/page.tsx`

## ⚠️ Satori constraints

Mismas que LNB — ver `lnb.design.md` sección "Satori constraints" para la lista completa.

## 📋 Reglas de uso

**DO:**
- Usar `gold.500` `#FFC857` consistente — es WARMER que LNB, no intercambiar
- Patrón ñandutí (`nandu`) para flyers de identidad paraguaya fuerte (lanzamientos)
- Mantener el violet300 `#C9A0FF` para labels/eyebrows (único tinted)

**DON'T:**
- No uses violet y navy juntos (son líneas separadas — LNB vs LNBF)
- El red accent `#E63946` está casi nunca justificado
- No apliques el patrón `scratch` (es de LNB)
