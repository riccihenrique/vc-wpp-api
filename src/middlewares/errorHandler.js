/**
 * Error handler global do Express.
 * Captura erros de todos os middlewares e controllers.
 */
function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err.message, err.stack);

  // Erro do Multer (upload)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Arquivo excede o tamanho máximo permitido (50MB)',
      LIMIT_UNEXPECTED_FILE: 'Campo de upload inesperado',
    };
    return res.status(400).json({
      error: messages[err.code] || err.message,
      code: err.code,
    });
  }

  // Erros conhecidos
  if (err.message?.includes('Tipo de arquivo não suportado')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message?.includes('WhatsApp não está conectado')) {
    return res.status(503).json({
      error: 'WhatsApp não está conectado. Tente novamente em instantes.',
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Erro interno do servidor' : err.message,
  });
}

module.exports = { errorHandler };
