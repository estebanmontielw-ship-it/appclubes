import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y protección de datos personales de la Confederación Paraguaya de Básquetbol",
  alternates: { canonical: "/privacidad" },
}

export default function PrivacidadPage() {
  const updated = "10 de abril de 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionTitle
        title="Política de Privacidad"
        subtitle={`Última actualización: ${updated}`}
      />

      <div className="prose prose-gray max-w-none mt-8 text-sm leading-relaxed space-y-8">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p className="text-gray-600">
            La <strong>Confederación Paraguaya de Básquetbol (CPB)</strong>, con domicilio en Asunción, República del Paraguay,
            es responsable del tratamiento de los datos personales recopilados a través del sitio web{" "}
            <strong>cpb.com.py</strong> y el Portal de Oficiales.
            Contacto: <a href="mailto:cpb@cpb.com.py" className="text-primary underline">cpb@cpb.com.py</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. Marco legal</h2>
          <p className="text-gray-600">
            El tratamiento de datos personales se rige por la <strong>Ley N° 1682/2001</strong> "Que reglamenta la información
            de carácter privado" y su modificatoria <strong>Ley N° 1969/2002</strong>, así como por los artículos 33 y 135
            de la Constitución Nacional de la República del Paraguay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. Datos que recopilamos</h2>
          <p className="text-gray-600 mb-2">Recopilamos los siguientes datos al registrarse en el Portal de Oficiales:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Nombre y apellido</li>
            <li>Número de cédula de identidad</li>
            <li>Fecha de nacimiento</li>
            <li>Número de teléfono</li>
            <li>Ciudad y barrio de residencia</li>
            <li>Género</li>
            <li>Dirección de correo electrónico</li>
            <li>Fotografía de carnet y/o cédula de identidad (para verificación)</li>
            <li>Comprobantes de pago de aranceles de habilitación</li>
            <li>Rol(es) de oficial dentro de la CPB (árbitro, estadístico, etc.)</li>
          </ul>
          <p className="text-gray-600 mt-2">
            El sitio web público puede registrar datos técnicos de navegación (dirección IP, navegador, páginas visitadas)
            a través de servicios de análisis y monitoreo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Finalidad del tratamiento</h2>
          <p className="text-gray-600 mb-2">Los datos se utilizan exclusivamente para:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Verificar la identidad y habilitación de árbitros, oficiales y miembros del cuerpo técnico</li>
            <li>Gestionar designaciones arbitrales y planillas de partido</li>
            <li>Emitir y validar carnets digitales de habilitación</li>
            <li>Procesar y verificar pagos de aranceles</li>
            <li>Enviar notificaciones sobre designaciones, cursos y novedades institucionales</li>
            <li>Cumplir con obligaciones reglamentarias ante FIBA y FIBA Américas</li>
            <li>Generar estadísticas institucionales anonimizadas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Base de legitimación</h2>
          <p className="text-gray-600">
            El tratamiento se basa en el <strong>consentimiento expreso</strong> del titular al momento del registro,
            y en la <strong>relación contractual/reglamentaria</strong> entre el oficial y la CPB en su calidad de
            ente rector del básquetbol en Paraguay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Transferencia de datos a terceros</h2>
          <p className="text-gray-600 mb-2">
            La CPB no vende ni cede datos personales a terceros con fines comerciales. Los datos pueden ser
            compartidos únicamente con:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li><strong>Supabase</strong> (autenticación y base de datos, servidores en la nube)</li>
            <li><strong>Google Firebase</strong> (notificaciones push)</li>
            <li><strong>Sentry</strong> (monitoreo de errores técnicos, datos anonimizados)</li>
            <li><strong>FIBA / FIBA Américas</strong> — cuando sea requerido por obligaciones reglamentarias internacionales</li>
          </ul>
          <p className="text-gray-600 mt-2">
            Estos proveedores actúan como encargados del tratamiento y están contractualmente obligados a proteger
            los datos conforme a estándares internacionales de seguridad.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Conservación de los datos</h2>
          <p className="text-gray-600">
            Los datos se conservan mientras el titular mantenga una relación activa con la CPB (habilitación vigente
            o en proceso). Tras la baja definitiva, los datos se conservarán por un período máximo de <strong>5 años</strong>{" "}
            por motivos de auditoría reglamentaria, transcurridos los cuales serán eliminados o anonimizados.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">8. Derechos del titular (Habeas Data)</h2>
          <p className="text-gray-600 mb-2">
            Conforme al Artículo 135 de la Constitución Nacional y la Ley N° 1682/2001, el titular tiene derecho a:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li><strong>Acceso:</strong> conocer qué datos suyos obran en nuestros registros</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos cuando no sean necesarios</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento en determinadas circunstancias</li>
          </ul>
          <p className="text-gray-600 mt-2">
            Para ejercer estos derechos, envíe una solicitud escrita a{" "}
            <a href="mailto:cpb@cpb.com.py" className="text-primary underline">cpb@cpb.com.py</a>{" "}
            indicando su nombre completo y número de cédula. Responderemos en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">9. Seguridad</h2>
          <p className="text-gray-600">
            Implementamos medidas técnicas y organizativas para proteger sus datos: cifrado en tránsito (HTTPS/TLS),
            acceso restringido por roles, autenticación segura, y monitoreo continuo de seguridad. Las contraseñas
            nunca son almacenadas en texto plano.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">10. Almacenamiento local y notificaciones</h2>
          <p className="text-gray-600">
            El portal puede almacenar información en el dispositivo del usuario (localStorage, cookies de sesión)
            para mantener la sesión activa y las preferencias de usuario. Las notificaciones push requieren autorización
            explícita del usuario y pueden revocarse en cualquier momento desde la configuración del dispositivo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">11. Menores de edad</h2>
          <p className="text-gray-600">
            El Portal de Oficiales está dirigido a personas mayores de 18 años. No recopilamos intencionalmente
            datos de menores. Si un menor se registra sin autorización, el titular o su representante legal puede
            solicitar la eliminación de los datos contactándonos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">12. Modificaciones</h2>
          <p className="text-gray-600">
            Esta política puede ser actualizada para reflejar cambios en nuestras prácticas o en la legislación aplicable.
            Las modificaciones serán notificadas a los usuarios registrados por correo electrónico y publicadas en esta página
            con la fecha de actualización.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">13. Contacto</h2>
          <p className="text-gray-600">
            Para consultas sobre esta Política de Privacidad o el tratamiento de sus datos:
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
