import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Verificá tu email</CardTitle>
          <CardDescription>
            Te enviamos un email de verificación. Revisá tu bandeja de entrada y hacé click en el link para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Si no lo encontrás, revisá la carpeta de spam.
          </p>
          <Link href="/oficiales/login">
            <Button variant="outline">Ir al login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
