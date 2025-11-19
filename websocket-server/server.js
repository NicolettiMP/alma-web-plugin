const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado!');

  ws.on('message', (message) => {
    console.log(`Recebido: ${message}`);
    // Exemplo de resposta
    ws.send(`Servidor recebeu sua mensagem: ${message}`);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

console.log('Servidor WebSocket iniciado na porta 3000');
