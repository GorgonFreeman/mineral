const { spawn } = require('child_process');

const execCommand = (command) => new Promise((resolve, reject) => {
  const childProcess = spawn(command, [], {
    stdio: 'pipe',
    shell: true,
  });

  let stdout = '';
  let stderr = '';

  childProcess.stdout.on('data', (data) => {
    stdout += data.toString();
    process.stdout.write(data);
  });

  childProcess.stderr.on('data', (data) => {
    stderr += data.toString();
    process.stderr.write(data);
  });

  childProcess.on('close', (code) => {
    if (code === 0) {
      resolve({ stdout, stderr, command });
      return;
    }

    reject({ stdout, stderr, command, code });
  });

  childProcess.on('error', (error) => {
    reject({ error, command });
  });
});

module.exports = {
  execCommand,
};
