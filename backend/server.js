require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// --- DATABASE CONNECTION ---
const dbPath = process.env.DATABASE_URL.replace('sqlite:', '');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite DB:', err.message);
    process.exit(1);
  }
});

// --- LOGGER ---
const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

const upload = multer({ dest: 'uploads/' });

// --- ROOT ENDPOINT ---
app.get('/', (req, res) => {
  res.send('HelloTalk backend is running!');
});

// --- AUTHENTICATION & ADMIN MIDDLEWARE ---
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
}
function requireAdmin(req, res, next) {
  db.get('SELECT is_admin FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err || !row || !row.is_admin) return res.status(403).json({ message: 'Admin only' });
    next();
  });
}

// --- USER AUTH ROUTES ---

// Registration (Invite-only)
app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('username').notEmpty(),
  body('inviteCode').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, username, inviteCode, native_language, learning_language } = req.body;
  db.get('SELECT * FROM invites WHERE code = ? AND used = 0', [inviteCode], async (err, invite) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!invite) return res.status(400).send({ message: 'Invalid invite' });
    db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (row.count >= 50) return res.status(400).send({ message: 'User limit reached' });
      const hash = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (email, password_hash, username, native_language, learning_language) VALUES (?, ?, ?, ?, ?)',
        [email, hash, username, native_language, learning_language], function (err) {
          if (err) return res.status(400).send({ message: 'Email exists' });
          db.run('UPDATE invites SET used = 1 WHERE code = ?', [inviteCode]);
          res.status(201).send({ message: 'Registered' });
        });
    });
  });
});

// Login
app.post('/api/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).send({ message: 'DB error' });
    if (!user) return res.status(401).send({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).send({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.send({ token, userId: user.id });
  });
});

// Get current user info
app.get('/api/me', authenticate, (req, res) => {
    console.log("Decoded user from JWT:", req.user); 
  db.get('SELECT id, email, username, is_admin as isAdmin FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  });
});

// Invite code generation (admin only)
app.post('/api/invites', authenticate, requireAdmin, (req, res) => {
  const code = Math.random().toString(36).substr(2, 8);
  db.run('INSERT INTO invites (code) VALUES (?)', [code], function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.send({ code });
  });
});

// --- CHAT ROUTES ---

// Real-time chat (Socket.IO)
io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId));
  socket.on('send_message', (data) => {
    db.run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [data.senderId, data.receiverId, data.content]);
    io.to(data.receiverId).emit('receive_message', data);
  });
});

// --- ADD THIS: GET CHAT HISTORY ---
app.get('/api/messages', authenticate, (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ message: 'Missing user IDs' });
  db.all(
    `SELECT * FROM messages WHERE 
      (sender_id = ? AND receiver_id = ?) OR 
      (sender_id = ? AND receiver_id = ?) 
      ORDER BY created_at ASC`,
    [user1, user2, user2, user1],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }

  );
});

app.get('/api/me', authenticate, (req, res) => {
    console.log('Decoded JWT user ID:', req.user.id);  // 🔍 ADD THIS
  
    db.get('SELECT id, email, username, is_admin as isAdmin FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (!user) {
        console.warn('User not found with ID:', req.user.id); // 🔍 ADD THIS
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    });
  });






// --- MOMENTS (SOCIAL FEED) ---

app.post('/api/moments', upload.single('media'), (req, res) => {
  const { user_id, content } = req.body;
  const media_url = req.file ? req.file.path : null;
  db.run('INSERT INTO moments (user_id, content, media_url) VALUES (?, ?, ?)', [user_id, content, media_url]);
  res.status(201).send({ message: 'Moment posted' });
});

// --- TRANSLATION (STUB) ---
app.post('/api/translate', [
  body('text').notEmpty(),
  body('target').notEmpty()
], (req, res) => {
  res.send({ translatedText: 'Translated text here' });
});

// --- MODERATION/REPORTING ---
app.post('/api/report', [
  body('reporter_id').notEmpty(),
  body('reported_user_id').notEmpty(),
  body('reason').notEmpty()
], (req, res) => {
  const { reporter_id, reported_user_id, reason } = req.body;
  db.run('INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES (?, ?, ?)', [reporter_id, reported_user_id, reason]);
  res.status(201).send({ message: 'Reported' });
});

// --- VOICE ROOMS & EMAIL NOTIFICATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'your_email@gmail.com', pass: 'your_email_password' }
});

function notifyAllUsersAboutRoom(title, roomId) {
  db.all('SELECT email FROM users', [], (err, rows) => {
    if (err) return;
    const emails = rows.map(r => r.email);
    const mailOptions = {
      from: 'your_email@gmail.com',
      to: emails.join(','),
      subject: `New Voice Room: ${title}`,
      text: `A new voice room "${title}" has been created. Join here: http://localhost:5002/voice-room/${roomId}`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error(error);
    });
  });
}

