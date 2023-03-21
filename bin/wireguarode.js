#!/usr/bin/env node

const { Command } = require('commander');
var Wireguard = require('../lib/wireguard');

const program = new Command();
var wireguard = new Wireguard();

try {
  var config = require(process.env.CONFIG || '/etc/wireguard/config');
  wireguard.loadConfig(config);
} catch (error) {
  console.log('Error loading configuration file');
}

program
  .name('wireguarode')
  .description('Wireguard with ACLs and TOTP 2FA')
  .version('1.0.0')

program.command('save')
  .description('Save configuration file')
  .option('--path', 'path to save configuration file')
  .action((options) => {
    wireguard.saveConfig(options.path);
  });

program.command('generate')
  .description('Generate configuration files')
  .option('--path', 'path to save configuration files')
  .action((options) => {
    wireguard.generateFiles(options.path);
  });

program.command('expire')
  .description('Expire peers')
  .option('--minutes', 'maximum minutes since last login, 24hours default')
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
      wireguard.addGroup(new Group(identifier));
      console.log('Group added');
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
    } else {
      console.log('Group not found');
    }
  });

groupcmd.command('adddestination')
  .description('Add group destination')
  .argument('<identifier>', 'group identifier')
  .argument('<destination>', 'IP destination')
  .argument('<port>', 'port')
  .argument('<protocol>', 'protocol')
  .action((identifier, destination, port, protocol) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      group.addDestination(destination, port, protocol);
      console.log('Group destination added');
    } else {
      console.log('Group not found');
    }
  });

groupcmd.command('removedestination')
  .description('Remove group destination')
  .argument('<identifier>', 'group identifier')
  .argument('<destination>', 'IP destination')
  .argument('<port>', 'port')
  .argument('<protocol>', 'protocol')
  .action((identifier, destination, port, protocol) => {
    var group = wireguard.findGroup(identifier);
    if (group) {
      group.removeDestination(destination, port, protocol);
      console.log('Group destination removed');
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
      var logged = wireguard.activatePeer(peer, code);
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
      wireguard.deactivatePeer(peer);
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
      var secret = wireguard.generateSecret(peer);
      console.log('Secret generated: ' + secret);
    } else {
      console.log('Peer not found');
    }
  });

program.parse();