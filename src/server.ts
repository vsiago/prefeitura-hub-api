import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import errorHandler from './middleware/error';

// Rotas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import groupRoutes from './routes/groups';
import chatRoutes from './routes/chats';
import eventRoutes from './routes/events';
import newsRoutes from './routes/news';
import fileRoutes from './routes/files';
import notificationRoutes from './routes/notifications';
import departmentRoutes from './routes/departments';
import adminRoutes from './routes/admin';
import quickAccessRoutes from './routes/quickAccess';

dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quick-access', quickAccessRoutes);

// Middleware de erro
app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  // Implementar lógica de chat e notificações em tempo real
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`);
});

// Lidar com rejeições de promessas não tratadas
process.on('unhandledRejection', (err: any) => {
  console.log(`Erro: ${err.message}`);
  httpServer.close(() => process.exit(1));
});