app.post('/api/voice-rooms',
  authenticate, requireAdmin,
  [
    body('title').isLength({ min: 3 }),
    body('description').optional().isString()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description } = req.body;
    db.run(
      'INSERT INTO voice_rooms (title, description, admin_id) VALUES (?, ?, ?)',
      [title, description, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: 'DB error' });
        notifyAllUsersAboutRoom(title, this.lastID);
        res.status(201).json({ roomId: this.lastID });
      }
    );
  }
);

app.get('/api/voice-rooms', authenticate, (req, res) => {
  db.all('SELECT * FROM voice_rooms WHERE is_active = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/voice-rooms/:roomId/join', authenticate, (req, res) => {
  const { roomId } = req.params;
  db.run(
    'INSERT INTO voice_room_participants (room_id, user_id, role) VALUES (?, ?, ?)',
    [roomId, req.user.id, 'audience'],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.status(201).json({ success: true });
    }
  );
});

app.post('/api/voice-rooms/:roomId/request-stage', authenticate, (req, res) => {
  const { roomId } = req.params;
  db.run(
    'INSERT INTO stage_requests (room_id, user_id) VALUES (?, ?)',
    [roomId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      io.to(`voice-room-${roomId}`).emit('stage-request', { userId: req.user.id });
      res.status(201).json({ success: true });
    }
  );
});

app.post('/api/voice-rooms/:roomId/approve-request', authenticate, requireAdmin, (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  db.run(
    'UPDATE stage_requests SET status = "approved" WHERE room_id = ? AND user_id = ?',
    [roomId, userId],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      db.run(
        'UPDATE voice_room_participants SET role = "stage" WHERE room_id = ? AND user_id = ?',
        [roomId, userId],
        () => {
          io.to(`voice-room-${roomId}`).emit('stage-approved', { userId });
          res.status(200).json({ success: true });
        }
      );
    }
  );
});

app.post('/api/voice-rooms/:roomId/comment', authenticate, [
  body('comment').isLength({ min: 1 })
], (req, res) => {
  const { roomId } = req.params;
  const { comment } = req.body;
  db.run(
    'INSERT INTO voice_room_comments (room_id, user_id, comment) VALUES (?, ?, ?)',
    [roomId, req.user.id, comment],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      io.to(`voice-room-${roomId}`).emit('new-comment', {
        userId: req.user.id,
        comment,
        created_at: new Date().toISOString()
      });
      res.status(201).json({ success: true });
    }
  );
});

// --- SOCKET.IO VOICE ROOM SIGNALING ---
const activeVoiceRooms = {};

io.on('connection', (socket) => {
  // Join a voice room
  socket.on('join-voice-room', ({ roomId, userId, role }) => {
    socket.join(`voice-room-${roomId}`);
    if (!activeVoiceRooms[roomId]) activeVoiceRooms[roomId] = { stage: [], audience: [] };
    if (role === 'stage' && activeVoiceRooms[roomId].stage.length < 8) {
      activeVoiceRooms[roomId].stage.push(userId);
    } else if (!activeVoiceRooms[roomId].audience.includes(userId)) {
      activeVoiceRooms[roomId].audience.push(userId);
    }
    io.to(`voice-room-${roomId}`).emit('room-update', activeVoiceRooms[roomId]);
  });

  // WebRTC signaling relay
  socket.on('signal', ({ roomId, signal, toUserId, fromUserId }) => {
    socket.to(`voice-room-${roomId}`).emit('signal', { signal, toUserId, fromUserId });
  });

  // Handle stage requests and admin approvals
  socket.on('stage-request', ({ roomId, userId }) => {
    io.to(`voice-room-${roomId}`).emit('stage-request', { userId });
  });
  socket.on('approve-stage', ({ roomId, userId }) => {
    if (activeVoiceRooms[roomId].stage.length < 8) {
      activeVoiceRooms[roomId].stage.push(userId);
      activeVoiceRooms[roomId].audience = activeVoiceRooms[roomId].audience.filter(id => id !== userId);
      io.to(`voice-room-${roomId}`).emit('room-update', activeVoiceRooms[roomId]);
    }
  });

  // Leaving stage or room
  socket.on('leave-stage', ({ roomId, userId }) => {
    activeVoiceRooms[roomId].stage = activeVoiceRooms[roomId].stage.filter(id => id !== userId);
    if (!activeVoiceRooms[roomId].audience.includes(userId)) {
      activeVoiceRooms[roomId].audience.push(userId);
    }
    io.to(`voice-room-${roomId}`).emit('room-update', activeVoiceRooms[roomId]);
  });

  // Add disconnect cleanup as needed
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
