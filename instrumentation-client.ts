import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Solo enviar errores en producción
  enabled: process.env.NODE_ENV === "production",

  // Porcentaje de transacciones capturadas para performance (10%)
  tracesSampleRate: 0.1,

  // No mostrar dialog de reporte al usuario
  beforeSend(event) {
    return event
  },
})
