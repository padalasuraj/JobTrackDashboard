import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDirectory = resolve(projectDirectory, 'backend');
const windows = process.platform === 'win32';

// Read plain KEY=value settings; never evaluate shell expressions from a file.
const backendEnvironment = { ...process.env };
if (!backendEnvironment.JAVA_HOME) {
  const probe = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8', windowsHide: true });
  const javaDirectory = `${probe.stdout ?? ''}\n${probe.stderr ?? ''}`.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!javaDirectory) {
    console.error('Java was not found. Install OpenJDK 21 and set JAVA_HOME to its installation directory.');
    process.exit(1);
  }
  backendEnvironment.JAVA_HOME = javaDirectory;
}
const envFile = resolve(backendDirectory, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in backendEnvironment) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    backendEnvironment[match[1]] = value;
  }
}

if (!existsSync(resolve(projectDirectory, 'node_modules/next'))) {
  console.error('Install frontend dependencies first: npm ci');
  process.exit(1);
}

const processes = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (windows && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
    else child.kill('SIGTERM');
  }
  process.exitCode = code;
}
function start(command, args, cwd, env) {
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  processes.push(child);
  child.once('error', error => { console.error(`Unable to start ${command}: ${error.message}`); stop(1); });
  child.once('exit', code => { if (!stopping) stop(code ?? 1); });
  return child;
}

console.log('Starting JobTrack: website http://localhost:3000 | API http://localhost:8080');
console.log('First backend startup downloads Maven dependencies. Press Ctrl+C to stop both services.');
if (windows) start('cmd.exe', ['/d', '/s', '/c', 'mvnw.cmd spring-boot:run'], backendDirectory, backendEnvironment);
else start('sh', ['./mvnw', 'spring-boot:run'], backendDirectory, backendEnvironment);
start(process.execPath, [resolve(projectDirectory, 'node_modules/next/dist/bin/next'), 'dev'], projectDirectory, process.env);
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
