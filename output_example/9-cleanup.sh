#!/bin/sh

iptables -D INPUT   -i wg0 -j wireguarode
iptables -D FORWARD -i wg0 -j wireguarode
iptables -D FORWARD -o wg0 -j wireguarode
iptables -D OUTPUT  -o wg0 -j wireguarode
iptables -F wireguarode
iptables -F admin
iptables -X admin
iptables -F admin2
iptables -X admin2
iptables -F xpto
iptables -X xpto
iptables -F wireguarode
iptables -X wireguarode
