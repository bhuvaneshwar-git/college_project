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

// FIXED CORS CONFIGURATION - Allow all localhost ports for VNC
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost and 127.0.0.1 ports
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Explicitly allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Store active user sessions
const activeSessions = new Map();
const BASE_PORT = 7000;
const NOVNC_BASE_PORT = 8000;

// WINDOWS PATH - Update this to your Windows path
const USER_DATA_DIR = "C:\\Users\\ganes\\Downloads\\college_project-main (2)\\college_project-main\\persistence_storage";

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
    console.log('❌ No auth header or invalid format');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  
  if (!token || token === 'null' || token === 'undefined') {
    console.log('❌ Token is missing or invalid');
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  
  try {
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      console.log('❌ Token could not be decoded');
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }
    
    console.log('✅ Token decoded successfully:', decoded.sub);
    req.userId = decoded.sub;
    req.user = decoded;
    req.username = decoded.username || decoded.preferred_username || decoded.sub;
    req.email = decoded.email || '';
    next();
  } catch (error) {
    console.error('❌ Token decode error:', error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ============= Session Tracking Endpoints =============

// Record Login - WITH DUPLICATE PREVENTION
app.post("/api/login", verifyAuth, (req, res) => {
  try {
    const username = req.username || req.body.username;
    const email = req.email || req.body.email;
    const userId = req.userId;

    console.log(`Recording login for user: ${username} (${userId})`);

    // CHECK FOR RECENT LOGIN (within last 5 minutes)
    const stmt = db.prepare(
      `SELECT loginTime FROM user_sessions 
       WHERE userId = ? AND isActive = 1 
       ORDER BY loginTime DESC LIMIT 1`
    );
    stmt.bind([userId]);
    
    if (stmt.step()) {
      const lastLogin = stmt.getAsObject();
      const lastLoginTime = new Date(lastLogin.loginTime);
      const now = new Date();
      const minutesSinceLastLogin = (now - lastLoginTime) / (1000 * 60);
      
      if (minutesSinceLastLogin < 5) {
        stmt.free();
        console.log(`⚠️ Duplicate login prevented (${minutesSinceLastLogin.toFixed(1)} min since last login)`);
        return res.json({ 
          success: true, 
          message: "Already logged in",
          username: username
        });
      }
    }
    stmt.free();

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

// UPDATED: Start Container with Unpause Support
app.post("/start-container", verifyAuth, async (req, res) => {
  const userId = req.userId;
  const os = req.query.os || "ubuntu";

  // EXTRACT AUTH TOKEN FROM REQUEST HEADER
  const authHeader = req.headers.authorization;
  const authToken = authHeader ? authHeader.substring(7) : '';

  console.log(`✅ User ${userId} requesting ${os} container`);
  console.log(`🔑 Auth token present: ${authToken ? 'Yes' : 'No'}`);

  const sessionKey = `${userId}_${os}`;
  
  // Check if user already has a session
  if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    
    // WINDOWS: Use double quotes for docker inspect
    exec(`docker inspect -f "{{.State.Status}}" ${session.containerName}`, (error, stdout) => {
      if (error) {
        console.log(`Container ${session.containerName} not found, creating new one`);
        activeSessions.delete(sessionKey);
        startNewContainer();
        return;
      }

      const status = stdout.trim();
      console.log(`Container ${session.containerName} status: ${status}`);
      
      if (status === "paused") {
        // UNPAUSE - Resume exactly where user left off!
        console.log(`🔄 Unpausing container ${session.containerName}...`);
        exec(`docker unpause ${session.containerName}`, (err, out) => {
          if (err) {
            console.error(`Failed to unpause: ${err}`);
            return res.status(500).json({
              success: false,
              message: "Failed to resume container",
              error: err.message
            });
          }
          
          session.paused = false;
          delete session.pausedAt;
          session.resumedAt = new Date();
          
          console.log(`✅ Container unpaused successfully`);
          
          const urlWithToken = `${session.url}&token=${authToken}&os=${os}`;
          
          return res.json({
            success: true,
            url: urlWithToken,
            userId: userId,
            containerName: session.containerName,
            vncPort: session.vncPort,
            novncPort: session.novncPort,
            os: session.os,
            startedAt: session.startedAt,
            resumedAt: session.resumedAt,
            message: "Resumed from paused state - your session is exactly as you left it!",
          });
        });
      } else if (status === "running") {
        console.log(`User ${userId} already has active ${os} container`);
        
        const urlWithToken = `${session.url}&token=${authToken}&os=${os}`;
        
        return res.json({
          success: true,
          url: urlWithToken,
          userId: userId,
          containerName: session.containerName,
          vncPort: session.vncPort,
          novncPort: session.novncPort,
          os: session.os,
          startedAt: session.startedAt,
          message: "Reconnecting to existing session",
        });
      } else if (status === "exited") {
        console.log(`🔄 Restarting stopped container ${session.containerName}...`);
        exec(`docker start ${session.containerName}`, (err, out) => {
          if (err) {
            console.error(`Failed to restart: ${err}`);
            activeSessions.delete(sessionKey);
            startNewContainer();
            return;
          }
          
          session.restartedAt = new Date();
          console.log(`✅ Container restarted successfully`);
          
          const urlWithToken = `${session.url}&token=${authToken}&os=${os}`;
          
          return res.json({
            success: true,
            url: urlWithToken,
            userId: userId,
            containerName: session.containerName,
            vncPort: session.vncPort,
            novncPort: session.novncPort,
            os: session.os,
            startedAt: session.startedAt,
            restartedAt: session.restartedAt,
            message: "Container restarted - reconnecting...",
          });
        });
      } else {
        console.log(`Unknown container status: ${status}, creating new one`);
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

    // WINDOWS: Use & instead of && and double quotes for paths, 2>nul instead of 2>/dev/null
    if (os === "parrot") {
      cmd = `docker rm -f ${containerName} 2>nul & docker run -d -p ${vncPort}:5901 -p ${novncPort}:6080 --name ${containerName} --memory=4g --memory-swap=4g --cpus=2 --cpu-shares=1024 --pids-limit=512 -v "${userDataPath}:/root/Desktop/student" -e RESOLUTION=1400x600 vnc_parrot`;
      url = `http://localhost:${novncPort}/vnc.html?autoconnect=true&resize=scale&token=${authToken}&os=${os}`;

    } else if (os === "kali") {
      cmd = `docker rm -f ${containerName} 2>nul & docker run -d -p ${vncPort}:5901 -p ${novncPort}:6080 --name ${containerName} --memory=4g --memory-swap=4g --cpus=2 --cpu-shares=1024 --pids-limit=512 -v "${userDataPath}:/root/Desktop/student" -e RESOLUTION=1400x600 vnc_kali`;
      url = `http://localhost:${novncPort}/vnc.html?autoconnect=true&resize=scale&token=${authToken}&os=${os}`;

    } else {
      return res.status(400).json({ success: false, message: "Invalid OS specified" });
    }

    console.log(`🚀 Starting new container ${containerName} on ports ${vncPort}/${novncPort}...`);
    
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
        // WINDOWS: Use findstr instead of grep
        exec(`docker logs ${containerName} 2>&1 | findstr /I "listening ready started"`, (err, out) => {
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
              paused: false,
            };
            
            activeSessions.set(sessionKey, session);
            console.log(`✅ Container ${containerName} started successfully`);

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
              paused: false,
            };
            
            activeSessions.set(sessionKey, session);
            console.log(`⚠️ Container ${containerName} started but may still be initializing`);

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

// NEW: Pause Container
app.post("/pause-container", verifyAuth, (req, res) => {
  const userId = req.userId;
  const os = req.query.os || req.body.os;
  const sessionKey = `${userId}_${os}`;

  if (!activeSessions.has(sessionKey)) {
    return res.status(404).json({ success: false, message: "No active session found" });
  }

  const session = activeSessions.get(sessionKey);
  
  if (session.paused) {
    return res.json({ 
      success: true, 
      message: "Container is already paused",
      pausedAt: session.pausedAt
    });
  }

  const cmd = `docker pause ${session.containerName}`;

  console.log(`⏸️ Pausing container ${session.containerName}...`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Failed to pause container: ${stderr}`);
      return res.status(500).json({
        success: false,
        message: "Failed to pause container",
        error: stderr,
      });
    }

    session.paused = true;
    session.pausedAt = new Date();
    
    console.log(`✅ Container ${session.containerName} paused successfully`);
    
    res.json({ 
      success: true, 
      message: "Container paused successfully",
      containerName: session.containerName,
      pausedAt: session.pausedAt
    });
  });
});

// Stop Container
app.post("/stop-container", verifyAuth, (req, res) => {
  const userId = req.userId;
  const os = req.query.os || req.body.os;
  const sessionKey = `${userId}_${os}`;

  if (!activeSessions.has(sessionKey)) {
    return res.status(404).json({ success: false, message: "No active session found" });
  }

  const session = activeSessions.get(sessionKey);
  // WINDOWS: Use & instead of &&
  const cmd = `docker stop ${session.containerName} & docker rm ${session.containerName}`;

  console.log(`🛑 Stopping and removing container ${session.containerName}...`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Failed to stop container: ${stderr}`);
      return res.status(500).json({
        success: false,
        message: "Failed to stop container",
        error: stderr,
      });
    }

    activeSessions.delete(sessionKey);
    console.log(`✅ Container ${session.containerName} stopped and removed`);
    
    res.json({ 
      success: true, 
      message: "Container stopped and removed successfully" 
    });
  });
});

// Get Session Info
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
        paused: session.paused || false,
        pausedAt: session.pausedAt || null,
      });
    }
  });

  res.json({
    success: true,
    sessions: userSessions,
    hasSession: userSessions.length > 0,
  });
});

