const express = require("express");
const { createServer } = require("http"); // Changed from 'node:http'
const { Server } = require("socket.io");
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const os = require("os");
const pty = require("node-pty");

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: './user',
  env: process.env,
});

const app = express();
const server = createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*' 
  } 
});

const PORT = process.env.PORT || 9000;

app.use(bodyParser.json());
app.use(cors());

ptyProcess.onData((data) => {
  console.log(data);
  io.emit("terminal:data", data);
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("terminal:write", (data) => {
    console.log("Term", data);
    if (data.trim().toLowerCase().startsWith("cd")) {
      console.log("CD command disabled");
      return; // ignore the CD command
    }
    ptyProcess.write(data);
  });
});

app.post('/submit', (req, res) => {
  const { code } = req.body; // Destructure code from request body

  fs.writeFile('./user/ant.cpp', code, (err) => {
    if (err) {
      console.error('Error writing to file', err);
      return res.status(500).send('Error writing to file');
    }
    console.log('File written successfully');
    res.send('File written successfully');
  });
});

server.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
