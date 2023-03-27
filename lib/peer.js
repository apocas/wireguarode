var otplib = require('otplib')
var Tools = require('./tools')

class Peer {
  constructor(config, enforce2fa) {
    this.addresses = config.addresses;
    this.public_key = config.public_key;
    this.identifier = config.identifier;
    this.group = config.group;
    this.secret = config.secret;

    this.active = false;

    if (!enforce2fa && !this.secret) {
      this.active = true;
    }

    this.lastlogin = config.lastlogin;
  }

  generateConf() {
    var output = "[Peer]\n";

    output += "# " + this.identifier + "\n";
    output += "PublicKey = " + this.public_key + "\n";
    output += "AllowedIPs = " + this.addresses.join(", ") + "\n";
    output += "PersistentKeepalive = 30\n";

    return output;
  }

  allow() {
    return "iptables -A " + this.group + " -s " + this.addresses[0] + " -j ACCEPT\n";
  }

  deny() {
    this.active = false;
    return "iptables -D " + this.group + " -s " + this.addresses[0] + " -j ACCEPT\n";
  }

  generate2FA() {
    if (!this.secret) {
      this.secret = otplib.authenticator.generateSecret();
    }
    return otplib.authenticator.keyuri(this.identifier, 'wireguarode', this.secret);
  }

  activate(code) {
    if (otplib.authenticator.check(code, this.secret)) {
      this.active = true;
      this.lastlogin = new Date().getTime() / 1000;
      Tools.execute(this.allow());
      return true;
    } else {
      return false;
    }
  }

  deactivate() {
    Tools.execute(this.deny());
  }
}

module.exports = Peer;