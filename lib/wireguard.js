var fs = require('fs');

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
  }

  execute(cmd) {
    //todo: implement
    console.log('EXECUTING: ' + cmd);
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
    }
  }

  deactivatePeer(peer) {
    this.execute(peer.disable());
  }

  saveConfig(path) {
    var config = {
      ips: this.ips,
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
        pairs: []
      };
      for (var j = 0; j < this.groups[i].pairs.length; j++) {
        group.pairs.push(this.groups[i].pairs[j]);
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

    this.peers = [];
    for (var i = 0; i < config.peers.length; i++) {
      var peer = new Peer(config.peers[i]);
      this.peers.push(peer);
    }

    this.groups = [];
    for (var i = 0; i < config.groups.length; i++) {
      var group = new Group(config.groups[i].name);
      for (var j = 0; j < config.groups[i].pairs.length; j++) {
        group.pairs.push(config.groups[i].pairs[j]);
      }
      this.groups.push(group);
    }
  }

  generateFiles(cpath) {
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

    output += "PostUp = 0-init.sh\n";
    output += "PostUp = 1-groups.sh\n";
    output += "PostUp = 2-acls.sh\n";
    output += "PostDown = 9-cleanup.sh\n";

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

    output += "iptables -N wireguard_wg0\n";
    output += "iptables -F wireguard_wg0\n";


    for (var i = 0; i < this.groups.length; i++) {
      output += "iptables -N " + this.groups[i].name + "\n";
      output += "iptables -F " + this.groups[i].name + "\n";
      output += this.groups[i].generateConf();
    }

    output += "iptables -I INPUT   -i wg0 -j wireguard_wg0\n";
    output += "iptables -I FORWARD -i wg0 -j wireguard_wg0\n";
    output += "iptables -I FORWARD -o wg0 -j wireguard_wg0\n";
    output += "iptables -I OUTPUT  -o wg0 -j wireguard_wg0\n";

    output += "iptables -A wireguard_wg0 -m state --state ESTABLISHED,RELATED -j ACCEPT\n";

    return output;
  }

  generateCleanup() {
    var output = "#!/bin/sh\n\n";

    output += "iptables -D INPUT   -i wg0 -j wireguard_wg0\n";
    output += "iptables -D FORWARD -i wg0 -j wireguard_wg0\n";
    output += "iptables -D FORWARD -o wg0 -j wireguard_wg0\n";
    output += "iptables -D OUTPUT  -o wg0 -j wireguard_wg0\n";
    output += "iptables -F wireguard_wg0\n";


    for (var i = 0; i < this.groups.length; i++) {
      output += "iptables -F " + this.groups[i].name + "\n";
      output += "iptables -X " + this.groups[i].name + "\n";
    }

    output += "iptables -F wireguard_wg0\n";
    output += "iptables -X wireguard_wg0\n";

    return output;
  }

}

module.exports = Wireguard;