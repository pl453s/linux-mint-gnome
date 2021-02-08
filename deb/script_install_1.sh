#!/bin/bash

cd "$(dirname "$0")"

sudo apt update

sudo gdebi gnome-customization.deb
sudo gdebi libreoffice-style-papirus.deb
sudo gdebi papirus-cursor-theme.deb
sudo gdebi plymouth-theme-mint.deb

sudo gdebi mint-info-gnome.deb
sudo apt purge mint-info-cinnamon mint-info-mate mint-info-xfce
sudo gdebi mint-gnome-core.deb

clear
echo DONE
echo PLEASE REBOOT YOUR COMPUTER
