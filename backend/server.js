require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();


// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERREUR : JWT_SECRET est manquant dans le fichier .env');
  process.exit(1);
}


// ============================================
// CONNEXION POSTGRESQL
// ============================================

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});


// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: 'http://localhost:4200'
}));
app.use(express.json());


// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend opérationnel'
  });
});


// ============================================
// AUTHENTIFICATION
// ============================================

// --------------------------------------------
// INSCRIPTION
// --------------------------------------------

app.post('/api/auth/register', async (req, res) => {

  try {

    const { username, password } = req.body;

    // Vérification du username
    if (
      typeof username !== 'string' ||
      username.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Le nom utilisateur est obligatoire'
      });
    }

    // Vérification du password
    if (
      typeof password !== 'string' ||
      password.length < 4
    ) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 4 caractères'
      });
    }

    const cleanUsername = username.trim();

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [cleanUsername]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Utilisateur déjà existant'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const result = await pool.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING id, username`,
      [
        cleanUsername,
        hashedPassword
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erreur serveur'
    });

  }

});


// --------------------------------------------
// CONNEXION
// --------------------------------------------

app.post('/api/auth/login', async (req, res) => {

  try {

    const { username, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Username et password sont obligatoires'
      });
    }

    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0) {

      return res.status(401).json({
        message: 'Identifiants incorrects'
      });

    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {

      return res.status(401).json({
        message: 'Identifiants incorrects'
      });

    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );

    res.json({
      token: token,
      username: user.username
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erreur serveur'
    });

  }

});


// ============================================
// MIDDLEWARE JWT
// ============================================

function authenticateToken(req, res, next) {

  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.split(' ')[1];

  if (!token) {

    return res.status(401).json({
      message: 'Token manquant'
    });

  }

  try {

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(403).json({
      message: 'Token invalide ou expiré'
    });

  }

}


// ============================================
// TÂCHES
// ============================================

// --------------------------------------------
// GET : récupérer les tâches
// --------------------------------------------

app.get(
  '/api/tasks',
  authenticateToken,
  async (req, res) => {

    try {

      const result = await pool.query(
        `SELECT id, title, completed
         FROM tasks
         WHERE user_id = $1
         ORDER BY id`,
        [req.user.userId]
      );

      res.json(result.rows);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: 'Erreur serveur'
      });

    }

  }
);


// --------------------------------------------
// POST : créer une tâche
// --------------------------------------------

app.post(
  '/api/tasks',
  authenticateToken,
  async (req, res) => {

    try {

      const { title } = req.body;

      if (
        typeof title !== 'string' ||
        title.trim() === ''
      ) {

        return res.status(400).json({
          message: 'Le titre de la tâche est obligatoire'
        });

      }

      const cleanTitle = title.trim();

      const result = await pool.query(
        `INSERT INTO tasks
         (title, completed, user_id)
         VALUES ($1, false, $2)
         RETURNING id, title, completed`,
        [
          cleanTitle,
          req.user.userId
        ]
      );

      res.status(201).json(result.rows[0]);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: 'Erreur serveur'
      });

    }

  }
);


// --------------------------------------------
// PUT : modifier une tâche
// --------------------------------------------

app.put(
  '/api/tasks/:id',
  authenticateToken,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      const { title, completed } = req.body;

      // Vérification de l'identifiant
      if (!Number.isInteger(id) || id <= 0) {

        return res.status(400).json({
          message: 'Identifiant de tâche invalide'
        });

      }

      // Vérification du titre
      if (
        typeof title !== 'string' ||
        title.trim() === ''
      ) {

        return res.status(400).json({
          message: 'Le titre de la tâche est obligatoire'
        });

      }

      // Vérification de completed
      if (typeof completed !== 'boolean') {

        return res.status(400).json({
          message: 'Le champ completed doit être un booléen'
        });

      }

      const result = await pool.query(
        `UPDATE tasks
         SET title = $1,
             completed = $2
         WHERE id = $3
         AND user_id = $4
         RETURNING id, title, completed`,
        [
          title.trim(),
          completed,
          id,
          req.user.userId
        ]
      );

      if (result.rows.length === 0) {

        return res.status(404).json({
          message: 'Tâche introuvable'
        });

      }

      res.json(result.rows[0]);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: 'Erreur serveur'
      });

    }

  }
);


// --------------------------------------------
// DELETE : supprimer une tâche
// --------------------------------------------

app.delete(
  '/api/tasks/:id',
  authenticateToken,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {

        return res.status(400).json({
          message: 'Identifiant de tâche invalide'
        });

      }

      const result = await pool.query(
        `DELETE FROM tasks
         WHERE id = $1
         AND user_id = $2
         RETURNING id`,
        [
          id,
          req.user.userId
        ]
      );

      if (result.rows.length === 0) {

        return res.status(404).json({
          message: 'Tâche introuvable'
        });

      }

      res.status(204).send();

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: 'Erreur serveur'
      });

    }

  }
);


// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

app.listen(PORT, () => {

  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  );

});