const { expect } = require('chai');
var config = require('../config');

var Wireguard = require('../lib/wireguard');

describe('Wireguard', function () {
  var wireguard = new Wireguard();

  describe('#generateConf()', function () {
    it('should load directly from conf file', function (done) {
      wireguard.loadConfig(config);
      done();
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
  });
});