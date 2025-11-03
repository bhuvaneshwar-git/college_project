#!/bin/bash
set -e

echo 'Updating /etc/hosts file...'
HOSTNAME=$(hostname)
echo "127.0.1.1    $HOSTNAME" >> /etc/hosts

echo "Starting VNC server at $RESOLUTION..."
vncserver -kill :1 || true
vncserver :1 -geometry $RESOLUTION -depth 24  &

# Ensure XFCE starts in VNC sessions
cat > /root/.vnc/xstartup <<EOF
#!/bin/sh
xrdb $HOME/.Xresources
startxfce4 &
EOF
chmod +x /root/.vnc/xstartup

echo "Starting noVNC on port 6080..."
websockify --web=/usr/share/novnc/ 6080 localhost:5901 &

echo "VNC + noVNC started! Access via http://<host-ip>:6080/vnc.html"
tail -f /dev/null

