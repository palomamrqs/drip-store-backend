// Salva imagens recebidas em base64 na pasta uploads/products
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HttpError = require('./HttpError');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

const EXTENSIONS = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Recebe { type, content } e grava o arquivo no disco.
 * Retorna o caminho relativo que vai para o banco (ex.: uploads/products/abc.png).
 */
function saveBase64Image({ type, content }) {
  const ext = EXTENSIONS[type];
  if (!ext) throw HttpError.badRequest(`Tipo de imagem não suportado: ${type}`);
  if (!content || typeof content !== 'string') throw HttpError.badRequest('Imagem sem conteúdo');

  // Aceita tanto "iVBOR..." quanto "data:image/png;base64,iVBOR..."
  const base64 = content.replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
    throw HttpError.badRequest('O conteúdo da imagem deve estar em base64');
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(base64, 'base64'));
  return `uploads/products/${filename}`;
}

/** Apaga o arquivo do disco, se existir (usado ao remover/trocar imagens). */
function deleteImageFile(relativePath) {
  if (!relativePath || !relativePath.startsWith('uploads/')) return;
  const full = path.resolve(__dirname, '..', '..', relativePath);
  fs.rm(full, { force: true }, () => {});
}

module.exports = { saveBase64Image, deleteImageFile };
