var child_process = require('child_process');

function execute(cmd) {
  if (this.debug === true) {
    console.log('EXECUTING: ' + cmd);
    return true;
  } else {
    try {
      child_process.execSync(cmd);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = {
  execute: execute
}