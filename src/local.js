// Servidor local para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = require('./app');
const config = require('./config');

app.listen(config.app.port, () => {
  console.log(`[wpp-api] Rodando em http://localhost:${config.app.port}`);
  console.log(`[wpp-api] Env: ${config.app.nodeEnv}`);
});
