const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, name.trim(), cleanEmail, password_hash]
    );

    const token = jwt.sign({ id: userId, email: cleanEmail, name: name.trim() }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail
      }
    });
  } catch (err) {
    console.error('[AuthController.register] Error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('[AuthController.login] Error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const me = async (req, res) => {
  try {
    const userRes = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const datasetCountRes = await query('SELECT COUNT(*) as count FROM datasets WHERE user_id = $1', [req.user.id]);
    const datasetCount = parseInt(datasetCountRes.rows[0]?.count || 0, 10);

    res.json({
      user: userRes.rows[0],
      datasetCount
    });
  } catch (err) {
    console.error('[AuthController.me] Error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await query(`
      SELECT u.id, u.name, u.email, u.created_at, COUNT(d.id) AS dataset_count
      FROM users u
      LEFT JOIN datasets d ON d.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json({ users: users.rows });
  } catch (err) {
    console.error('[AuthController.listUsers] Error:', err);
    res.status(500).json({ error: 'Failed to fetch registered users list.' });
  }
};

module.exports = {
  register,
  login,
  me,
  listUsers
};
