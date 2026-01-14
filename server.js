const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const initSqlJs = require("sql.js");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Store active user sessions
const activeSessions = new Map();
const BASE_PORT = 7000;
const NOVNC_BASE_PORT = 8000;
const USER_DATA_DIR = "/home/bhuvanesh/Documents/docker/vnc_ubuntu/test_persistence/user_data";

// Ensure user data directory exists
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// ============= SQLite Database Setup =============
let db;
const dbPath = path.join(__dirname, "authgear.db");

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      loginTime TEXT NOT NULL,
      logoutTime TEXT,
      isActive INTEGER DEFAULT 1
    )
  `);

  saveDatabase();
  console.log("✅ SQLite Database initialized");
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

initDatabase();

// ============= Middleware =============
function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.decode(token);
    req.userId = decoded.sub;
    req.user = decoded;
    // Extract username from either 'username' or 'preferred_username' field
    req.username = decoded.username || decoded.preferred_username || decoded.sub;
    req.email = decoded.email || '';
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ============= Session Tracking Endpoints =============

// Record Login
app.post("/api/login", verifyAuth, (req, res) => {
  try {
    // Get username from token, fallback to request body
    const username = req.username || req.body.username;
    const email = req.email || req.body.email;
    const userId = req.userId;

    console.log(`Recording login for user: ${username} (${userId})`);

    // Close any previous active sessions
    db.run(
      `UPDATE user_sessions SET isActive = 0, logoutTime = ? WHERE userId = ? AND isActive = 1`,
      [new Date().toISOString(), userId]
    );

    // Create new session
    db.run(
      `INSERT INTO user_sessions (userId, username, email, loginTime, isActive) VALUES (?, ?, ?, ?, 1)`,
      [userId, username, email || '', new Date().toISOString()]
    );

    saveDatabase();

    res.json({ 
      success: true, 
      message: "Login recorded",
      username: username
    });
  } catch (error) {
    console.error("Login recording error:", error);
    res.status(500).json({ success: false, message: "Failed to record login" });
  }
});

// Record Logout
app.post("/api/logout", verifyAuth, (req, res) => {
  try {
    const userId = req.userId;

    console.log(`Recording logout for user: ${userId}`);

    db.run(
      `UPDATE user_sessions SET isActive = 0, logoutTime = ? WHERE userId = ? AND isActive = 1`,
      [new Date().toISOString(), userId]
    );

    saveDatabase();

    res.json({ success: true, message: "Logout recorded" });
  } catch (error) {
    console.error("Logout recording error:", error);
    res.status(500).json({ success: false, message: "Failed to record logout" });
  }
});

// Get User Sessions History
app.get("/api/sessions", verifyAuth, (req, res) => {
  try {
    const userId = req.userId;
    
    const stmt = db.prepare(`SELECT * FROM user_sessions WHERE userId = ? ORDER BY loginTime DESC LIMIT 10`);
    stmt.bind([userId]);
    
    const sessions = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      sessions.push({
        _id: row.id,
        userId: row.userId,
        username: row.username,
        email: row.email,
        loginTime: row.loginTime,
        logoutTime: row.logoutTime,
        isActive: row.isActive === 1
      });
    }
    stmt.free();

    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
});

// ============= Container Management Endpoints =============

function findAvailablePort(userId) {
  const hash = crypto.createHash("md5").update(userId).digest("hex");
  const portOffset = parseInt(hash.substring(0, 4), 16) % 1000;
  return {
    vncPort: BASE_PORT + portOffset,
    novncPort: NOVNC_BASE_PORT + portOffset,
  };
}

app.post("/start-container", verifyAuth, async (req, res) => {
  const userId = req.userId;
  const os = req.query.os || "ubuntu";

  console.log(`User ${userId} requesting ${os} container`);

  const sessionKey = `${userId}_${os}`;
  
  if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    
    exec(`docker inspect -f '{{.State.Running}}' ${session.containerName}`, (error, stdout) => {
      if (stdout.trim() === "true") {
        console.log(`User ${userId} already has active ${os} container`);
        return res.json({
          success: true,
          url: session.url,
          userId: userId,
          containerName: session.containerName,
          vncPort: session.vncPort,
          novncPort: session.novncPort,
          os: session.os,
          startedAt: session.startedAt,
          message: "Reconnecting to existing session",
        });
      } else {
        activeSessions.delete(sessionKey);
        startNewContainer();
      }
    });
  } else {
    startNewContainer();
  }

  function startNewContainer() {
    const { vncPort, novncPort } = findAvailablePort(userId + os);
    const containerName = `vnc_${os}_${userId.substring(0, 8)}`;
    const userDataPath = path.join(USER_DATA_DIR, userId, os);

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
      console.log(`Created user data directory: ${userDataPath}`);
    }

    let cmd = "";
    let url = "";

    if (os === "parrot") {
      cmd = `
        docker rm -f ${containerName} 2>/dev/null || true &&
        docker run -d \
          -p ${vncPort}:5901 \
          -p ${novncPort}:6080 \
          --name ${containerName} \
          -v ${userDataPath}:/root/Desktop/student \
          -e RESOLUTION=1400x600 \
          vnc_parrot
      `;
      url = `http://localhost:${novncPort}/vnc.html?autoconnect=true&resize=scale`;

    } else if (os === "kali") {
      cmd = `
        docker rm -f ${containerName} 2>/dev/null || true &&
        docker run -d \
          -p ${vncPort}:5901 \
          -p ${novncPort}:6080 \
          --name ${containerName} \
          -v ${userDataPath}:/root/Desktop/student \
          -e RESOLUTION=1400x600 \
          vnc_kali
      `;
      url = `http://localhost:${novncPort}/vnc.html?autoconnect=true&resize=scale`;

    } else {
      return res.status(400).json({ success: false, message: "Invalid OS specified" });
    }

    console.log(`Starting container ${containerName} on ports ${vncPort}/${novncPort}...`);
    
    exec(cmd, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      if (stderr) console.error("STDERR:", stderr);

      if (error) {
        return res.status(500).json({
          success: false,
          message: `Failed to start ${os} container`,
          error: stderr,
        });
      }

      let attempts = 0;
      const maxAttempts = 30;
      
      const checkContainer = setInterval(() => {
        exec(`docker logs ${containerName} 2>&1 | grep -i "listening\\|ready\\|started"`, (err, out) => {
          attempts++;
          
          if (out && out.length > 0) {
            clearInterval(checkContainer);
            
            const session = {
              userId,
              containerName,
              os,
              vncPort,
              novncPort,
              url,
              userDataPath,
              startedAt: new Date(),
            };
            
            activeSessions.set(sessionKey, session);

            res.json({
              success: true,
              url,
              userId,
              containerName,
              vncPort,
              novncPort,
              os,
              startedAt: session.startedAt,
              message: "Container started successfully",
            });
          } else if (attempts >= maxAttempts) {
            clearInterval(checkContainer);
            
            const session = {
              userId,
              containerName,
              os,
              vncPort,
              novncPort,
              url,
              userDataPath,
              startedAt: new Date(),
            };
            
            activeSessions.set(sessionKey, session);

            res.json({
              success: true,
              url,
              userId,
              containerName,
              vncPort,
              novncPort,
              os,
              startedAt: session.startedAt,
              message: "Container started (may still be initializing)",
            });
          }
        });
      }, 1000);
    });
  }
});

