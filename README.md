#### Note - Before cloning this repo please make sure you have installed the following softwares in your system 
- Docker
- node js
- git

## First Step 
Clone the repo

`git clone https://github.com/bhuvaneshwar-git/college_project.git 
`

 ` cd college_project
 `
 ## Second Step
 Make sure you modify persistence storage path according to your system 
 
 Edit - `server.js`
 
 <img width="737" height="216" alt="persistence_storage" src="https://github.com/user-attachments/assets/0170f3f1-90c5-413d-a2af-d00bef2123f2" />



## Third Step 
Note - Before executing this command make sure you installed docker

In vnc_kali directory 
- open a terminal and type this command
  
  ` docker build -t vnc_kali .`
  
In vnc_ubuntu directory  

 - open a terminal and type this command
   
   ` docker build -t vnc_ubuntu .` 
  
## Fourth Step 
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



