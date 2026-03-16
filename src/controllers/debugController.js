const whatsappService = require('../services/whatsappService');

/**
 * GET /api/debug/groups
 * Lista todos os grupos que o bot tem acesso.
 */
async function listGroups(req, res, next) {
  try {
    await whatsappService.initialize();
    const sock = await whatsappService.getSocket();
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.values(chats).map(g => ({
      id: g.id,
      name: g.subject,
      participants: g.participants?.length || 0,
    }));
    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

module.exports = { listGroups };
