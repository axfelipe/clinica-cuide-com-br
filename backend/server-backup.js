import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Database connection - SIMPLIFICADO PARA COMEÇAR
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost/clinica',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Rota simples de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 Backend Cuide.com.br funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de login simplificada para teste
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Usuários fixos para teste
    const users = {
      'admin': { password: 'admin123', nome: 'Administrador', tipo: 'admin' },
      'atendente1': { password: '123456', nome: 'Atendente 1', tipo: 'atendente', guiche_id: 1 },
      'atendente2': { password: '123456', nome: 'Atendente 2', tipo: 'atendente', guiche_id: 2 },
      'atendente3': { password: '123456', nome: 'Atendente 3', tipo: 'atendente', guiche_id: 3 },
      'atendente4': { password: '123456', nome: 'Atendente 4', tipo: 'atendente', guiche_id: 4 },
      'atendente5': { password: '123456', nome: 'Atendente 5', tipo: 'atendente', guiche_id: 5 }
    };

    const user = users[username];
    
    if (user && user.password === password) {
      const token = jwt.sign(
        { 
          username: username,
          tipo: user.tipo,
          guiche_id: user.guiche_id 
        },
        process.env.JWT_SECRET || 'clinica-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          username: username,
          nome: user.nome,
          tipo: user.tipo,
          guiche_id: user.guiche_id
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Usuário ou senha inválidos' 
      });
    }

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Cuide.com.br rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});