const { expect } = require('chai');
var QRCode = require('qrcode');
var config = require('./config');

var Wireguard = require('../lib/wireguard');

describe('Wireguard', function () {
  var wireguard = new Wireguard();

  describe('#generateConf()', function () {
    it('should load directly from conf file', function (done) {
      wireguard.loadConfig(config);

      var peer = wireguard.peers[0];
      var urlt = wireguard.generateQRcode(peer);
      console.log(urlt);

      QRCode.toFile('./output/qrcode.png', urlt, function (err) {
        if (err) throw err
        done();
      })
    });

    it('should generate a valid wireguard configuration', function (done) {
      var conf = wireguard.generateConf();

      expect(conf).ok;

      done();
    });
  });

  describe('#generateFiles()', function () {
    it('should generate a valid wireguard configuration', function (done) {
      wireguard.generateFiles('./output');
      done();
    });

    it('should save configuration file', function (done) {
      wireguard.saveConfig('./output');
      done();
    });

    it('should load previously save configuration file', function (done) {
      wireguard.loadConfig(require('./config.json'));
      var conf = wireguard.generateConf();
      expect(conf).ok;
      done();
    });
  });
});