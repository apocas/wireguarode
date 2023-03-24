#!/usr/bin/env node

const { Command } = require('commander');
var Wireguard = require('../lib/wireguard');
var Group = require('../lib/group');

const program = new Command();
var wireguard = new Wireguard();

var config;
try {
  config = require(process.env.CONFIG);
} catch (error) {
  try {
    config = require('/etc/wireguard/config');
  } catch (error) {
    try {
      config = require('../test/config');
    } catch (error) {
      console.log('Error reading configuration file...');
    }
  }
}

try {
  wireguard.loadConfig(config);
} catch (error) {
  console.log(error)
  console.log('Error loading configuration file...');
}


program
  .name('wireguarode')
  .description('Wireguard with ACLs and TOTP 2FA')
  .version('1.0.0')

program.command('save')
  .description('Save configuration file')
  .option('--path <path>', 'path to save configuration file')
  .action((options) => {
    wireguard.saveConfig(options.path);
  });

program.command('generate')
  .description('Generate configuration files')
  .option('--path <path>', 'path to save configuration files')
  .action((options) => {
    wireguard.generateFiles(options.path);
  });

program.command('expire')
  .description('Expire peers')
  .option('--minutes <minutes>', 'maximum minutes since last login, 24hours default')
  .action((options) => {
    wireguard.expirePeers();
  });


const groupcmd = program.command('group')

groupcmd.command('add')
  .description('Add group')
  .argument('<identifier>', 'group identifier')
  .action((identifier) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      console.log('Group already exists');
    } else {
      wireguard.addGroup({
        "name": identifier
      });
      console.log('Group added');
      wireguard.saveConfig();
    }
  });

groupcmd.command('remove')
  .description('Remove group')
  .argument('<identifier>', 'group identifier')
  .action((identifier) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      wireguard.removeGroup(group);
      console.log('Group removed');
      wireguard.saveConfig();
    } else {
      console.log('Group not found');
    }
  });

groupcmd.command('adddestination')
  .description('Add group destination')
  .argument('<identifier>', 'group identifier')
  .argument('<destination>', 'Destination')
  .action((identifier, destination) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      group.addDestination(destination);
      console.log('Group destination added');
      wireguard.saveConfig();
    } else {
      console.log('Group not found');
    }
  });

groupcmd.command('removedestination')
  .description('Remove group destination')
  .argument('<identifier>', 'group identifier')
  .argument('<destination>', 'Destination')
  .action((identifier, destination) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      group.removeDestination(destination);
      console.log('Group destination removed');
      wireguard.saveConfig();
    } else {
      console.log('Group not found');
    }
  });


const peercmd = program.command('peer')

peercmd.command('activate')
  .description('Activate peer')
  .argument('<identifier>', 'peer identifier')
  .argument('<code>', 'totp code')
  .action((identifier, code) => {
    var peer = wireguard.findPeer(identifier);
    if (peer) {
      var logged = peer.activate(code);
      if (logged) {
        console.log('Peer activated');
      } else {
        console.log('Invalid totp code');
      }
    } else {
      console.log('Peer not found');
    }
  });

peercmd.command('deactivate')
  .description('Deactivate peer')
  .argument('<identifier>', 'peer identifier')
  .action((identifier) => {
    var peer = wireguard.findPeer(identifier);
    if (peer) {
      peer.deactivate();
      console.log('Peer deactivated');
    } else {
      console.log('Peer not found');
    }
  });

peercmd.command('secret')
  .description('Generate secret')
  .argument('<identifier>', 'peer identifier')
  .action((identifier) => {
    var peer = wireguard.findPeer(identifier);
    if (peer) {
      var secret = peer.generate2FA();
      console.log('Secret generated: ' + secret);
      wireguard.saveConfig();
    } else {
      console.log('Peer not found');
    }
  });

program.parse();