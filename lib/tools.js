var child_process = require('child_process');

function execute(cmd) {
  if (this.debug === true) {
    console.log('EXECUTING: ' + cmd);
    return true;
  } else {
    try {
      child_process.execSync(cmd, { 'shell': '/bin/bash' });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

module.exports = {
  execute: execute
}