const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuración CORS para permitir conexiones desde Dashboard y Mobile
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:8081", "*"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Puerto del servidor de tiempo real
const PORT = process.env.PORT || 3001;

// Almacenar conexiones activas
let connectedClients = new Set();

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log(`🔗 Cliente conectado: ${socket.id}`);
  connectedClients.add(socket.id);
  
  // Enviar estado de conexión
  socket.emit('connection_status', { 
    status: 'connected', 
    clientId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
    connectedClients.delete(socket.id);
  });

  // Escuchar eventos específicos del cliente
  socket.on('join_room', (data) => {
    socket.join(data.room);
    console.log(`📍 Cliente ${socket.id} se unió a la sala: ${data.room}`);
  });
});

// Endpoint HTTP para recibir eventos del backend PHP
app.post('/emit-event', (req, res) => {
  try {
    const { eventType, data, room } = req.body;
    
    console.log(`📡 Evento recibido del backend: ${eventType}`, data);
    
    // Emitir evento a todos los clientes conectados o a una sala específica
    if (room) {
      io.to(room).emit(eventType, {
        ...data,
        timestamp: new Date().toISOString(),
        server: 'realtime-server'
      });
    } else {
      io.emit(eventType, {
        ...data,
        timestamp: new Date().toISOString(),
        server: 'realtime-server'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Evento ${eventType} emitido correctamente`,
      connectedClients: connectedClients.size
    });
    
  } catch (error) {
    console.error('❌ Error al emitir evento:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obtener estadísticas
app.get('/stats', (req, res) => {
  res.json({
    connectedClients: connectedClients.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor de tiempo real iniciado en puerto ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});