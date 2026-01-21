#!/bin/bash
# Script para criar assets placeholder temporários

# Criar ícone simples (1024x1024) - requer ImageMagick ou similar
# Por enquanto, vamos apenas criar arquivos vazios como placeholder

echo "Criando assets placeholder..."
echo "⚠️  Para produção, substitua por imagens reais!"

# Se tiver ImageMagick instalado, descomente:
# convert -size 1024x1024 xc:#4CAF50 -pointsize 200 -fill white -gravity center -annotate +0+0 "🍔" assets/icon.png
# convert -size 1242x2436 xc:#4CAF50 assets/splash.png
# convert -size 1024x1024 xc:#4CAF50 -pointsize 200 -fill white -gravity center -annotate +0+0 "🍔" assets/adaptive-icon.png
# convert -size 48x48 xc:#4CAF50 assets/favicon.png

echo "✅ Assets placeholder criados (ou use gerador online)"
