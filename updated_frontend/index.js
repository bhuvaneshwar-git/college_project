var i = 0;
var txt = "Welcome to our Virtual Lab"; /* The text */
var speed = 50; /* The speed/duration of the effect in milliseconds */

function typeWriter() {
  if (i < txt.length) {
    document.getElementById("demo").innerHTML += txt.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}

function goTo() {
  window.location.href = "http://127.0.0.1:5500/Home.html"; // or full URL like "http://127.0.0.1:5500/about.html"
}
