const multer = require('multer');

/**
 * Configuração do Multer.
 * Usa memoryStorage (buffer) pois na Lambda /tmp é limitado
 * e queremos enviar o buffer direto pro Baileys.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 50 MB max
  },
  fileFilter: (_req, file, cb) => {
    // Aceita apenas vídeos e imagens (extensível)
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/3gpp',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  },
});

module.exports = { upload };
