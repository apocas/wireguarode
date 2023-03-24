const { expect } = require('chai');
var QRCode = require('qrcode');
var config = require('./config');

var Wireguard = require('../lib/wireguard');
const { assert } = require('console');

describe('Wireguard', function () {
  var wireguard = new Wireguard();

  describe('Config management', function () {
    it('should load directly from conf file', function (done) {
      wireguard.loadConfig(config);
      done();

      /*
      var peer = wireguard.peers[0];
      var urlt = wireguard.generate2FA(peer);
      console.log(urlt);

      QRCode.toFile('./output/qrcode.png', urlt, function (err) {
        if (err) throw err
        done();
      })
      */
    });

    it('should generate a valid wireguard configuration', function (done) {
      var conf = wireguard.generateConf();
      expect(conf).ok;
      done();
    });

    it('should generate a valid wireguard configuration', function (done) {
      wireguard.saveConfig('./output');
      done();
    });

    it('should load previously saved configuration file', function (done) {
      var configaux = require('../output/config');
      wireguard.loadConfig(configaux);
      done();
    });
  });

  describe('Files management', function () {
    it('should generate a valid wireguard configuration', function (done) {
      wireguard.generateFiles('./output');
      done();
    });
  });

  describe('Group', function () {
    it('should add a new group', function (done) {
      var added = wireguard.addGroup({ 'name': 'testgroup' });
      expect(added).true;
      var group = wireguard.findGroup('testgroup');
      expect(group).ok;
      done();
    });

    it('should fail add a already existing group', function (done) {
      var added = wireguard.addGroup({ 'name': 'testgroup' });
      expect(added).false;
      done();
    });

    it('should remove a group', function (done) {
      wireguard.removeGroup('testgroup');
      done();
    });

    it('should not remove a group with peers', function (done) {
      wireguard.addGroup({ 'name': 'testgroup' });
      wireguard.addPeer('testpeer', 'testgroup');
      var removed = wireguard.removeGroup('testgroup');
      expect(removed).false;
      done();
    });

    it('should add a destination', function(done) {
      var group = wireguard.findGroup('testgroup');
      expect(group).ok;
      var added = group.addDestination('tcp://192.168.1.4:22');
      expect(added).true;
      done();
    });

    it('shouldnt add an already existing destination', function(done) {
      var group = wireguard.findGroup('testgroup');
      expect(group).ok;
      var added = group.addDestination('tcp://192.168.1.4:22');
      expect(added).false;
      done();
    });
  });


  describe('Peer', function () {
    it('should add a new peer', function (done) {
      var aux = {
        "identifier": "john.doe3@rainbow",
        "addresses": [
          "192.168.20.3",
          "192.168.20.4"
        ],
        "public_key": "YYYYYYYYYY",
        "group": "xpto"
      };
      var added = wireguard.addPeer(aux);
      expect(added).true;
      done();
    });

    it('should not add an existing peer', function (done) {
      var aux = {
        "identifier": "john.doe3@rainbow",
        "addresses": [
          "192.168.20.3",
          "192.168.20.4"
        ],
        "public_key": "YYYYYYYYYY",
        "group": "xpto"
      };
      var added = wireguard.addPeer(aux);
      expect(added).false;
      done();
    });

    it('should not add a peer refering nonexistent group', function (done) {
      var aux = {
        "identifier": "john.doe4@rainbow",
        "addresses": [
          "192.168.20.3",
          "192.168.20.4"
        ],
        "public_key": "YYYYYYYYYY",
        "group": "idontexist"
      };
      var added = wireguard.addPeer(aux);
      expect(added).false;
      done();
    });

    it('should remove a peer', function (done) {
      var removed = wireguard.removePeer("john.doe3@rainbow")
      expect(removed).true;
      done();
    });
  });

});