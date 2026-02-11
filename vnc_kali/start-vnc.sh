#!/bin/bash

echo "=== Kali Linux VNC Server Startup ==="

# Update /etc/hosts
echo "Updating /etc/hosts file..."
HOSTNAME=$(hostname)
grep -q "$HOSTNAME" /etc/hosts || echo "127.0.1.1    $HOSTNAME" >> /etc/hosts

# Set environment
export USER=root
export HOME=/root
export DISPLAY=:1

# Fix /tmp permissions
echo "Setting up /tmp directory..."
mkdir -p /tmp
chmod 1777 /tmp
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix

# Setup TigerVNC config directory
echo "Setting up TigerVNC config..."
mkdir -p /root/.vnc
mkdir -p /root/.config/tigervnc

# Create xstartup if it doesn't exist
if [ ! -f /root/.vnc/xstartup ]; then
    echo '#!/bin/bash' > /root/.vnc/xstartup
    echo 'unset SESSION_MANAGER' >> /root/.vnc/xstartup
    echo 'unset DBUS_SESSION_BUS_ADDRESS' >> /root/.vnc/xstartup
    echo 'exec startxfce4' >> /root/.vnc/xstartup
    chmod +x /root/.vnc/xstartup
fi

# Kill any existing VNC server and clean locks
echo "Cleaning up any existing VNC servers..."
vncserver -kill :1 2>/dev/null || true
rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1 /tmp/.tX1-lock /root/.vnc/*.pid 2>/dev/null || true
sleep 2

# Start VNC server with TigerVNC
echo "Starting TigerVNC server at ${RESOLUTION:-1400x600}..."
tigervncserver :1 \
  -geometry ${RESOLUTION:-1400x600} \
  -depth 24 \
  -SecurityTypes None \
  -AlwaysShared \
  -localhost no \
  --I-KNOW-THIS-IS-INSECURE

# Wait for VNC to start
echo "Waiting for VNC server to initialize..."
sleep 8

# Check if VNC is running
if netstat -tln 2>/dev/null | grep -q ":5901"; then
    echo "✓ VNC server is listening on port 5901"
else
    echo "WARNING: VNC server may not be ready yet"
    # Try to get more info
    ps aux | grep Xtigervnc
fi

# ============= INJECT CONTROL PANEL INTO NOVNC =============
echo "Injecting control panel into noVNC..."

# Find noVNC vnc.html file
NOVNC_HTML="/usr/share/novnc/vnc.html"

if [ -f "$NOVNC_HTML" ]; then
    # Backup original if not already backed up
    if [ ! -f "${NOVNC_HTML}.original" ]; then
        cp "$NOVNC_HTML" "${NOVNC_HTML}.original"
        echo "✓ Backed up original vnc.html"
    fi
    
    # Copy control panel files to noVNC directory
    cp /app/vnc-control-panel.js /usr/share/novnc/
    cp /app/vnc-control-styles.css /usr/share/novnc/
    
    # Inject control panel into vnc.html (before </body>)
    if ! grep -q "vnc-control-panel.js" "$NOVNC_HTML"; then
        sed -i 's|</body>|<link rel="stylesheet" href="vnc-control-styles.css">\n<script src="vnc-control-panel.js"></script>\n</body>|' "$NOVNC_HTML"
        echo "✓ Control panel injected into noVNC"
    else
        echo "✓ Control panel already injected"
    fi
else
    echo "⚠ Warning: noVNC HTML file not found at $NOVNC_HTML"
    # Try alternative locations
    for alt_path in "/usr/share/novnc/vnc_lite.html" "/opt/novnc/vnc.html"; do
        if [ -f "$alt_path" ]; then
            echo "Found noVNC at: $alt_path"
            NOVNC_HTML="$alt_path"
            break
        fi
    done
fi

# Start websockify for noVNC
echo "Starting websockify on port 6080..."
websockify --web=/usr/share/novnc/ 6080 localhost:5901 &

sleep 2

echo ""
echo "=== Kali Linux Desktop Ready ==="
echo "✓ Kali XFCE Desktop Environment is running!"
echo "✓ VNC Control Panel injected and ready!"
echo "Access noVNC at: http://localhost:6080/vnc.html"
echo "Direct VNC port: 5901"
echo ""

# Keep container running and show logs
tail -f /dev/null
