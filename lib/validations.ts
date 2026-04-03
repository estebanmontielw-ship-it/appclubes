import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
})

export const registroStep1Schema = z
  .object({
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    apellido: z.string().min(2, "Mínimo 2 caracteres"),
    cedula: z
      .string()
      .min(5, "CI inválido")
      .max(10, "CI inválido")
      .regex(/^\d+$/, "Solo números"),
    fechaNacimiento: z.string().min(1, "Requerido"),
    telefono: z
      .string()
      .min(8, "Teléfono inválido")
      .regex(/^\+?\d{8,15}$/, "Número de teléfono inválido"),
    genero: z.string().min(1, "Seleccioná un género"),
    ciudad: z.string().min(1, "Seleccioná una ciudad"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export const registroStep2Schema = z.object({
  roles: z
    .array(z.enum(["ARBITRO", "MESA", "ESTADISTICO"]))
    .min(1, "Seleccioná al menos un rol"),
})

export const registroStep3Schema = z.object({
  confirmaDatos: z.literal(true, {
    message: "Debés confirmar que los datos son verídicos",
  }),
})

export const recuperarSchema = z.object({
  email: z.string().email("Email inválido"),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegistroStep1Data = z.infer<typeof registroStep1Schema>
export type RegistroStep2Data = z.infer<typeof registroStep2Schema>
export type RegistroStep3Data = z.infer<typeof registroStep3Schema>
export type RecuperarFormData = z.infer<typeof recuperarSchema>
