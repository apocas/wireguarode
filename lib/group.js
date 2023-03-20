class Group {
  constructor(name) {
    this.name = name;
    this.pairs = [];
  }

  generateConf() {
    var output = "";
    for (var i = 0; i < this.pairs.length; i++) {
      output += "iptables -A wireguard_wg0 -d " + this.pairs[i].ip + " -p tcp --dport " + this.pairs[i].port + " -j " + this.name + "\n";
      output += "iptables -A wireguard_wg0 -d " + this.pairs[i].ip + " -p icmp -j " + this.name + "\n";
    }

    return output;
  }
}

module.exports = Group;