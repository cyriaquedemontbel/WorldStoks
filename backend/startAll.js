const { exec } = require("child_process");

const server = exec("npm run server", { cwd: __dirname });
const client = exec("npm start", { cwd: "../client" });

server.stdout.on("data", data => console.log(`[SERVER] ${data}`));
client.stdout.on("data", data => console.log(`[CLIENT] ${data}`));
