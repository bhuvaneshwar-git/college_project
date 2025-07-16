#!/bin/bash

# Start VNC server
vncserver :1 -geometry 1024x768 -depth 24

# Start noVNC
/opt/novnc/utils/novnc_proxy --vnc localhost:5901 --listen 6080
