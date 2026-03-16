const whatsappService = require('../services/whatsappService');
const config = require('../config');

/**
 * POST /api/video/send
 *
 * Recebe um vídeo via multipart/form-data e envia para o grupo
 * configurado (ou para o groupId do body).
 *
 * Form fields:
 *   - video   (file)  : arquivo de vídeo (obrigatório)
 *   - groupId (text)  : JID do grupo (opcional, usa env WPP_GROUP_ID se omitido)
 *   - caption (text)  : legenda do vídeo (opcional)
 */
async function sendVideo(req, res, next) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum vídeo enviado. Use o campo "video".' });
    }

    const groupId = req.body.groupId || config.whatsapp.groupId;
    if (!groupId) {
      return res.status(400).json({
        error: 'groupId não informado. Envie no body ou configure WPP_GROUP_ID.',
      });
    }

    const caption = req.body.caption || '';

    // Garante conexão
    await whatsappService.initialize();

    // Envia o vídeo
    const result = await whatsappService.sendVideo(
      groupId,
      file.buffer,
      caption,
      file.mimetype
    );

    return res.status(200).json({
      success: true,
      messageId: result.key.id,
      groupId,
      caption,
      fileName: file.originalname,
      size: file.size,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendVideo };
