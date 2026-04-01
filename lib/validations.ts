import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
})

export const registroStep1Schema = z
  .object({
    primerNombre: z.string().min(2, "Mínimo 2 caracteres"),
    segundoNombre: z.string(),
    primerApellido: z.string().min(2, "Mínimo 2 caracteres"),
    segundoApellido: z.string(),
    cedula: z
      .string()
      .min(5, "CI inválido")
      .max(10, "CI inválido")
      .regex(/^\d+$/, "Solo números"),
    fechaNacimiento: z.string().min(1, "Requerido"),
    telefono: z
      .string()
      .min(10, "Teléfono inválido")
      .regex(/^09\d{8}$/, "Formato: 09X XXXXXXXX"),
    ciudad: z.string().min(1, "Seleccioná una ciudad"),
    nacionalidad: z.string().min(1, "Seleccioná una nacionalidad"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
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
