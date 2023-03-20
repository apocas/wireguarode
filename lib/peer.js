class Peer {
  constructor(config) {
    this.ips = config.ips;
    this.public_key = config.public_key;
    this.identifier = config.identifier;
    this.group = config.group;
    this.secret = config.secret;
    if (this.secret) {
      this.active = false;
    } else {
      this.active = true;
    }
    this.lastlogin = config.lastlogin;
  }

  generateConf() {
    var output = "[Peer]\n";

    output += "# " + this.identifier + "\n";
    output += "PublicKey = " + this.public_key + "\n";
    output += "AllowedIPs = " + this.ips.join(", ") + "\n";
    output += "PersistentKeepalive = 30\n";

    return output;
  }

  generateAcl() {
    return "iptables -A " + this.group + " -s " + this.ips[0] + " -j ACCEPT\n";
  }

  disable() {
    this.active = false;
    return "iptables -D " + this.group + " -s " + this.ips[0] + " -j ACCEPT\n";
  }
}

module.exports = Peer;