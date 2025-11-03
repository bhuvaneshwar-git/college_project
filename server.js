const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.post("/start-container", (req, res) => {
  const os = req.query.os || "ubuntu"; 

  let cmd = "";
  let url = "";

  if (os === "ubuntu") {
    cmd = `
      docker rm -f vnc_ubuntu 2>/dev/null || true &&
      docker run -d -p 6081:6081 \
        --name vnc_ubuntu \
        -v /home/bhuvanesh/Documents/docker/vnc_ubuntu/persistence_storage/ubuntu:/root/Desktop/student \
        vnc_ubuntu
    `;
    url = "http://localhost:6081/vnc.html";

  } else if (os === "kali") {
    cmd = `
      docker rm -f vnc_kali 2>/dev/null || true &&
      docker run -d -p 6080:6080 \
        --name vnc_kali \
        -v /home/bhuvanesh/Documents/docker/vnc_ubuntu/persistence_storage/kali:/root/Desktop/student \
        vnc_kali
    `;
    url = "http://localhost:6080/vnc.html";

  } else {
    return res.status(400).json({ success: false, message: "Invalid OS specified" });
  }

  console.log(`Starting ${os} container...`);
  exec(cmd, (error, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.error("STDERR:", stderr);

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: `Failed to start ${os} container`, error: stderr });
    }

    res.json({ success: true, url });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

