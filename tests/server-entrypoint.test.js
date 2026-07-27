const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForHealth(port, child, output) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early with ${child.exitCode}. Output: ${output.join('')}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.status === 200) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Server did not become healthy. Output: ${output.join('')}`);
}

async function run() {
  const port = await getFreePort();
  const output = [];
  const child = spawn(process.execPath, ['server/http-server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '0.0.0.0',
      OPENAI_API_KEY: 'startup-smoke-test-not-a-real-key',
      OPENAI_MODEL: 'startup-test-model',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));

  try {
    const health = await waitForHealth(port, child, output);
    assert.equal(child.exitCode, null, 'the Render entrypoint process remains alive');
    assert.equal(health.status, 'ok');
    assert.equal(health.providerConfigured, true);
    assert.equal(health.model, 'startup-test-model');
    assert(output.join('').includes(`http://0.0.0.0:${port}`));
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
  }
  assert.equal(child.exitCode, 0);
  console.log('La prueba del entrypoint confirmó que el servidor permanece escuchando.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
