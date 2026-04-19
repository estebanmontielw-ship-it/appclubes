import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"

export const metadata: Metadata = {
  title: "Eliminar cuenta",
  description: "Solicitá la eliminación de tu cuenta y datos personales de la app CPB",
}

export default function EliminarCuentaPage() {
  const updated = "19 de abril de 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionTitle
        title="Eliminar cuenta y datos"
        subtitle={`Última actualización: ${updated}`}
      />

      <div className="prose prose-gray max-w-none mt-8 text-sm leading-relaxed space-y-6">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Aplicación: CPB</h2>
          <p className="text-gray-600">
            Desarrollador: <strong>Confederación Paraguaya de Básquetbol (CPB)</strong><br />
            Sitio web: <a href="https://cpb.com.py" className="text-primary underline">cpb.com.py</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Cómo solicitar la eliminación de tu cuenta</h2>
          <p className="text-gray-600 mb-3">
            Si querés eliminar tu cuenta de la app CPB junto con todos tus datos personales,
            seguí estos pasos:
          </p>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-2">
            <li>
              Enviá un correo a{" "}
              <a href="mailto:cpb@cpb.com.py?subject=Solicitud de eliminación de cuenta" className="text-primary underline font-medium">
                cpb@cpb.com.py
              </a>{" "}
              desde el email con el que te registraste.
            </li>
            <li>
              Usá como asunto: <strong>"Solicitud de eliminación de cuenta"</strong>
            </li>
            <li>
              En el cuerpo del correo indicá tu nombre completo y número de cédula (si corresponde).
            </li>
            <li>
              Vas a recibir una confirmación dentro de <strong>30 días hábiles</strong>.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Datos que se eliminan</h2>
          <p className="text-gray-600 mb-3">
            Al procesar tu solicitud, eliminamos de nuestros sistemas:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>Nombre, apellido, email y teléfono</li>
            <li>Foto de perfil, cédula y carnet</li>
            <li>Fecha de nacimiento, ciudad y barrio</li>
            <li>Preferencias de notificación y club favorito</li>
            <li>Token de autenticación y sesiones activas</li>
            <li>Credenciales de acceso al Portal de Oficiales o CT</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Datos que se conservan</h2>
          <p className="text-gray-600 mb-3">
            Por obligaciones legales, contables y deportivas, algunos datos se conservan
            de manera anonimizada o bajo responsabilidad de la Confederación:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>
              <strong>Registros de designaciones y partidos arbitrados:</strong> se conservan
              de forma histórica por requisitos deportivos y estadísticos (sin datos personales
              identificables después de la eliminación).
            </li>
            <li>
              <strong>Registros de pagos y honorarios:</strong> se conservan por <strong>5 años</strong>{" "}
              según normativa tributaria paraguaya.
            </li>
            <li>
              <strong>Certificados de cursos e inscripciones:</strong> se conservan como antecedente
              académico de la Escuela Nacional de Árbitros.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Período de retención</h2>
          <p className="text-gray-600">
            Tu cuenta y datos personales son eliminados dentro de los <strong>30 días</strong> posteriores
            a la recepción de tu solicitud. Los datos que deben conservarse por obligación legal
            (mencionados arriba) se retienen por el plazo mínimo requerido y se eliminan automáticamente
            al vencimiento de dicho plazo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contacto</h2>
          <p className="text-gray-600">
            Si tenés consultas sobre el proceso de eliminación o protección de datos, escribinos a{" "}
            <a href="mailto:cpb@cpb.com.py" className="text-primary underline">cpb@cpb.com.py</a>.
          </p>
        </section>

      </div>
    </div>
  )
}
