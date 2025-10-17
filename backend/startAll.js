const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

function spawnProcess(command, args, opts) {
	const p = spawn(command, args, Object.assign({ shell: true }, opts));

	p.stdout && p.stdout.on('data', (data) => {
		process.stdout.write(`[${opts.prefix}] ${data}`);
	});
	p.stderr && p.stderr.on('data', (data) => {
		process.stderr.write(`[${opts.prefix}][ERR] ${data}`);
	});

	p.on('exit', (code, signal) => {
		console.log(`[${opts.prefix}] exited with code=${code} signal=${signal}`);
	});

	return p;
}

const root = __dirname;
// client directory
const clientDir = path.resolve(root, '..', 'client');

// === ATLAS WORKFLOW ===
// Ce script démarre uniquement le backend et le client.
// La base MongoDB est maintenant gérée par Atlas (voir .env pour la chaîne de connexion).
// Pour démarrer le projet :
//   1. Vérifiez que votre .env contient la chaîne Atlas (MONGO_URI=...)
//   2. Exécutez : node backend/startAll.js
//   3. Le backend démarre sur le port 5000, le client sur le port 5173 (ou suivant).
//   4. Pour migrer les données, utilisez mongodump/mongorestore (voir README).

console.log('[STARTALL] MongoDB Atlas workflow : ce script démarre uniquement le backend et le client. La base est gérée par Atlas.');

// Immediately start backend and client (do not wait for DB readiness here)
startServerAndClient();

async function startClientWithRetry(startPort = 5173, attempts = 10) {
	for (let i = 0; i < attempts; i++) {
		const port = startPort + i;
		const env = Object.assign({}, process.env, { PORT: String(port) });
		console.log(`[CLIENT] attempting to start on port ${port}...`);

		// Start vite directly with explicit port so we avoid npm script indirection
		const p = spawn('npx', ['vite', '--port', String(port)], { cwd: clientDir, shell: true, env });

		let portInUse = false;
		let exitedQuickly = false;
		p.stdout && p.stdout.on('data', (d) => process.stdout.write(`[CLIENT] ${d}`));
		p.stderr && p.stderr.on('data', (d) => {
			const s = d.toString();
			process.stderr.write(`[CLIENT][ERR] ${s}`);
			if (/port .*in use|Port .* is already in use/i.test(s)) {
				portInUse = true;
			}
		});

		const exitHandler = () => { exitedQuickly = true; };
		p.on('exit', exitHandler);

		// wait a short while to ensure process is stable (vite can take a bit)
		await new Promise((res) => setTimeout(res, 3000));

		p.removeListener('exit', exitHandler);

		if (portInUse || exitedQuickly) {
			try { p.kill('SIGTERM'); } catch (e) {}
			console.log(`[CLIENT] port ${port} appears unavailable or client exited quickly, trying next...`);
			continue;
		}

		console.log(`[CLIENT] started on port ${port}`);
		return p;
	}
	throw new Error('Failed to start client after multiple port attempts');
}

function startServerAndClient() {
	// Start backend (nodemon / server script)
	const server = spawnProcess('npm', ['run', 'server'], { cwd: root, prefix: 'SERVER' });

	let client;
	// If any port in the client retry range is already listening, assume client is already running and skip starting it.
	function isPortListeningSync(port) {
		try {
			const out = execSync(`netstat -ano | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
			return out && out.trim().length > 0;
		} catch (e) {
			return false;
		}
	}

	let anyListening = false;
	const clientStartPort = process.env.CLIENT_START_PORT ? Number(process.env.CLIENT_START_PORT) : 5173;
	const clientAttempts = 10;
	for (let i = 0; i < clientAttempts; i++) {
		if (isPortListeningSync(clientStartPort + i)) { anyListening = true; break; }
	}

	if (anyListening) {
		console.log('[CLIENT] port in 5173..5173+9 already in use, skipping client start (assume it is already running)');
	} else {
		startClientWithRetry(clientStartPort, clientAttempts).then((p) => { client = p; }).catch((err) => {
			console.error('[CLIENT] failed to start:', err);
			shutdown(1);
		});
	}

	function shutdown(code = 0) {
		console.log('Shutting down child processes...');
		try { server && server.kill('SIGTERM'); } catch (e) {}
		try { client && client.kill('SIGTERM'); } catch (e) {}
		try { mongodProcess && mongodProcess.kill('SIGTERM'); } catch (e) {}
		process.exit(code);
	}

	process.on('SIGINT', () => shutdown(0));
	process.on('SIGTERM', () => shutdown(0));

	process.on('uncaughtException', (err) => {
		console.error('Uncaught exception:', err);
		shutdown(1);
	});

	process.on('unhandledRejection', (reason) => {
		console.error('Unhandled promise rejection:', reason);
		shutdown(1);
	});
}

// client/server lifecycle is handled inside startServerAndClient() after mongo readiness
