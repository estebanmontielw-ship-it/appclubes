# CPB Design System — DESIGN.md

Documentación en formato **[DESIGN.md](https://github.com/google-labs-code/design.md)** (open-sourceado por Google Labs en Abril 2026) para el design system de los flyers CPB.

Cada `.design.md` contiene:
- **YAML front-matter** con tokens (colores, tipografía, componentes) — legible por máquinas
- **Markdown body** con rationale, reglas de uso y constraints — legible por humanos

## 📁 Archivos

```
docs/design/
├── README.md          ← este archivo (cómo usar)
├── lnb.design.md      ← LNB Masculino (navy + gold · scratchy)
└── lnbf.design.md     ← LNBF Femenino (violet + gold · ñandutí)
```

## 🎯 Para qué sirve

### 1. Onboarding de sesiones nuevas de Claude Code (ahorrar tokens)

En vez de re-explicarle a Claude Code todo el sistema en cada sesión:

> "Leé `docs/design/lnb.design.md` para entender el design system LNB. Después ayudame con X."

Ahorra **cientos de tokens por sesión** en contexto repetido.

### 2. Evitar ir a Claude Design para cada tweak

Ya no hace falta generar nuevos handoffs en Claude Design (caro) para cambios menores. Con la DESIGN.md, **cualquier LLM** (Claude Sonnet, Haiku, GPT, etc.) puede hacer cambios que respeten la marca:

> "Leé esta DESIGN.md [pegá archivo]. Generá un nuevo template 'RANKING' que use los mismos tokens."

### 3. Handoffs futuros estandarizados

Cuando Claude Design te entregue diseños nuevos (ej: cuarto tema, nueva liga), podés pedirle que genere directo una `<liga>.design.md` — format parseable que integramos sin re-interpretar JSX.

### 4. Validación automática (potencial futuro)

El CLI de Google Labs puede:
- Validar referencias de tokens (no hardcodear hex sueltos)
- Checkear contrast ratios WCAG
- Convertir a Tailwind config / W3C Design Tokens

Por ahora **no tenemos el CLI instalado** (alpha status). Los `.md` sirven como doc humana+máquina.

## 🔄 Flujo de trabajo sugerido

### Cuando querés un cambio en el flyer:

1. Abrí una sesión de Claude Code
2. Decile: **"Leé `docs/design/lnb.design.md`. Después ajustá X en el flyer."**
3. Claude Code ya tiene el contexto completo de la marca
4. No necesitás re-explicar colores/fuentes/componentes cada vez

### Cuando los tokens cambian:

1. Actualizá el `.design.md` (YAML front-matter)
2. Actualizá el código en `lib/themes/<liga>.ts` para que matcheen
3. Los commits mencionan ambos archivos

### Cuando vuelves con Claude Design:

1. Mandale la `.design.md` existente como "estado actual"
2. Pedile que genere SU diseño como una nueva `.design.md` con los mismos tokens
3. Comparás/mergeás sin perder la base

## 🧱 Mapping al código

Cada `.design.md` se refleja en 4 lugares del repo:

| DESIGN.md sección          | Archivo de código                               |
|----------------------------|-------------------------------------------------|
| `tokens.color.*`           | `lib/themes/lnb.ts` / `lib/themes/lnbf.ts`      |
| `tokens.typography.*`      | (fuentes TTF en `public/fonts/`)                 |
| `tokens.gradient.*`        | mismo archivo de theme                          |
| `tokens.pattern.*`         | `lib/flyer/lnb-backgrounds.tsx` / `lnbf-...`    |
| `components.card`          | `MatchCardLNBF` en `app/api/admin/flyer-v2/...` |
| `components.header`        | Hero header block (premium) en el mismo route  |
| `components.infoRow`       | `MatchCardLNBF` info row                        |
| `components.sponsorStrip`  | Sponsor container en el route                   |

## 🚀 Próximos pasos (opcionales)

- [ ] Instalar el CLI de DESIGN.md (cuando salga de alpha) para linting automático
- [ ] Generar un `<liga>.design.md` para U22M y U22F cuando tengan identidad propia
- [ ] Exportar a W3C Design Tokens para usar en Figma

## 📚 Referencias

- **Spec oficial:** https://github.com/google-labs-code/design.md
- **Awesome lista:** https://github.com/VoltAgent/awesome-design-md
- **Blog post Google:** Cassia Xu, Apr 21 2026 — "DESIGN.md format open-sourced"
