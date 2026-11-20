const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync, realpathSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { randomUUID } = require("node:crypto");
const mongoose = require("mongoose");

exports.startIsolatedMongo = async ({ replicaSet = false } = {}) => {
  const externalPort = process.env.TEST_ISOLATED_MONGO_PORT;
  if (externalPort) {
    if (!/^\d{4,5}$/.test(externalPort) || Number(externalPort) > 65535) {
      throw new Error("TEST_ISOLATED_MONGO_PORT must be a loopback fixture port");
    }
    const database = "nexora_test_" + randomUUID().replaceAll("-", "");
    const uri = `mongodb://127.0.0.1:${externalPort}/${database}?replicaSet=integration-rs`;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    return { uri, stop: () => mongoose.disconnect() };
  }
  const tempRoot = realpathSync(tmpdir());
  const directory = mkdtempSync(path.join(tempRoot, "ecommerce-integration-"));
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.env.TEST_MONGOD_PATH || "mongod", [
    "--dbpath", directory, "--bind_ip", "127.0.0.1", "--port", String(port),
    "--noauth", "--quiet",
    ...(replicaSet ? ["--replSet", "integration-rs"] : []),
  ], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let failure;
  let logs = "";
  child.on("error", (error) => { failure = error; });
  child.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-4000); });
  child.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-4000); });
  const stop = async () => {
    await mongoose.disconnect();
    if (child.exitCode === null && !failure) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      await exited;
    }
    // Only remove the exact fresh directory created by this helper.
    const resolved = realpathSync(directory);
    if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith("ecommerce-integration-")) {
      throw new Error("Refusing to clean an unexpected MongoDB directory");
    }
    rmSync(resolved, { recursive: true, force: true });
  };
  const uri = `mongodb://127.0.0.1:${port}/catalog_isolated_test`;
  try {
    const deadline = Date.now() + 20000;
    while (true) {
      if (failure || child.exitCode !== null) throw failure || new Error(logs);
      try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 250, directConnection: true }); break; }
      catch (error) {
        if (Date.now() > deadline) throw new Error("Isolated mongod startup failed: " + error.message + logs);
      }
    }
    if (replicaSet) {
      await mongoose.connection.db.admin().command({ replSetInitiate: { _id: "integration-rs", members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
      await mongoose.disconnect();
      await mongoose.connect(uri + "?replicaSet=integration-rs", { serverSelectionTimeoutMS: 20000 });
    }
    return { uri, stop };
  } catch (error) { await stop(); throw error; }
};
