var config = require('../config');

var Wireguard = require('../lib/wireguard');
var Peer = require('../lib/peer');

describe('Wireguard', function () {
  var wireguard = new Wireguard(config.ips, config.private_key, config.listen_port, config.interfaces);

  for (var i = 0; i < config.peers.length; i++) {
    wireguard.peers.push(new Peer(config.peers[i].name, config.peers[i].ips, config.peers[i].public_key, config.peers[i].acl));
  }

  describe('#generateConf()', function () {
    it('should generate a valid wireguard configuration', function (done) {
      var conf = wireguard.generateConf();

      console.log(conf);
      done();
    });

    it('should load directly from conf file', function (done) {
      wireguard.loadConfig(config);
      done();
    });
  });

  describe('#generateFiles()', function () {
    it('should generate a valid wireguard configuration', function (done) {
      wireguard.generateFiles('./output');
      done();
    });
  });
});