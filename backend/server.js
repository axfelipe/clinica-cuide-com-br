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

// Sistema de código temporário para recuperação de senha
const temporaryCodes = new Map();

// Gerar código temporário
function generateTemporaryCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CLINICA';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // código expira em 10 minutos
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  temporaryCodes.set(code, { expiresAt, used: false });
  
  // Limpar códigos expirados a cada hora
  setTimeout(() => {
    temporaryCodes.forEach((value, key) => {
      if (new Date() > value.expiresAt) {
        temporaryCodes.delete(key);
      }
    });
  }, 60 * 60 * 1000);
  
  return code;
}

// Rota para gerar código temporário (apenas admin)
app.post('/api/auth/generate-temp-code', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { username } = req.body;
    
    // Verificar se usuário existe
    const users = {
      'admin': { nome: 'Administrador', tipo: 'admin' },
      'atendente1': { nome: 'Atendente 1', tipo: 'atendente', guiche_id: 1 },
      'atendente2': { nome: 'Atendente 2', tipo: 'atendente', guiche_id: 2 },
      'atendente3': { nome: 'Atendente 3', tipo: 'atendente', guiche_id: 3 },
      'atendente4': { nome: 'Atendente 4', tipo: 'atendente', guiche_id: 4 },
      'atendente5': { nome: 'Atendente 5', tipo: 'atendente', guiche_id: 5 }
    };

    if (!users[username]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const code = generateTemporaryCode();
    
    res.json({
      success: true,
      code,
      expiresIn: '10 minutos',
      user: users[username]
    });

  } catch (error) {
    console.error('Erro ao gerar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para login com código temporário
app.post('/api/auth/login-with-code', async (req, res) => {
  try {
    const { username, code } = req.body;

    // Verificar se código é válido
    const codeData = temporaryCodes.get(code);
    if (!codeData) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    if (codeData.used) {
      return res.status(400).json({ error: 'Código já utilizado' });
    }

    if (new Date() > codeData.expiresAt) {
      temporaryCodes.delete(code);
      return res.status(400).json({ error: 'Código expirado' });
    }

    // Verificar usuário
    const users = {
      'admin': { nome: 'Administrador', tipo: 'admin' },
      'atendente1': { nome: 'Atendente 1', tipo: 'atendente', guiche_id: 1 },
      'atendente2': { nome: 'Atendente 2', tipo: 'atendente', guiche_id: 2 },
      'atendente3': { nome: 'Atendente 3', tipo: 'atendente', guiche_id: 3 },
      'atendente4': { nome: 'Atendente 4', tipo: 'atendente', guiche_id: 4 },
      'atendente5': { nome: 'Atendente 5', tipo: 'atendente', guiche_id: 5 }
    };

    if (!users[username]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[username];

    // Marcar código como usado
    temporaryCodes.set(code, { ...codeData, used: true });

    // Gerar token
    const token = jwt.sign(
      { 
        username: username,
        tipo: user.tipo,
        guiche_id: user.guiche_id,
        tempLogin: true // Marcar como login temporário
      },
      process.env.JWT_SECRET || 'clinica-secret',
      { expiresIn: '1h' } // Token mais curto para login temporário
    );

    res.json({
      success: true,
      token,
      user: {
        username: username,
        nome: user.nome,
        tipo: user.tipo,
        guiche_id: user.guiche_id,
        tempLogin: true
      },
      message: '⚠️ Login temporário - Redefina sua senha'
    });

  } catch (error) {
    console.error('Erro no login com código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para redefinir senha após login temporário
app.post('/api/auth/reset-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Aqui em produção, você salvaria a nova senha no banco
    // Por enquanto, apenas confirmamos que a senha foi redefinida

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Cuide.com.br rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});