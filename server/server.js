const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 8080;

// Servidor HTTP
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      connections: wss.clients.size
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Servidor WebSocket
const wss = new WebSocket.Server({ server });

let clientIdCounter = 1;

wss.on('connection', (ws) => {
  const clientId = clientIdCounter++;
  console.log(`Cliente ${clientId} conectado`);

  // Mensaje de bienvenida al conectarse
  ws.send(JSON.stringify({
    type: 'system',
    message: `Bienvenido. Tu ID de cliente es ${clientId}`
  }));

  ws.on('message', (message) => {
    const textMessage = message.toString();
    console.log(`Mensaje de ${clientId}: ${textMessage}`);
    
    // Broadcast a todos los clientes conectados
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'chat',
          sender: `Cliente ${clientId}`,
          message: textMessage
        }));
      }
    });
  });

  ws.on('close', () => {
    console.log(`Cliente ${clientId} desconectado`);
    // Notifica cuando un cliente se desconecta
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'system',
          message: `Cliente ${clientId} se ha desconectado`
        }));
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Servidor HTTP/WebSocket escuchando en el puerto ${port}`);
});
