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

echo "Starting noVNC on port 6081..."
websockify --web=/usr/share/novnc/ 6081 localhost:5901 &


# ✅ Wait a few seconds to ensure XFCE is up before launching VS Code
sleep 5

echo "Launching Visual Studio Code..."
export DISPLAY=:1
code --no-sandbox --disable-gpu --user-data-dir=/root/.vscode-root &

echo "VNC + noVNC started! Access via http://<host-ip>:6081/vnc.html"
tail -f /dev/null

