# Linux Mint Gnome
Who needs a description? Everything is in the title!

This distribution embed 'dash-to-panel', 'dash-to-dock' and others Gnome extensions.
On first login, you can choose between a 'panel style' (Windows like), a 'dock style' (MacOS like) or a 'dash style' (Gnome default).
You also choose to display desktop icons or not, and use a light or a dark theme (everything can be changed later in 'Customization').

I'm not afiliated with Linux Mint, this is a "fan-made" distribution without any pretension.

## Screenshots

**NEW --> [INTERACTIVE TOUR](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/tour.md)**

*Click on one of the three styles below ( PANEL / DOCK / DASH )*

[![Panel style](btn/panel.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/panel.md)
[![Dock style](btn/dock.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dock.md)
[![Dash style](btn/dash.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dash.md)

## Test / Install with a LiveCD

*A 'Linux Mint 20 Gnome 64-bit' autonomous LiveCD ISO file should be available soon...*  
*A working ISO has already been created, but as it takes about 2Go, I prefer tweaking it before uploading it.*  
*Meanwhile, you can migrate to Linux Mint Gnome from an official Linux Mint edition.*

## Migrate from an official edition

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation**  
**WARNING: I strongly recommand to NOT migrate from a live session, reboot when asked**
- Get the ISO of any edition of Linux Mint 20 https://linuxmint.com/release.php?id=38
- Use this ISO to install Mint on a computer or a virtual machine
- Download the lastest release packages and scripts
```bash
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/mint-gnome-desktop.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/mint-gnome-core.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/mint-info-gnome.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/gnome-customization.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/plymouth-theme-mint.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/papirus-cursor-theme.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/libreoffice-style-papirus.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/script_install_1.sh
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.2-mint20/script_install_2.sh
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
- gnome-customization: 'gnome-tweaks', only better (customize Gnome, QT5, GDM3, Plymouth and Grub)
- plymouth-theme-mint: Spinner boot screen which support UEFI manufacturer logo (BGRT)
- papirus-cursor-theme: I did not do anything, those are the cursors from snwh's 'Paper' icon theme
- libreoffice-style-papirus: The same, this package is just not available without a PPA

## Remaining work

- 'System Tools' app-folder translation + 'Customization' .desktop translation + Fix autostart (mkdir -p)
- Tap to click + right click + enabled extensions + gnome-shell theme + gnome-terminal cursor
- Default new users '/etc/skel' (XDG dirs, Templates folder, Firefox, Thunderbird, LibreOffice)
- ISO: Update squashfs with updated initramfs --> TEST AND PUBLISH THE .ISO FILE
- Host the new packages somewhere (eventualy in a repository, a PPA or just in Git... IDK)
- Make GDM3 themable (GDM3 crashes when I link 'gdm3-theme.gresource' with a third-party theme)
- Screenshots: Rework the GDM3 screenshot (show password entry) and the 3 screenshots buttons
- Develop the welcome screen and 'gnome-customization' (for now, these are just Zenity boxes)
