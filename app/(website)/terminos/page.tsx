import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso del sitio web y portal de la Confederación Paraguaya de Básquetbol",
}

export default function TerminosPage() {
  const updated = "10 de abril de 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionTitle
        title="Términos y Condiciones"
        subtitle={`Última actualización: ${updated}`}
      />

      <div className="prose prose-gray max-w-none mt-8 text-sm leading-relaxed space-y-8">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Aceptación</h2>
          <p className="text-gray-600">
            El acceso y uso del sitio web <strong>cpb.com.py</strong> y del Portal de Oficiales implica la aceptación
            plena y sin reservas de los presentes Términos y Condiciones. Si no está de acuerdo con alguno de ellos,
            deberá abstenerse de utilizar los servicios.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Titular del servicio</h2>
          <p className="text-gray-600">
            La <strong>Confederación Paraguaya de Básquetbol (CPB)</strong>, con domicilio en Asunción, República del
            Paraguay, es la entidad responsable de este sitio web y del Portal de Oficiales. La CPB es el ente rector
            del básquetbol en Paraguay, afiliado a FIBA y FIBA Américas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Acceso al Portal de Oficiales</h2>
          <p className="text-gray-600 mb-2">
            El Portal de Oficiales es un sistema de uso exclusivo para árbitros, oficiales de mesa, estadísticos,
            designadores, instructores, verificadores y miembros del cuerpo técnico habilitados por la CPB.
          </p>
          <p className="text-gray-600">
            El registro está reservado a personas mayores de 18 años con cédula de identidad paraguaya o
            documentación equivalente válida. La CPB se reserva el derecho de rechazar, suspender o cancelar
            cualquier cuenta que no cumpla con los requisitos reglamentarios.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Obligaciones del usuario</h2>
          <p className="text-gray-600 mb-2">Al utilizar el Portal de Oficiales, el usuario se compromete a:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Proporcionar información veraz, exacta y actualizada al momento del registro</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            <li>No transferir su cuenta a terceros</li>
            <li>No utilizar el portal con fines distintos a los establecidos por la CPB</li>
            <li>Notificar a la CPB de inmediato ante cualquier uso no autorizado de su cuenta</li>
            <li>Cumplir con los reglamentos internos de la CPB, FIBA y FIBA Américas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Habilitación y carnets digitales</h2>
          <p className="text-gray-600">
            El carnet digital emitido a través del portal tiene validez oficial como constancia de habilitación
            ante clubes, organizadores de torneos y autoridades deportivas, sujeto a que el estado de verificación
            del usuario sea <strong>VERIFICADO</strong> y el arancel correspondiente esté abonado.
            La CPB se reserva el derecho de suspender o revocar habilitaciones ante incumplimientos reglamentarios,
            sanciones disciplinarias o información falsa provista por el usuario.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Aranceles</h2>
          <p className="text-gray-600">
            Los aranceles de habilitación son fijados anualmente por la CPB y deben abonarse para completar el
            proceso de habilitación. El pago debe ser verificado por el equipo de la CPB. Los pagos realizados
            no son reembolsables salvo error comprobable imputable a la CPB.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Contenido del sitio público</h2>
          <p className="text-gray-600">
            La información publicada en cpb.com.py (partidos, estadísticas, noticias, posiciones) es provista
            con fines informativos. La CPB procura mantenerla actualizada y exacta, pero no garantiza la ausencia
            de errores u omisiones. Los resultados y estadísticas son provistos por servicios de terceros (Genius Sports)
            y están sujetos a la disponibilidad de dichos servicios.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">8. Propiedad intelectual</h2>
          <p className="text-gray-600">
            Todos los contenidos del sitio web (textos, imágenes, logotipos, diseño, código) son propiedad de la
            Confederación Paraguaya de Básquetbol o de sus licenciantes, y están protegidos por las leyes de
            propiedad intelectual de la República del Paraguay (<strong>Ley N° 1328/1998</strong> de Derechos de Autor
            y Derechos Conexos). Queda prohibida su reproducción total o parcial sin autorización expresa y por
            escrito de la CPB.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">9. Limitación de responsabilidad</h2>
          <p className="text-gray-600">
            La CPB no será responsable por daños directos o indirectos derivados del uso o imposibilidad de uso
            del portal, incluyendo interrupciones del servicio por mantenimiento, fallas técnicas o causas de
            fuerza mayor. El portal se proporciona "tal cual" sin garantías de disponibilidad continua.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">10. Suspensión y cancelación de cuenta</h2>
          <p className="text-gray-600">
            La CPB podrá suspender o cancelar el acceso al portal ante: (a) incumplimiento de estos términos,
            (b) información falsa o fraudulenta, (c) sanción disciplinaria firme impuesta por la CPB u organismo
            competente, o (d) solicitud del propio usuario. El usuario puede solicitar la cancelación de su cuenta
            enviando un correo a <a href="mailto:cpb@cpb.com.py" className="text-primary underline">cpb@cpb.com.py</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">11. Modificaciones</h2>
          <p className="text-gray-600">
            La CPB se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
            Las modificaciones serán notificadas a los usuarios registrados por correo electrónico con al menos
            7 días de anticipación. El uso continuado del portal tras dicha notificación implica la aceptación
            de los nuevos términos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">12. Ley aplicable y jurisdicción</h2>
          <p className="text-gray-600">
            Estos Términos y Condiciones se rigen por las leyes de la <strong>República del Paraguay</strong>.
            Para cualquier controversia derivada del uso del portal, las partes se someten a la jurisdicción
            de los <strong>tribunales competentes de la ciudad de Asunción</strong>, renunciando a cualquier
            otro fuero que pudiera corresponderles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">13. Contacto</h2>
          <p className="text-gray-600">
            Para consultas sobre estos Términos y Condiciones:
            <br />
            <strong>Confederación Paraguaya de Básquetbol</strong>
            <br />
            Email: <a href="mailto:cpb@cpb.com.py" className="text-primary underline">cpb@cpb.com.py</a>
            <br />
            Asunción, República del Paraguay
          </p>
        </section>

      </div>
    </div>
  )
}
