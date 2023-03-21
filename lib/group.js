class Group {
  constructor(name) {
    this.name = name;
    this.destinations = [];
  }

  addDestination(destination, port, protocol) {
    this.destinations.push({
      destination: destination,
      port: port,
      protocol: protocol
    });
  }

  removeDestination(destination, port, protocol) {
    for (var i = 0; i < this.destinations.length; i++) {
      if (this.destinations[i].destination == destination && this.destinations[i].port == port && this.destinations[i].protocol == protocol) {
        this.destinations.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  generateConf() {
    var output = "";

    for (var i = 0; i < this.destinations.length; i++) {
      output += "iptables -A wireguarode -d " + this.destinations[i].destination + " -p " + (this.destinations[i].protocol || "tcp") + " --dport " + this.destinations[i].port + " -j " + this.name + "\n";
      output += "iptables -A wireguarode -d " + this.destinations[i].destination + " -p icmp -j " + this.name + "\n";
    }

    return output;
  }
}

module.exports = Group;