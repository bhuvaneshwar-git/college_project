#### Note - Before cloning this repo please make sure you have installed the following softwares in your system 
- Docker
- node js
- react 
- vite ( for local deployement )
- sqlite ( database )
- git
- Authgear ( for authetication ) no installation needed 

## First Step 
Clone the repo

`git clone https://github.com/bhuvaneshwar-git/college_project.git 
`

 ` cd college_project
 `
## second Step 
Authgear setup

1. Sign up at portal.authgear.com
2. Create a Single Page Application
3. Set redirect URI: http://localhost:5173/callback
4. Copy Client ID and Endpoint to .env files

create a .env file in vnc-frontend directory in the below format 

.env file :
``VITE_AUTHGEAR_ENDPOINT=https://xyz.authgear.cloud  
  VITE_AUTHGEAR_CLIENT_ID=``
 
## Third Step
 Make sure you modify persistence storage path according to your system 
 
 Edit - `server.js`
 
 <img width="737" height="216" alt="persistence_storage" src="https://github.com/user-attachments/assets/0170f3f1-90c5-413d-a2af-d00bef2123f2" />



## Fourth Step 
Note - Before executing this command make sure you installed docker

In vnc_kali directory 
- open a terminal and type this command
  
  ` docker build -t vnc_kali .`
  
In vnc_parrot directory  

 - open a terminal and type this command
   
   ` docker build -t vnc_parrot .` 
  
## Fiveth Step 
Start the react and node application use the following command :

Note - run this command inside the vnc-frontend directory

`npm run dev`

 Run this command in inside the college_project directory 

 `node server.js` or `sudo node server.js`
 

 ## Final Step 
 Copy & paste the url of react server in the browser
 
 url - `http://localhost:5173/`

## POC


https://github.com/user-attachments/assets/3955f7d7-681a-42b9-be19-fb41f3b0fdf2



