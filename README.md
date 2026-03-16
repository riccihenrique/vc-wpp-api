# wpp-api

API Node.js para envio de mensagens via WhatsApp, rodando localmente (Home Assistant, servidor pessoal, etc).

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **WhatsApp:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (sem puppeteer/browser)
- **Upload:** Multer (memory storage)

## Estrutura

```
src/
├── handler.js              # Entry point Lambda
├── app.js                  # Express app
├── local.js                # Server local para dev
├── config/
│   └── index.js            # Variáveis de ambiente
├── routes/
│   ├── index.js            # Agregador de rotas
│   └── videoRoutes.js      # Rotas de vídeo
├── controllers/
│   └── videoController.js  # Lógica de vídeo
├── services/
│   └── whatsappService.js  # Singleton Baileys
├── middlewares/
│   ├── errorHandler.js     # Error handler global
│   └── upload.js           # Config do Multer
└── utils/
    └── s3Auth.js           # Persiste sessão no S3
```

## Setup

```bash
# Instalar dependências
npm install

# Copiar e preencher variáveis
cp .env.example .env

# Rodar localmente
npm run dev
```

Na primeira execução local, o Baileys vai mostrar um **QR Code no terminal**.
Escaneie com o WhatsApp para autenticar. A sessão fica salva em `/tmp/baileys_auth`.

## Variáveis de Ambiente

| Variável         | Descrição                               | Default       |
| ---------------- | --------------------------------------- | ------------- |
| `AWS_REGION`     | Região AWS                              | `us-east-1`   |
| `S3_BUCKET_AUTH` | Bucket S3 para persistir sessão         | —             |
| `WPP_GROUP_ID`   | JID padrão do grupo WhatsApp            | —             |
| `PORT`           | Porta do servidor local                 | `3000`        |
| `NODE_ENV`       | Ambiente (`development` / `production`) | `development` |
| `LOG_LEVEL`      | Nível de log do pino                    | `info`        |

## Rotas

### `POST /api/video/send`

Envia um vídeo para um grupo WhatsApp.

**Content-Type:** `multipart/form-data`

| Campo     | Tipo | Obrigatório | Descrição                   |
| --------- | ---- | ----------- | --------------------------- |
| `video`   | file | Sim         | Arquivo de vídeo (max 50MB) |
| `groupId` | text | Não\*       | JID do grupo (`xxx@g.us`)   |
| `caption` | text | Não         | Legenda do vídeo            |

> \*Se `groupId` não for enviado, usa o valor de `WPP_GROUP_ID`.

**Exemplo com curl:**

```bash
curl -X POST http://localhost:3000/api/video/send \
  -F "video=@./meu-video.mp4" \
  -F "groupId=120363012345678901@g.us" \
  -F "caption=Olha esse vídeo!"
```

**Resposta (200):**

```json
{
  "success": true,
  "messageId": "ABCD1234",
  "groupId": "120363012345678901@g.us",
  "caption": "Olha esse vídeo!",
  "fileName": "meu-video.mp4",
  "size": 1048576
}
```

### `GET /health`

Health check simples.

## Como Adicionar Novas Rotas

1. Crie `src/routes/novaRota.js` com o Router
2. Crie `src/controllers/novoController.js` com a lógica
3. Registre em `src/routes/index.js`:
   ```js
   router.use("/nova-rota", require("./novaRota"));
   ```

## Notas

- O **Baileys** se conecta via WebSocket direto, sem precisar de navegador — muito mais leve que wa-automate.
- A sessão é mantida em `/tmp/baileys_auth` localmente.
- O QR Code só aparece localmente (`NODE_ENV=development`).
