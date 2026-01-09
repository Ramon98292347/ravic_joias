const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-characters';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const MAX_ATTEMPTS = parseInt(process.env.ADMIN_LOGIN_MAX_ATTEMPTS) || 5;
const BLOCK_TIME = parseInt(process.env.ADMIN_LOGIN_BLOCK_TIME) || 15; // minutes

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: BLOCK_TIME * 60 * 1000,
  max: MAX_ATTEMPTS,
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Login route
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, name, password, role, is_active, login_attempts, blocked_until')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    // Check if user is blocked
    if (user.blocked_until && new Date() < new Date(user.blocked_until)) {
      return res.status(423).json({ 
        error: 'Conta bloqueada. Tente novamente mais tarde.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      let blockedUntil = null;

      if (newAttempts >= MAX_ATTEMPTS) {
        blockedUntil = new Date(Date.now() + BLOCK_TIME * 60 * 1000);
      }

      await supabase
        .from('admin_users')
        .update({ 
          login_attempts: newAttempts,
          blocked_until: blockedUntil,
          last_login_attempt: new Date()
        })
        .eq('id', user.id);

      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Reset login attempts on successful login
    await supabase
      .from('admin_users')
      .update({ 
        login_attempts: 0,
        blocked_until: null,
        last_login: new Date()
      })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    };

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userData,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// Register validation
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').optional().isString(),
  body('role').optional().isString(),
];

// Register route for admin users
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }

    const { email, password, name = 'Administrador', role = 'admin' } = req.body;

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Cria usuário na autenticação (Supabase Auth)
    const { data: authCreated, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name }
    });

    if (authErr) {
      return res.status(500).json({ error: 'Erro ao criar usuário na autenticação', details: authErr.message });
    }

    const authUserId = authCreated?.user?.id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertPayload = {
      id: authUserId || undefined,
      email,
      password: hashedPassword,
      name,
      role,
      is_active: true,
      login_attempts: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data: created, error: insertError } = await supabase
      .from('admin_users')
      .insert([insertPayload])
      .select('id, email, name, role, is_active')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Erro ao criar usuário', details: insertError.message });
    }

    res.status(201).json({
      message: 'Administrador criado com sucesso',
      user: created,
      authUserId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Logout route (optional - client-side token removal is sufficient)
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // This route can be used for logging or additional cleanup
  res.json({ message: 'Logout realizado com sucesso' });
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, is_active, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    res.status(500).json({ error: 'Erro ao obter informações do usuário' });
  }
});

module.exports = router;
