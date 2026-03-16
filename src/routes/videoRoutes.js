const { Router } = require('express');
const { upload } = require('../middlewares/upload');
const videoController = require('../controllers/videoController');

const router = Router();

/**
 * POST /api/video/send
 * Envia um vídeo para um grupo WhatsApp.
 *
 * multipart/form-data:
 *   - video   (file)
 *   - groupId (text, opcional)
 *   - caption (text, opcional)
 */
router.post('/send', upload.single('video'), videoController.sendVideo);

module.exports = router;
