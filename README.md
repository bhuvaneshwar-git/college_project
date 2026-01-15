## Prerequisites
- Docker
- node js
- react 
- sqlite ( database )
- Authgear ( for authetication ) no installation needed 

## Installation 
## 1. Clone the repo
```
git clone https://github.com/bhuvaneshwar-git/college_project.git 
cd college_project
```
## 2. setup backend
```
npm install
``` 
update .env file # Edit with your Authgear credentials

## 3. Setup frontend 
In vnc-frontend directory
```
npm install
```
update .env file # Edit with your Authgear credentials

## Authgear Setup
1. Sign up at portal.authgear.com
2. Create a Single Page Application
3. Set redirect URI: http://localhost:5173/login
4. Copy Client ID and Endpoint to .env files

## Tech stack
<ins>Frontend</ins>
- React 18 with Vite
- React Router for routing
- Authgear Web SDK
- Tailwind CSS
  
<ins>Backend</ins>

- Node.js + Express
- SQLite for session storage
  
<ins>Infrastrucre</ins>

- Docker containers
- noVNC for browser VNC
- Authgear for authentication

## Screenshots
## Login page 
<img width="549" height="443" alt="screenshot_1" src="https://github.com/user-attachments/assets/14e600a0-83e7-4357-a1f9-2e75c55e91ab" />

## Main application 
<img width="997" height="586" alt="image" src="https://github.com/user-attachments/assets/df151d17-b244-4498-a300-161bbf6a6eeb" />

## Session history
<img width="1219" height="488" alt="image" src="https://github.com/user-attachments/assets/ad740a76-9734-4af1-9323-9175b51da666" />

## Configuration

Frontend Environment (.env)
```
VITE_AUTHGEAR_ENDPOINT=https://your-app.authgear.cloud
VITE_AUTHGEAR_CLIENT_ID=your_client_id
```

Backend Environment (.env)
```
AUTHGEAR_ENDPOINT=https://your-app.authgear.cloud
AUTHGEAR_CLIENT_ID=your_client_id
PORT=3001
USER_DATA_DIR=/home/ubuntu/user_data
```
