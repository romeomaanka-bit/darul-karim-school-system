import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(
  env.API_PORT,
  "0.0.0.0",
  () => console.log(
    `Darul-Karim API listening on http://0.0.0.0:${env.API_PORT}`
  )
);

async function close(signal: string) {
  console.log(`${signal} received; closing server`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void close("SIGTERM"));
process.on("SIGINT", () => void close("SIGINT"));