// Admin: View all sessions
app.get("/admin/sessions", (req, res) => {
  const sessions = Array.from(activeSessions.values()).map((s) => ({
    userId: s.userId.substring(0, 8) + "...",
    containerName: s.containerName,
    os: s.os,
    ports: { vnc: s.vncPort, novnc: s.novncPort },
    startedAt: s.startedAt,
    paused: s.paused || false,
    pausedAt: s.pausedAt || null,
  }));

  res.json({ 
    success: true, 
    activeSessions: sessions.length,
    pausedSessions: sessions.filter(s => s.paused).length,
    runningSessions: sessions.filter(s => !s.paused).length,
    sessions 
  });
});

// Admin: Cleanup dead sessions
app.post("/admin/cleanup", (req, res) => {
  const promises = [];

  activeSessions.forEach((session, sessionKey) => {
    promises.push(
      new Promise((resolve) => {
        // WINDOWS: Use double quotes
        exec(`docker inspect -f "{{.State.Status}}" ${session.containerName}`, (error, stdout) => {
          if (error) {
            console.log(`Removing dead session for ${sessionKey} - container not found`);
            activeSessions.delete(sessionKey);
          } else {
            const status = stdout.trim();
            if (status !== "running" && status !== "paused" && status !== "exited") {
              console.log(`Removing dead session for ${sessionKey} - status: ${status}`);
              activeSessions.delete(sessionKey);
            }
          }
          resolve();
        });
      })
    );
  });

  Promise.all(promises).then(() => {
    const remainingSessions = Array.from(activeSessions.values());
    res.json({ 
      success: true, 
      message: "Cleanup completed", 
      activeSessions: activeSessions.size,
      pausedSessions: remainingSessions.filter(s => s.paused).length,
      runningSessions: remainingSessions.filter(s => !s.paused).length,
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-user VNC server running at http://localhost:${PORT}`);
  console.log(`📁 User data stored in: ${USER_DATA_DIR}`);
  console.log(`🌐 CORS enabled for all localhost ports`);
  console.log(`✨ Features: Pause/Resume, Resource Limits, Duplicate Prevention`);
  console.log(`💻 Platform: Windows`);
});
