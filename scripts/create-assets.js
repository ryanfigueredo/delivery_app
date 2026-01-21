/**
 * Script para criar assets placeholder usando Node.js
 * Cria ícones simples usando canvas (se disponível) ou cria arquivos vazios
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Garantir que o diretório existe
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Criar um ícone SVG simples como placeholder
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#4CAF50"/>
  <text x="512" y="600" font-family="Arial" font-size="400" fill="white" text-anchor="middle">🍔</text>
</svg>`;

// Tentar usar sharp se disponível, senão criar SVG
try {
  const sharp = require('sharp');
  
  // Criar PNG a partir do SVG
  sharp(Buffer.from(iconSvg))
    .png()
    .resize(1024, 1024)
    .toFile(path.join(assetsDir, 'icon.png'))
    .then(() => {
      console.log('✅ icon.png criado com sucesso');
    })
    .catch(() => {
      // Se falhar, criar SVG como fallback
      fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
      console.log('⚠️  Criado icon.svg (converta para PNG manualmente)');
    });
} catch (e) {
  // Se sharp não estiver disponível, criar um PNG simples usando um método alternativo
  console.log('⚠️  Sharp não disponível. Criando placeholder...');
  
  // Criar um arquivo PNG mínimo válido (1x1 pixel verde)
  // Este é um PNG válido de 1x1 pixel verde
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x04, 0x00, // width: 1024
    0x00, 0x00, 0x04, 0x00, // height: 1024
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x00, 0x00, 0x00, 0x00, // CRC placeholder
    0x00, 0x00, 0x00, 0x00, // IEND
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND signature
  ]);
  
  // Na verdade, vamos usar uma abordagem mais simples: criar usando sips (macOS) ou imagem base64
  // Por enquanto, vamos criar um SVG e instruir o usuário
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
  console.log('✅ icon.svg criado');
  console.log('⚠️  Para criar icon.png, execute:');
  console.log('   sips -s format png assets/icon.svg --out assets/icon.png');
  console.log('   Ou use um conversor online de SVG para PNG');
}
