const { spawn } = require('child_process');
const path = require('path');

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

// Start backend (nodemon / server script)
const server = spawnProcess('npm', ['run', 'server'], { cwd: root, prefix: 'SERVER' });

// Start client (vite) - use the client dev script with retry on port-in-use
const clientDir = path.resolve(root, '..', 'client');

async function startClientWithRetry(startPort = 5173, attempts = 10) {
	for (let i = 0; i < attempts; i++) {
		const port = startPort + i;
		const env = Object.assign({}, process.env, { PORT: String(port) });
		console.log(`[CLIENT] attempting to start on port ${port}...`);

		const p = spawn('npm', ['run', 'dev'], { cwd: clientDir, shell: true, env });

		let portInUse = false;
		p.stdout && p.stdout.on('data', (d) => process.stdout.write(`[CLIENT] ${d}`));
		p.stderr && p.stderr.on('data', (d) => {
			const s = d.toString();
			process.stderr.write(`[CLIENT][ERR] ${s}`);
			if (/port .*in use|Port .* is already in use/i.test(s)) {
				portInUse = true;
			}
		});

		const exitPromise = new Promise((resolve) => p.on('exit', (code) => resolve(code)));

		// wait briefly to see if process exits immediately due to port error
		const race = await Promise.race([
			exitPromise,
			new Promise((res) => setTimeout(() => res('running'), 1200)),
		]);

		if (portInUse || race !== 'running' && typeof race === 'number' && race !== 0) {
			// client failed quickly due to port or another error -> try next port
			try { p.kill('SIGTERM'); } catch (e) {}
			console.log(`[CLIENT] port ${port} appears unavailable, trying next...`);
			continue;
		}

		// assume client started successfully
		console.log(`[CLIENT] started on port ${port}`);
		return p;
	}
	throw new Error('Failed to start client after multiple port attempts');
}

let client;
startClientWithRetry().then((p) => { client = p; }).catch((err) => {
	console.error('[CLIENT] failed to start:', err);
	shutdown(1);
});

function shutdown(code = 0) {
	console.log('Shutting down child processes...');
	try { server.kill('SIGTERM'); } catch (e) {}
	try { client.kill('SIGTERM'); } catch (e) {}
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