app.post("/stop-container", verifyAuth, (req, res) => {
  const userId = req.userId;
  const os = req.query.os || req.body.os;
  const sessionKey = `${userId}_${os}`;

  if (!activeSessions.has(sessionKey)) {
    return res.status(404).json({ success: false, message: "No active session found" });
  }

  const session = activeSessions.get(sessionKey);
  const cmd = `docker stop ${session.containerName} && docker rm ${session.containerName}`;

  console.log(`Stopping container ${session.containerName}...`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to stop container",
        error: stderr,
      });
    }

    activeSessions.delete(sessionKey);
    res.json({ success: true, message: "Container stopped successfully" });
  });
});

app.get("/session-info", verifyAuth, (req, res) => {
  const userId = req.userId;

  const userSessions = [];
  activeSessions.forEach((session, key) => {
    if (session.userId === userId) {
      userSessions.push({
        os: session.os,
        url: session.url,
        containerName: session.containerName,
        vncPort: session.vncPort,
        novncPort: session.novncPort,
        startedAt: session.startedAt,
      });
    }
  });

  res.json({
    success: true,
    sessions: userSessions,
    hasSession: userSessions.length > 0,
  });
});

app.get("/admin/sessions", (req, res) => {
  const sessions = Array.from(activeSessions.values()).map((s) => ({
    userId: s.userId.substring(0, 8) + "...",
    containerName: s.containerName,
    os: s.os,
    ports: { vnc: s.vncPort, novnc: s.novncPort },
    startedAt: s.startedAt,
  }));

  res.json({ success: true, activeSessions: sessions.length, sessions });
});

app.post("/admin/cleanup", (req, res) => {
  const promises = [];

  activeSessions.forEach((session, sessionKey) => {
    promises.push(
      new Promise((resolve) => {
        exec(`docker inspect -f '{{.State.Running}}' ${session.containerName}`, (error, stdout) => {
          if (error || stdout.trim() !== "true") {
            console.log(`Removing dead session for ${sessionKey}`);
            activeSessions.delete(sessionKey);
          }
          resolve();
        });
      })
    );
  });

  Promise.all(promises).then(() => {
    res.json({ success: true, message: "Cleanup completed", activeSessions: activeSessions.size });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-user VNC server running at http://localhost:${PORT}`);
  console.log(`📁 User data stored in: ${USER_DATA_DIR}`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
});
