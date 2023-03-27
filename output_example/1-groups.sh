#!/bin/sh

# admin
iptables -A wireguarode -d tcp://192.168.1.1:80 -p 80 --dport 80 -j admin
iptables -A wireguarode -d tcp://192.168.1.1:80 -p icmp -j admin
iptables -A wireguarode -d tcp://192.168.1.1:443 -p 443 --dport 443 -j admin
iptables -A wireguarode -d tcp://192.168.1.1:443 -p icmp -j admin
# admin2
iptables -A wireguarode -d tcp://192.168.1.10:443 -p 443 --dport 443 -j admin2
iptables -A wireguarode -d tcp://192.168.1.10:443 -p icmp -j admin2
iptables -A wireguarode -d tcp://192.168.1.2:22 -p 22 --dport 22 -j admin2
iptables -A wireguarode -d tcp://192.168.1.2:22 -p icmp -j admin2
iptables -A wireguarode -d tcp://192.168.1.4:22 -p 22 --dport 22 -j admin2
iptables -A wireguarode -d tcp://192.168.1.4:22 -p icmp -j admin2
# xpto
iptables -A wireguarode -d tcp://192.168.1.2:22 -p 22 --dport 22 -j xpto
iptables -A wireguarode -d tcp://192.168.1.2:22 -p icmp -j xpto
