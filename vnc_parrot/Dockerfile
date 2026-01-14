FROM parrotsec/security:latest

ENV DEBIAN_FRONTEND=noninteractive
ENV USER=root

# Install XFCE desktop with Parrot theme
RUN apt update && apt install -y \
    parrot-desktop-mate \
    tigervnc-standalone-server \
    novnc \
    websockify \
    dbus-x11 \
    x11-xserver-utils \
    parrot-wallpapers \
    firefox-esr \
    net-tools \
    curl \
    wget \
    vim \
    nano \
    git \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Setup VNC directories (no password needed)
RUN mkdir -p /root/.vnc && \
    touch /root/.Xauthority

# Create Desktop directory for user files
RUN mkdir -p /root/Desktop/student

# Set default display resolution
ENV RESOLUTION=1400x600

# Expose VNC and noVNC ports
EXPOSE 5901 6080

# Set working directory
WORKDIR /app

# Copy startup script
COPY start-vnc.sh /app/start-vnc.sh
RUN chmod +x /app/start-vnc.sh

# Create xstartup for MATE
RUN echo '#!/bin/bash' > /root/.vnc/xstartup && \
    echo 'unset SESSION_MANAGER' >> /root/.vnc/xstartup && \
    echo 'unset DBUS_SESSION_BUS_ADDRESS' >> /root/.vnc/xstartup && \
    echo 'exec mate-session' >> /root/.vnc/xstartup && \
    chmod +x /root/.vnc/xstartup

# Start VNC server
CMD ["/bin/bash", "-c", "/app/start-vnc.sh; exec tail -f /dev/null"]
