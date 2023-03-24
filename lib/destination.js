class Destination {
  constructor(destination) {
    var aux = this.parse(destination);
    this.destination = aux.destination;
    this.url = aux.url
    this.address = aux.address;
    this.port = aux.port;
    this.protocol = aux.port;
  }

  parse(destination) {
    var urlaux = new URL(destination);
    var output = {
      'destination': destination,
      'url': urlaux,
      'address': urlaux.hostname,
      'port': urlaux.port,
      'protocol': urlaux.protocol.replace(':', '')
    }
    return output
  }

  toString() {
    return this.url.href;
  }
}

module.exports = Destination;