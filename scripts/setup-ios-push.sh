#!/bin/bash
# Agrega la entitlement aps-environment al proyecto iOS después de `npx cap add ios`.
# Sin esta entitlement, iOS no permite registrar push notifications.

set -e

ENT_FILE="ios/App/App/App.entitlements"

if [ ! -f "$ENT_FILE" ]; then
  echo "❌ $ENT_FILE no existe. Correr después de 'npx cap add ios'."
  exit 1
fi

# Si ya tiene aps-environment, no hacer nada
if grep -q "aps-environment" "$ENT_FILE"; then
  echo "✅ aps-environment ya está en $ENT_FILE"
  exit 0
fi

# Insertar aps-environment = production antes del </dict> final
# Funciona con BSD sed (macOS) y GNU sed (Linux)
python3 -c "
import sys
path = '$ENT_FILE'
with open(path, 'r') as f:
    content = f.read()

insertion = '\t<key>aps-environment</key>\n\t<string>production</string>\n'
if '</dict>' in content:
    content = content.replace('</dict>', insertion + '</dict>', 1)
    with open(path, 'w') as f:
        f.write(content)
    print('✅ aps-environment=production agregado a', path)
else:
    print('❌ No se encontró </dict> en', path)
    sys.exit(1)
"

cat "$ENT_FILE"
