/**
 * WhatsApp Service — wrapper singleton sobre o Baileys.
 *
 * Mantém a conexão durante a vida do container Lambda (warm invocations).
 * Mantém a sessão localmente em /tmp/baileys_auth.
 *
 * Uso:
 *   const wpp = require('./services/whatsappService');
 *   await wpp.initialize();
 *   await wpp.sendVideo(groupId, buffer, caption);
 */

const pino = require('pino');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const AUTH_DIR = path.join('/tmp', 'baileys_auth');
const logger = pino({ level: config.app.logLevel });

let sock = null;
let isConnected = false;
let baileys = null;

/**
 * Carrega o módulo Baileys dinamicamente (ESM).
 */
async function loadBaileys() {
  if (!baileys) {
    baileys = await import('@whiskeysockets/baileys');
  }
  return baileys;
}

/**
 * Garante que o diretório de auth existe (/tmp é gravável na Lambda).
 */
function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

/**
 * Inicializa o socket do Baileys.
 * Retorna uma promise que resolve quando a conexão estiver pronta.
 */
async function initialize() {
  if (sock && isConnected) {
    logger.info('WhatsApp já conectado — reutilizando socket');
    return sock;
  }

  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = await loadBaileys();

  ensureAuthDir();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();


  sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ['WPP-API', 'Lambda', '1.0.0'],
  });

  // Exibe QR Code manualmente no terminal
  sock.ev.on('connection.update', (update) => {
    if (update.qr && config.app.nodeEnv === 'development') {
      console.log('\u001b[32m[WhatsApp] Escaneie o QR Code abaixo para conectar:\u001b[0m');
      console.log(update.qr);
    }
  });

  // Salva credenciais quando atualizadas
  sock.ev.on('creds.update', saveCreds);

  // Monitora estado da conexão
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      isConnected = false;
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(
        { statusCode, shouldReconnect },
        'Conexão WhatsApp fechada'
      );
      if (shouldReconnect) {
        initialize();
      }
    } else if (connection === 'open') {
      isConnected = true;
      logger.info('WhatsApp conectado com sucesso!');
    }
  });

  // Espera a conexão ficar pronta (max 30s)
  await waitForConnection(30_000);

  return sock;
}

/**
 * Espera o socket ficar conectado até o timeout.
 */
function waitForConnection(timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    if (isConnected) return resolve();

    const timeout = setTimeout(() => {
      reject(new Error('Timeout esperando conexão WhatsApp'));
    }, timeoutMs);

    const handler = ({ connection }) => {
      if (connection === 'open') {
        clearTimeout(timeout);
        sock.ev.off('connection.update', handler);
        resolve();
      }
    };

    sock.ev.on('connection.update', handler);
  });
}

/**
 * Envia um vídeo para um chat (grupo ou contato).
 *
 * @param {string}  chatId   - JID do grupo/contato (ex: '123456789@g.us')
 * @param {Buffer}  video    - Buffer do arquivo de vídeo
 * @param {string}  [caption]  - Legenda opcional
 * @param {string}  [mimetype] - MIME type (default: video/mp4)
 */
async function sendVideo(chatId, video, caption = '', mimetype = 'video/mp4') {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp não está conectado');
  }

  const result = await sock.sendMessage(chatId, {
    video,
    caption,
    mimetype,
  });

  logger.info({ chatId, messageId: result.key.id }, 'Vídeo enviado');
  return result;
}

/**
 * Envia uma mensagem de texto simples.
 *
 * @param {string} chatId - JID do grupo/contato
 * @param {string} text   - Texto da mensagem
 */
async function sendText(chatId, text) {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp não está conectado');
  }

  const result = await sock.sendMessage(chatId, { text });
  logger.info({ chatId, messageId: result.key.id }, 'Texto enviado');
  return result;
}

/**
 * Envia uma imagem.
 *
 * @param {string}  chatId   - JID do grupo/contato
 * @param {Buffer}  image    - Buffer da imagem
 * @param {string}  [caption]  - Legenda opcional
 * @param {string}  [mimetype] - MIME type (default: image/jpeg)
 */
async function sendImage(chatId, image, caption = '', mimetype = 'image/jpeg') {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp não está conectado');
  }

  const result = await sock.sendMessage(chatId, {
    image,
    caption,
    mimetype,
  });

  logger.info({ chatId, messageId: result.key.id }, 'Imagem enviada');
  return result;
}

/**
 * Retorna o status da conexão.
 */
function getStatus() {
  return { connected: isConnected };
}

/**
 * Encerra a conexão.
 */
async function disconnect() {
  if (sock) {
    sock.end();
    sock = null;
    isConnected = false;
  }
}

function getSocket() {
  if (!sock || !isConnected) throw new Error('WhatsApp não está conectado');
  return sock;
}

module.exports = {
  initialize,
  sendVideo,
  sendText,
  sendImage,
  getStatus,
  disconnect,
  getSocket,
};
