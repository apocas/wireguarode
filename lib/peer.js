class Peer {
  constructor(identifier, ips, public_key, group, secret) {
    this.ips = ips;
    this.public_key = public_key;
    this.identifier = identifier;
    this.group = group;
    this.secret = secret;
    if (secret) {
      this.active = false;
    } else {
      this.active = true;
    }
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
}

module.exports = Peer;