var fs = require('fs');
var child_process = require('child_process');

var Peer = require('./peer');
var Group = require('./group');

var otplib = require('otplib')

class Wireguard {
  constructor() {
    this.ips = [];
    this.private_key = null;
    this.listen_port = null;
    this.interfaces = [];
    this.peers = [];
    this.groups = [];
    this.enforce2fa = false;
    this.path = null;
    this.debug = false;
  }

  execute(cmd) {
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

  addGroup(group) {
    this.groups.push(group);
  }

  removeGroup(group) {
    for (var i = 0; i < this.peers.length; i++) {
      if (this.peers[i].group == group.name) {
        return false;
      }
    }
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].name == group.name) {
        this.groups.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  generateQRcode(peer) {
    if (!peer.secret) {
      peer.secret = otplib.authenticator.generateSecret();
    }
    return otplib.authenticator.keyuri(peer.identifier, 'wireguarode', peer.secret);
  }

  activatePeer(peer, code) {
    if (otplib.authenticator.check(code, peer.secret)) {
      peer.active = true;
      peer.lastlogin = new Date().getTime() / 1000;
      this.execute(peer.generateAcl());
      return true;
    } else {
      return false;
    }
  }

  deactivatePeer(peer) {
    this.execute(peer.disable());
  }

  expirePeers(mins) {
    var now = new Date().getTime() / 1000;
    for (var i = 0; i < this.peers.length; i++) {
      if (this.peers[i].active && now - this.peers[i].lastlogin < ((mins || 1440) * 60)) {
        this.deactivatePeer(this.peers[i]);
      }
    }
  }

  findPeer(identifier) {
    for (var i = 0; i < this.peers.length; i++) {
      if (this.peers[i].identifier == identifier) {
        return this.peers[i];
      }
    }
    return null;
  }

  findGroup(name) {
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].name == name) {
        return this.groups[i];
      }
    }
    return null;
  }

  saveConfig(path) {
    if (!path) {
      path = this.path;
    }

    var config = {
      ips: this.ips,
      enforce2fa: this.enforce2fa,
      debug: this.debug,
      path: this.path,
      private_key: this.private_key,
      listen_port: this.listen_port,
      interfaces: this.interfaces,
      peers: [],
      groups: []
    };

    for (var i = 0; i < this.peers.length; i++) {
      var peer = {
        identifier: this.peers[i].identifier,
        ips: this.peers[i].ips,
        public_key: this.peers[i].public_key,
        group: this.peers[i].group,
        secret: this.peers[i].secret,
        lastlogin: this.peers[i].lastlogin
      };
      config.peers.push(peer);
    }

    for (var i = 0; i < this.groups.length; i++) {
      var group = {
        name: this.groups[i].name,
        destinations: []
      };
      for (var j = 0; j < this.groups[i].destinations.length; j++) {
        group.destinations.push(this.groups[i].destinations[j]);
      }
      config.groups.push(group);
    }

    fs.writeFileSync(path + '/config.json', JSON.stringify(config, null, 2));
  }

  loadConfig(config) {
    this.ips = config.ips;
    this.private_key = config.private_key;
    this.listen_port = config.listen_port;
    this.interfaces = config.interfaces;
    this.enforce2fa = config.enforce2fa;
    this.path = config.path;
    this.debug = config.debug;

    if (this.debug === true) {
      console.log('DEBUG MODE ENABLED');
    }

    this.peers = [];
    for (var i = 0; i < config.peers.length; i++) {
      var peer = new Peer(config.peers[i], this.enforce2fa);
      this.peers.push(peer);
    }

    this.groups = [];
    for (var i = 0; i < config.groups.length; i++) {
      var group = new Group(config.groups[i].name);
      for (var j = 0; j < config.groups[i].destinations.length; j++) {
        group.destinations.push(config.groups[i].destinations[j]);
      }
      this.groups.push(group);
    }
  }

  generateFiles(cpath) {
    if (!cpath) {
      cpath = this.path;
    }
    fs.writeFileSync(cpath + '/wg0.conf', this.generateConf());
    fs.writeFileSync(cpath + '/0-init.sh', this.generateInit());
    fs.writeFileSync(cpath + '/1-groups.sh', this.generateGroups());
    fs.writeFileSync(cpath + '/2-acls.sh', this.generateAcls());
    fs.writeFileSync(cpath + '/9-cleanup.sh', this.generateCleanup());
  }

  generateConf() {
    var output = "[Interface]\n";
    output += "Address = " + this.ips.join(", ") + "\n";
    output += "PrivateKey = " + this.private_key + "\n";
    output += "ListenPort = " + this.listen_port + "\n\n";

    for (var i = 0; i < this.interfaces.length; i++) {
      output += "PostUp = iptables -t nat -A POSTROUTING -o " + this.interfaces[i] + " -j MASQUERADE\n";
    }

    output += "PostUp = " + this.path + "/0-init.sh\n";
    output += "PostUp = " + this.path + "/1-groups.sh\n";
    output += "PostUp = " + this.path + "/2-acls.sh\n";
    output += "PostDown = " + this.path + "/9-cleanup.sh\n";

    for (var i = 0; i < this.interfaces.length; i++) {
      output += "PostDown = iptables -t nat -D POSTROUTING -o " + this.interfaces[i] + " -j MASQUERADE\n";
    }

    output += "\n";

    for (var i = 0; i < this.peers.length; i++) {
      output += this.peers[i].generateConf() + "\n";
    }

    return output;
  }

  generateAcls() {
    var output = "#!/bin/sh\n\n";

    for (var i = 0; i < this.peers.length; i++) {
      if (this.peers[i].active === true) {
        output += "# " + this.peers[i].identifier + "\n";
        output += this.peers[i].generateAcl();
      }
    }

    return output;
  }

  generateGroups() {
    var output = "#!/bin/sh\n\n";

    for (var i = 0; i < this.groups.length; i++) {
      output += "# " + this.groups[i].name + "\n";
      output += this.groups[i].generateConf();
    }

    return output;
  }

  generateInit() {
    var output = "#!/bin/sh\n\n";

    output += "iptables -N wireguarode\n";
    output += "iptables -F wireguarode\n";


    for (var i = 0; i < this.groups.length; i++) {
      output += "iptables -N " + this.groups[i].name + "\n";
      output += "iptables -F " + this.groups[i].name + "\n";
      output += this.groups[i].generateConf();
    }

    output += "iptables -I INPUT   -i wg0 -j wireguarode\n";
    output += "iptables -I FORWARD -i wg0 -j wireguarode\n";
    output += "iptables -I FORWARD -o wg0 -j wireguarode\n";
    output += "iptables -I OUTPUT  -o wg0 -j wireguarode\n";

    output += "iptables -A wireguarode -m state --state ESTABLISHED,RELATED -j ACCEPT\n";

    return output;
  }

  generateCleanup() {
    var output = "#!/bin/sh\n\n";

    output += "iptables -D INPUT   -i wg0 -j wireguarode\n";
    output += "iptables -D FORWARD -i wg0 -j wireguarode\n";
    output += "iptables -D FORWARD -o wg0 -j wireguarode\n";
    output += "iptables -D OUTPUT  -o wg0 -j wireguarode\n";
    output += "iptables -F wireguarode\n";


    for (var i = 0; i < this.groups.length; i++) {
      output += "iptables -F " + this.groups[i].name + "\n";
      output += "iptables -X " + this.groups[i].name + "\n";
    }

    output += "iptables -F wireguarode\n";
    output += "iptables -X wireguarode\n";

    return output;
  }

}

module.exports = Wireguard;