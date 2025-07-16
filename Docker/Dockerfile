FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install XFCE, TigerVNC, noVNC dependencies
RUN apt update && apt install -y \
    xfce4 xfce4-goodies tightvncserver wget git python3 \
    net-tools xterm sudo curl \
    && apt clean

# Set VNC password
RUN mkdir ~/.vnc && \
    echo "password" | vncpasswd -f > ~/.vnc/passwd && \
    chmod 600 ~/.vnc/passwd

# Clone noVNC
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc && \
    git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify

# Expose ports
EXPOSE 5901 6080

# Copy startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

CMD ["/startup.sh"]

