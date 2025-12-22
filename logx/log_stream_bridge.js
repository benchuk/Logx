const net = require('net');
const WebSocket = require('ws');

// Configuration
const TCP_PORT = 9020;
const WS_PORT = 9021;

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', ws => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => console.log('Client disconnected from WebSocket'));
});

// Broadcast function
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// TCP Server
const server = net.createServer(socket => {
    console.log('Log source connected via TCP');

    socket.on('data', data => {
        // Convert buffer to string and broadcast
        // We trim whitespace for cleaner logs, or send as is
        const message = data.toString();
        // console.log(`Received: ${message.length} bytes`); // Optional debug
        broadcast(message);
    });

    socket.on('end', () => {
        console.log('Log source disconnected');
    });

    socket.on('error', err => {
        console.log('TCP Socket error:', err.message);
    });
});

server.listen(TCP_PORT, () => {
    console.log(`TCP Bridge server listening on port ${TCP_PORT}`);
    console.log('Waiting for logs from run_server.sh...');
});

server.on('error', (err) => {
    console.error('TCP Server error:', err);
});
