const { spawn } = require('child_process');

const execCommand = (command, { interactive = false } = {}) => new Promise((resolve, reject) => {
  const childProcess = spawn(command, [], {
    stdio: interactive ? 'inherit' : 'pipe',
    shell: true,
  });

  if (interactive) {
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: '', stderr: '', command });
        return;
      }

      reject({ stdout: '', stderr: '', command, code });
    });

    childProcess.on('error', (error) => {
      reject({ error, command });
    });

    return;
  }

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
