# Use an official Ubuntu base image
FROM kalilinux/kali-rolling

# Avoid warnings by switching to noninteractive for the build process
ENV DEBIAN_FRONTEND=noninteractive

ENV USER=root

RUN echo "deb http://mirror.karneval.cz/pub/linux/kali kali-rolling main contrib non-free non-free-firmware" > /etc/apt/sources.list

# Install XFCE, VNC server, dbus-x11, and xfonts-base
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    dbus-x11 \
    xfonts-base \
    novnc  \
    websockify  \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Setup VNC server
RUN mkdir /root/.vnc \
    && echo "Spiher@2025" | vncpasswd -f > /root/.vnc/passwd \
    && chmod 600 /root/.vnc/passwd

# Create an .Xauthority file
RUN touch /root/.Xauthority

# Set display resolution (change as needed)
ENV RESOLUTION=1400x600

# Expose VNC port
EXPOSE 5901 6080


# Set the working directory in the container
WORKDIR /app

# --- Auto-connect patch for noVNC ---
RUN sed -i 's@UI.start();@UI.connect("localhost", 5901, { encrypt: false });@' /usr/share/novnc/app/ui.js

# Copy a script to start the VNC server
COPY start-vnc.sh start-vnc.sh
RUN chmod +x start-vnc.sh

# List the contents of the /app directory

RUN ls -a /app
CMD ["/app/start-vnc.sh"]

