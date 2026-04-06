import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const clubesSeed = [
  { nombre: "Academia de Pilar", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/Academia_de_Pilar.png" },
  { nombre: "Club 12 de Junio Coronel Oviedo", ciudad: "Coronel Oviedo", federacion: "Federación Ovetense", logo: "/logos/Club_12_de_Junio_Coronel_Oviedo.jpg" },
  { nombre: "Asu Academy", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Asu_Academy.jpg" },
  { nombre: "Escuela de Basquetbol San Ignacio", ciudad: "San Ignacio", federacion: "Federación de San Ignacio", logo: "" },
  { nombre: "Prode", ciudad: "Encarnación", federacion: "Federación Encarnacena", logo: "/logos/Prode.png" },
  { nombre: "Club Minga Guazú", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/Club_Minga_Guazu.jpg" },
  { nombre: "Don Bosco Basquet", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/Don_Bosco_Basquet.jpg" },
  { nombre: "Club Nacional For Ever", ciudad: "Concepción", federacion: "Federación Concepcionera", logo: "/logos/CLUB_NACIONAL_FOR_EVER.png" },
  { nombre: "Club Independencia FC", ciudad: "Concepción", federacion: "Federación Concepcionera", logo: "/logos/CLUB_INDEPENDENCIA_FOOTBALL_CLUB.png" },
  { nombre: "Club Náutico El Dorado", ciudad: "Concepción", federacion: "Federación Concepcionera", logo: "/logos/Club_Nautico_El_Dorado.jpg" },
  { nombre: "Club Social y Deportivo Santa Mónica", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/Club_Social_y_Deportivo_Santa_Monica.png" },
  { nombre: "Club Ayo Basket", ciudad: "Ayolas", federacion: "Federación de Ayolas", logo: "/logos/Club_Ayo_Basket.png" },
  { nombre: "PAI Coronel", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/PAI_CORONEL.png" },
  { nombre: "Fomento del Barrio Crucecita", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/Fomento_del_barrio_crucecita.jpeg" },
  { nombre: "Club Atlético Independiente", ciudad: "Obligado", federacion: "Federación de Colonias Unidas", logo: "/logos/Club_Atletico_Independiente.png" },
  { nombre: "Club Deportivo Emanuel", ciudad: "Hernandarias", federacion: "Federación de Hernandarias", logo: "" },
  { nombre: "Pumas Campo 9", ciudad: "J. Eulogio Estigarribia", federacion: "Metropolitano", logo: "/logos/Pumas_Campo_9.png" },
  { nombre: "Club Capitán Bado", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/Club_Capitan_Bado.jpg" },
  { nombre: "Colonias Gold", ciudad: "Obligado", federacion: "Federación de Colonias Unidas", logo: "/logos/Colonias_Gold.png" },
  { nombre: "Club San Alfonzo", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/Club_San_Alfonzo.jpg" },
  { nombre: "Club Primero de Mayo", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/Club_Primero_de_mayo.jpeg" },
  { nombre: "Club Atlético Sacachispas", ciudad: "Encarnación", federacion: "Federación Encarnacena", logo: "/logos/Club_Atletico_Sacachispas.jpg" },
  { nombre: "Club Nanawa", ciudad: "Nanawa", federacion: "Federación Concepcionera", logo: "/logos/Club_Nanawa.png" },
  { nombre: "Club Área 4", ciudad: "Ciudad del Este", federacion: "Federación Paranaense", logo: "/logos/Club_Area_4.jpg" },
  { nombre: "Franco Basquet Club", ciudad: "Presidente Franco", federacion: "Federación Franqueña", logo: "/logos/Franco_Basquet_Club.png" },
  { nombre: "Club Unión de Bella Vista", ciudad: "Bella Vista Sur", federacion: "Federación de Colonias Unidas", logo: "/logos/Club_Union_de_Bella_Vista.jpg" },
  { nombre: "Club Social y Deportivo Obrero", ciudad: "Alberdi", federacion: "Federación Alberdeña", logo: "/logos/Club_Social_y_Deportivo_Obrero.jpg" },
  { nombre: "Club Deportivo Juan José", ciudad: "Minga Guazú", federacion: "Federación de Minga Guazú", logo: "/logos/Club_Deportivo_Juan_Jose.jpg" },
  { nombre: "San José de Concepción", ciudad: "Concepción", federacion: "Federación Concepcionera", logo: "/logos/San_Jose_De_Concepcion.jpg" },
  { nombre: "América de Pilar", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/America_de_Pilar.png" },
  { nombre: "Juventud María Auxiliadora", ciudad: "Tomás Romero Pereira", federacion: "Federación de María Auxiliadora", logo: "/logos/Juventud_Maria_Auxiliadora.png" },
  { nombre: "Cerro Porteño", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Cerro_Porteno.jpg" },
  { nombre: "Escuela Caaguaceña de Basquetbol", ciudad: "Caaguazú", federacion: "Federación Caaguaceña", logo: "/logos/Escuela_Caaguacena_de_Basquetbol.jpg" },
  { nombre: "Sajonia", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Sajonia.png" },
  { nombre: "Juventud", ciudad: "Hohenau", federacion: "Federación de Colonias Unidas", logo: "/logos/Juventud.jpg" },
  { nombre: "Sportivo Sanlorenzo", ciudad: "San Lorenzo", federacion: "Federación Sanlorenzana", logo: "/logos/Sportivo_Sanlorenzo.png" },
  { nombre: "Club Deportivo Central", ciudad: "Capiatá", federacion: "Metropolitano", logo: "/logos/Club_Deportivo_Central.jpg" },
  { nombre: "Club Atlético Pilarense", ciudad: "Pilar", federacion: "Asociación Pilarense", logo: "/logos/Club_Atletico_Pilarense.jpg" },
  { nombre: "Deportivo Yacaré", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Deportivo_Yacare.png" },
  { nombre: "Club Atlético Ciudad Nueva", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Club_Atletico_Ciudad_Nueva.png" },
  { nombre: "Club Deportivo Amambay", ciudad: "Pedro Juan Caballero", federacion: "Federación de Amambay", logo: "/logos/Club_Deportivo_Amambay.jpg" },
  { nombre: "Guaireña Basquet Club", ciudad: "Villarrica", federacion: "Federación Guaireña", logo: "/logos/Guairena_Basquet_Club.jpg" },
  { nombre: "Club Cerro Porteño del Barrio Azucena", ciudad: "Coronel Oviedo", federacion: "Federación Ovetense", logo: "/logos/Club_Cerro_Porteno_del_Barrio_Azucena.jpg" },
  { nombre: "Club Deportivo Internacional", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Club_Deportivo_Internacional.png" },
  { nombre: "Club Pettirossi", ciudad: "Encarnación", federacion: "Federación Encarnacena", logo: "/logos/Club_Pettirossi.jpg" },
  { nombre: "Club Sportivo Luqueño Basquetbol", ciudad: "Luque", federacion: "Metropolitano", logo: "/logos/Club_Sportivo_Luqueno_Basquetbol.jpg" },
  { nombre: "Gorillas Basquet", ciudad: "Ciudad del Este", federacion: "Federación de Hernandarias", logo: "/logos/Gorillas_Basquet.jpg" },
  { nombre: "Club Atlético Paranaense", ciudad: "Encarnación", federacion: "Federación Encarnacena", logo: "/logos/Club_Atletico_Paranaense.png" },
  { nombre: "Colonias Unidas Basket Club", ciudad: "Obligado", federacion: "Federación de Colonias Unidas", logo: "/logos/Colonias_Unidas_Basket_Club.jpg" },
  { nombre: "Club Deportivo Campo Alto", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Club_Deportivo_Campo_Alto.png" },
  { nombre: "Sol de América", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Sol_de_America.png" },
  { nombre: "Club Deportivo Británico", ciudad: "Ciudad del Este", federacion: "Federación Paranaense", logo: "/logos/Club_Deportivo_Britanico.jpg" },
  { nombre: "Deportivo San José", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Deportivo_San_Jose.png" },
  { nombre: "Félix Pérez Cardozo", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Felix_Perez_Cardozo.jpg" },
  { nombre: "Olimpia", ciudad: "Asunción", federacion: "Metropolitano", logo: "/logos/Logo_de_Olimpia_2022_PNG_HD.png" },
]

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
    })
    if (adminRoles.length === 0) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    // Check how many clubs already exist
    const existingCount = await prisma.club.count()

    let created = 0
    let skipped = 0

    for (let i = 0; i < clubesSeed.length; i++) {
      const c = clubesSeed[i]
      const slug = slugify(c.nombre)

      // Skip if slug already exists
      const existing = await prisma.club.findUnique({ where: { slug } })
      if (existing) {
        skipped++
        continue
      }

      await prisma.club.create({
        data: {
          nombre: c.nombre,
          slug,
          ciudad: c.ciudad,
          sigla: c.federacion,
          logoUrl: c.logo || null,
          orden: existingCount + i,
          activo: true,
        },
      })
      created++
    }

    return NextResponse.json({ message: `Seed completado: ${created} clubes creados, ${skipped} ya existían` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
