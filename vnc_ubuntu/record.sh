#!/bin/bash
DISPLAY=:1
OUTPUT="/root/Desktop/student/session_$(date +%s).mp4"

mkdir -p /root/recordings

ffmpeg -y \
  -video_size 1400x600 \
  -framerate 30 \
  -f x11grab \
  -i $DISPLAY \
  -vcodec libx264 \
  -preset ultrafast \
  -pix_fmt yuv420p \
  $OUTPUT

