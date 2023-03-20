class Group {
  constructor(name) {
    this.name = name;
    this.pairs = [];
  }

  generateConf() {
    var output = "";
    for (var i = 0; i < this.pairs.length; i++) {
      output += "iptables -A wireguarode -d " + this.pairs[i].destination + " -p tcp --dport " + this.pairs[i].port + " -j " + this.name + "\n";
      output += "iptables -A wireguarode -d " + this.pairs[i].destination + " -p icmp -j " + this.name + "\n";
    }

    return output;
  }
}

module.exports = Group;