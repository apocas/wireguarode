# Wireguarode

* Wireguarode allows to easily manage a Wireguard installation with ACLs and 2FA (TOTP) peer authentication.
* It works with a main JSON file as input/config, allowing to allocate peers to groups, manage ACLs, and enable 2FA TOTP authentication.
* Wireguarode can be used both as a library and a CLI tool.
* Leverages `iptables` to acomplish all this.

## Features

- Accepts JSON configuration file
- Group-based peer allocation
- Access Control Lists (ACL) management
- Two-Factor Authentication (2FA) with Time-based One-Time Password (TOTP)
- Library and CLI usage

## Installation

To install Wireguarode, run the following command:

```bash
npm install -g wireguarode
```

You need to have Wireguard already installed, `wireguarode` defaults to `/etc/wireguard/...` but it's possible to specify a different path.

## Usage

### As a CLI tool

To use Wireguarode as a CLI tool, simply provide the path to your JSON configuration file as an argument:

```bash
wireguarode --help
wireguarode group --help
wireguarode peer --help
```

### 2FA

```bash
wireguarode peer secret john.doe1@rainbow

Secret generated: otpauth://totp/wireguarode:john.doe1%40rainbow?secret=XXXXXXXXXXXX&period=30&digits=6&algorithm=SHA1&issuer=wireguarode
```

#### CLI Commands

Wireguarode supports several CLI commands for different operations:

- `save`: Save the configuration file to a specified optional path.
- `generate`: Generate Wireguard configuration files and save them to a specified path.

Group Commands:

- `add`: Add a new group.
- `remove`: Remove an existing group.
- `adddestination`: Add a destination (IP, port, and protocol) to an existing group.
- `removedestination`: Remove a destination (IP, port, and protocol) from an existing group.

Peer Commands:

- `activate`: Activate a peer using a TOTP code.
- `deactivate`: Deactivate a peer.
- `secret`: Activate 2FA for a peer.
- `expire`: Expire peers based on the maximum minutes since their last login (default: 24 hours).
- `add`: Add a new peer.

To use a command, pass it as an argument followed by the configuration file:

```bash
wireguarode <command> [arguments]
```

#### Example use case

* Create two groups of peers one called "operator" that can only access a specific IP address and port and an unrestricted one called "god".
* Add a new peer that belongs to the operator group.

```bash
wireguarode group add operator
wireguarode group adddestination operator tcp://192.168.1.10:443
wireguarode group adddestination operator tcp://192.168.1.10:22
wireguarode group add god
wireguarode peer add --identifier john.doe2@rainbow --key XXXXXXX --address 10.15.12.4 --group operator
wireguarode reload
```

### As a library

To use Wireguarode as a library, first install it as a dependency in your project:

```bash
npm install wireguarode
```

Then, you can import and use it in your project:

```javascript
const wireguarode = require('wireguarode');

// Load your WireGuard configuration JSON
const config = require('./path/to/your/config.json');

// Instantiate Wireguarode 
var wireguard = new Wireguard();
wireguard.loadConfig(config);
```

## Configuration

* Wireguarode uses a JSON file for its configuration.
* The following configuration will automatically generate the files that are in the `output_example` folder.

```json
{
  "addresses": [
    "192.168.1.1"
  ],
  "enforce2fa": false,
  "debug": true,
  "path": "/etc/wireguard",
  "private_key": "XXXXXXXXXX",
  "listen_port": 12345,
  "interfaces": [
    "eth0",
    "eth1"
  ],
  "peers": [
    {
      "identifier": "john.doe1@rainbow",
      "addresses": [
        "192.168.20.1"
      ],
      "public_key": "YYYYYYYYYY",
      "group": "xpto"
    },
    {
      "identifier": "john.doe2@rainbow",
      "addresses": [
        "192.168.20.3"
      ],
      "public_key": "HHHHHHHHHHH",
      "group": "admin"
    }
  ],
  "groups": [
    {
      "name": "admin",
      "destinations": [
        "tcp://192.168.1.1:80",
        "tcp://192.168.1.1:443"
      ]
    },
    {
      "name": "admin2",
      "destinations": [
        "tcp://192.168.1.10:443",
        "tcp://192.168.1.2:22",
        "tcp://192.168.1.4:22"
      ]
    },
    {
      "name": "xpto",
      "destinations": [
        "tcp://192.168.1.2:22"
      ]
    }
  ]
}
```