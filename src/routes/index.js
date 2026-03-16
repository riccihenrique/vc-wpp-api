/**
 * Agregador de rotas.
 *
 * Para adicionar uma nova rota:
 *   1. Crie o arquivo em src/routes/novaRota.js
 *   2. Crie o controller em src/controllers/novoController.js
 *   3. Registre aqui: router.use('/nova-rota', require('./novaRota'));
 */

const { Router } = require('express');

const router = Router();

// ─── Rotas registradas ────────────────────────────────────
router.use('/video', require('./videoRoutes'));
router.use('/debug', require('./debugRoutes'));

// Adicione novas rotas abaixo:
// router.use('/image', require('./imageRoutes'));
// router.use('/text', require('./textRoutes'));
// ──────────────────────────────────────────────────────────

module.exports = router;
