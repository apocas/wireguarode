# Wireguarode

Wireguarode is a Node.js-based tool designed manage and deploy Wireguar installation supporting ACLs and 2FA (TOTP) peer authentication.
It works with a main JSON file as input, allowing to allocate peers to groups, manage ACLs, and enable 2FA TOTP authentication.
Wireguarode can be used both as a library and a CLI tool, offering flexibility and seamless integration into your existing workflow.

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

## Usage

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

### As a CLI tool

To use Wireguarode as a CLI tool, simply provide the path to your JSON configuration file as an argument:

```bash
wireguarode --help
```

#### CLI Commands

Wireguarode supports several CLI commands for different operations. Examples of available commands include:

- `save`: Save the configuration file to a specified optional path.
- `generate`: Generate Wireguard configuration files and save them to a specified path.
- `expire`: Expire peers based on the maximum minutes since their last login (default: 24 hours).

Group Commands:

- `add`: Add a new group.
- `remove`: Remove an existing group.
- `adddestination`: Add a destination (IP, port, and protocol) to an existing group.
- `removedestination`: Remove a destination (IP, port, and protocol) from an existing group.

Peer Commands:

- `activate`: Activate a peer using a TOTP code.
- `deactivate`: Deactivate a peer.
- `secret`: Activate 2FA for a peer.

To use a command, pass it as an argument followed by the configuration file:

```bash
wireguarode <command> [arguments]
```

## Configuration

Wireguarode uses a JSON file for its configuration. Here's an example configuration:

```json
{
  "path": "./output",
  "debug": true,
  "private_key": "XXXXXXXXXX",
  "listen_port": 12345,
  "enforce2fa": false,
  "addresses": [
    "192.168.1.1"
  ],
  "interfaces": [
    "eth0",
    "eth1"
  ],
  "groups": [
    {
      "name": "admin",
      "destinations": [
        {
          "destination": "192.168.1.1",
          "port": "80",
          "protocol": "tcp"
        }
      ]
    },
    {
      "name": "xpto",
      "destinations": [
        {
          "destination": "192.168.1.2",
          "port": "22",
          "protocol": "tcp"
        }
      ]
    }
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
  ]
}
```