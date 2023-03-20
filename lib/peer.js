class Peer {
  constructor(name, ips, public_key, group, twofa) {
    this.ips = ips;
    this.public_key = public_key;
    this.name = name;
    this.group = group;
    this.active = !twofa;
  }

  generateConf() {
    var output = "[Peer]\n";

    output += "# " + this.name + "\n";
    output += "PublicKey = " + this.public_key + "\n";
    output += "AllowedIPs = " + this.ips.join(", ") + "\n";
    output += "PersistentKeepalive = 30\n";

    return output;
  }

  generateAcl() {
    var output = "";
    output += "# " + this.name + "\n";
    output += "iptables -A " + this.group + " -s " + this.ips[0] + " -j ACCEPT\n"
    return output;
  }
}

module.exports = Peer;