var Destination = require('./destination');

class Group {
  constructor(name) {
    this.name = name;
    this.destinations = [];
  }

  addDestination(destination) {
    if (this.findDestination(destination)) {
      return false;
    }
    this.destinations.push(new Destination(destination));
    return true;
  }

  removeDestination(destination) {
    for (var i = 0; i < this.destinations.length; i++) {
      if (this.destinations[i].destination == destination) {
        this.destinations.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  findDestination(destination) {
    for (var i = 0; i < this.destinations.length; i++) {
      if (this.destinations[i].destination == destination) {
        return this.destinations[i].destination;
      }
    }
    return null;
  }

  generateConf() {
    var output = "";

    for (var i = 0; i < this.destinations.length; i++) {
      output += "iptables -A wireguarode -d " + this.destinations[i].address + " -p " + (this.destinations[i].protocol || "tcp") + " --dport " + this.destinations[i].port + " -j " + this.name + "\n";
      output += "iptables -A wireguarode -d " + this.destinations[i].address + " -p icmp -j " + this.name + "\n";
    }

    return output;
  }
}

module.exports = Group;