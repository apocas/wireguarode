var fs = require('fs');

var Peer = require('./peer');
var Group = require('./group');
var Tools = require('./tools');

class Wireguard {
  constructor() {
    this.addresses = [];
    this.private_key = null;
    this.listen_port = null;
    this.interfaces = [];
    this.peers = [];
    this.groups = [];
    this.enforce2fa = false;
    this.path = null;
    this.debug = false;
  }

  restart() {
    Tools.execute('wg-quick down wg0');
    Tools.execute('wg-quick up wg0');
  }

  reload() {

  }

  addGroup(config) {
    if (this.findGroup(config.name)) {
      return false;
    }

    var group = new Group(config.name);
    if (config.destinations) {
      for (var j = 0; j < config.destinations.length; j++) {
        group.addDestination(config.destinations[j]);
      }
    }
    this.groups.push(group);
    return true;
  }

  removeGroup(group) {
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i].name == group.name) {
        this.groups.splice(i, 1);
        return true;
      }
    }
    return false;
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
      addresses: this.addresses,
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
        addresses: this.peers[i].addresses,
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
        group.destinations.push(this.groups[i].destinations[j].toString());
      }
      config.groups.push(group);
    }

    fs.writeFileSync(path + '/config.json', JSON.stringify(config, null, 2));
  }


  addPeer(config) {
    if (this.findPeer(config.identifier)) {
      return false;
    }
    var group = this.findGroup(config.group);
    if (!group) {
      return false;
    }
    var peer = new Peer(config, this.enforce2fa);
    this.peers.push(peer);
    return true;
  }

  removePeer(identifier) {
    for (var i = 0; i < this.peers.length; i++) {
      if (this.peers[i].identifier == identifier) {
        this.peers.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  loadConfig(config) {
    this.addresses = config.addresses;
    this.private_key = config.private_key;
    this.listen_port = config.listen_port;
    this.interfaces = config.interfaces;
    this.enforce2fa = config.enforce2fa;
    this.path = config.path;
    this.debug = config.debug;

    this.peers = [];
    this.groups = [];

    for (var i = 0; i < config.peers.length; i++) {
      this.addPeer(config.peers[i]);
    }

    for (var i = 0; i < config.groups.length; i++) {
      this.addGroup(config.groups[i]);
    }
  }

  generateFiles(cpath) {
    if (!cpath) {
      cpath = this.path;
    }
    var options = {
      'mode': 0o755
    }
    fs.writeFileSync(cpath + '/wg0.conf', this.generateConf(), options);
    fs.writeFileSync(cpath + '/0-init.sh', this.generateInit(), options);
    fs.writeFileSync(cpath + '/1-groups.sh', this.generateGroups(), options);
    fs.writeFileSync(cpath + '/2-acls.sh', this.generateAcls(), options);
    fs.writeFileSync(cpath + '/9-cleanup.sh', this.generateCleanup(), options);
  }

  generateConf() {
    var output = "[Interface]\n";
    output += "Address = " + this.addresses.join(", ") + "\n";
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
        output += this.peers[i].allow();
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

    output += "iptables -A wireguarode -j REJECT\n";

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