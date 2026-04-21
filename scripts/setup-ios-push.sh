#!/bin/bash
# Configura la entitlement aps-environment en el proyecto iOS después de `npx cap add ios`.
# Capacitor 7 no crea App.entitlements por default, así que si no existe lo genera.
# También se asegura que el .pbxproj referencie al archivo.

set -e

PROJECT_DIR="ios/App"
ENT_FILE="$PROJECT_DIR/App/App.entitlements"
PBXPROJ="$PROJECT_DIR/App.xcodeproj/project.pbxproj"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ $PROJECT_DIR no existe. Correr después de 'npx cap add ios'."
  exit 1
fi

# 1) Crear el entitlements file si no existe
if [ ! -f "$ENT_FILE" ]; then
  cat > "$ENT_FILE" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>production</string>
</dict>
</plist>
EOF
  echo "✅ Creado $ENT_FILE con aps-environment=production"
else
  # El archivo existe: agregar la key si no está
  if grep -q "aps-environment" "$ENT_FILE"; then
    echo "✅ aps-environment ya está en $ENT_FILE"
  else
    python3 -c "
path = '$ENT_FILE'
with open(path, 'r') as f:
    content = f.read()
insertion = '\t<key>aps-environment</key>\n\t<string>production</string>\n'
content = content.replace('</dict>', insertion + '</dict>', 1)
with open(path, 'w') as f:
    f.write(content)
print('✅ aps-environment=production agregado a', path)
"
  fi
fi

# 2) Asegurar que el .pbxproj referencia al entitlements file
if [ -f "$PBXPROJ" ]; then
  if grep -q "CODE_SIGN_ENTITLEMENTS" "$PBXPROJ"; then
    echo "✅ CODE_SIGN_ENTITLEMENTS ya está configurado en $PBXPROJ"
  else
    # Agregar CODE_SIGN_ENTITLEMENTS = App/App.entitlements; a ambas configs (Debug y Release)
    python3 -c "
import re
path = '$PBXPROJ'
with open(path, 'r') as f:
    content = f.read()
# Insertar después de CODE_SIGN_STYLE = Automatic; o línea similar en target App
pattern = r'(CODE_SIGN_STYLE\s*=\s*[^;]+;)'
replacement = r'\1\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;'
new_content, n = re.subn(pattern, replacement, content)
if n > 0:
    with open(path, 'w') as f:
        f.write(new_content)
    print(f'✅ CODE_SIGN_ENTITLEMENTS agregado en {n} lugares del pbxproj')
else:
    print('⚠️  No se pudo inyectar CODE_SIGN_ENTITLEMENTS automáticamente')
"
  fi
fi

cat "$ENT_FILE"
