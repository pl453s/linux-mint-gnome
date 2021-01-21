# Linux Mint Gnome
Who needs a description? Everything is in the title!

This distribution embed 'dash-to-panel', 'dash-to-dock' and others Gnome extensions.
On first login, you can choose between a 'panel style' (Windows like), a 'dock style' (MacOS like) or a 'dash style' (Gnome default).
You also choose to display desktop icons or not, and use a light or a dark theme (everything can be changed later in 'Customization').

I'm not afiliated with Linux Mint, this is a "fan-made" distribution without any pretension.

## Screenshots

**NEW --> [INTERACTIVE TOUR](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/tour.md)**

*Click on one of the three styles below ( PANEL / DOCK / DASH )*

[![Panel style](img/panel.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/panel.md)
[![Dock style](img/dock.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dock.md)
[![Dash style](img/dash.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dash.md)

## Installation

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation.**  
**WARNING: I strongly recommand to NOT migrate from a live session, install Mint permanently.**  
**WARNING: I'm not sure it fully works from Mate and XFCE. Prefer Cinnamon if possible.**  
- Get the ISO of any edition of Linux Mint 20 https://linuxmint.com/release.php?id=38
- Use this ISO to install Mint on a computer or a virtual machine
- Download the lastest release packages and scripts
```bash
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/mint-gnome-desktop.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/mint-gnome-core.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/mint-info-gnome.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/gnome-customization.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/plymouth-theme-mint.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/papirus-cursor-theme.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/libreoffice-style-papirus.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/script_install_1.sh
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.1-mint20/script_install_2.sh
```
- On the Mint installed machine, open a terminal (be sure to have an Internet connection on your machine)
```bash
bash /path/to/script_install_1.sh # Confirm every installation and select 'gdm3' instead of 'lightdm'
reboot
```
- You should now get the GDM3 login screen, log in and re-open a terminal
```bash
bash /path/to/script_install_2.sh # Confirm uninstallation
reboot
```
- Log in again, and enjoy!

## New packages

- mint-gnome-desktop: A package which migrate to Linux Mint Gnome from any official edition of Mint 20
- mint-gnome-core: The distribution base package (welcome screen, Gnome extensions and .desktop files)
- mint-info-gnome: Necessary information about the Linux Mint release and edition (here Gnome)
- gnome-customization: 'gnome-tweaks', only better (customize Gnome, themes, extensions, QT5, GDM3, Plymouth and Grub)
- plymouth-theme-mint: Boot screen which support UEFI manufacturer logo (BGRT), based on and requires 'plymouth-theme-spinner'
- papirus-cursor-theme: I did not do anything, those are the cursors from snwh's 'Paper' icon theme
- libreoffice-style-papirus: The same, this package is just not available without a PPA

## Remaining work

- Add 'gnome-screensaver' (do not uninstall 'gnome-power-manager' --> hide it from app-grid ?
- Gnome Terminal change defaut blinking cursor + Uninstall Yelp in 'script_installation_2.sh')
- Check migration fully works from Mate and XFCE (and remove comments on 'script_install_2.sh')
- Create a default configuration for new users (Templates folder, Gnome, Firefox, Thunderbird, LibreOffice, Nautilus, Gedit...)
- Host the new packages somewhere (eventualy in a repository, a PPA or just in Git... I don't know)
- LiveCD: Begin to develop the welcome screen (select keyboard layout and choose between test or install the distribution)
- LiveCD: Put 'boot-repair' (with 'mx-boot-repair' Papirus icon) and 'ubiquity' on the desktop for and block 'hide desktop icons'
- Create an autonomous LiveCD ISO (at this stage I would have already made good progress)
- Make the GDM3 login screen themable (for now, GDM3 crashes when I link 'gdm3-theme.gresource' with a third party gnome-shell theme)
- Screenshots: Rework gdm3 screenshot and the 3 screenshots buttons
- Develop the welcome screen and develop 'gnome-customization' (for now, these are just Zenity info boxes)
