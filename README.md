# Linux Mint Gnome
Who needs a description? Everything is in the title!

This distribution embed 'Dash to Panel', 'Dash to Dock' and others Gnome extensions.
On first login, you can choose between a 'panel style' (Windows like), a 'dock style' (MacOS like) or a 'dash style' (Gnome default).
You also choose to display desktop icons or not, and use a light or a dark theme (everything can be changed later in 'Customization').

I'm not afiliated with Linux Mint, this is a "fan-made" distribution without any pretension.

## Screenshots

*Click on one of the three styles below (PANEL / DOCK / DASH), or check the **[INTERACTIVE TOUR](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/tour.md)***

[![Panel style](btn/panel.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/panel.md)
[![Dock style](btn/dock.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dock.md)
[![Dash style](btn/dash.png)](https://github.com/pl453s/linux-mint-gnome/blob/main/tour/dash.md)

## Test / Install with a LiveCD

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation**  
**WARNING: Updates has not been tested yet, you are warned, be very careful and know what you do**
- Download the ISO: https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/lmg.iso
- Burn-it on a disk, or flash-it on an USB flash drive, or just insert-it in a virtual machine
- Boot your disk or your USB flash drive, and you can test or install the distribution

*In a live session, the welcome screen doesn't allows you to hide desktop icons, it's to keep access to 'Install Linux Mint' and 'Boot-repair' on the desktop.
The desktop icons configuration appears once Linux Mint is installed.*

*For now, to change the desktop style after the welcome screen passed, go to 'Customization' > 'Extensions' and enable/disable the corresponding extensions.
Do not enable at the same time 'Dash to Panel' and 'Dash to Dock'.*

*For some reason, the keyboard layout may be incorrect with Firefox and Thunderbird.
To avoid this, select a layout without variant at the installation, or actualize the layout in 'Settings' (remove and add the layout again).*

*The user folders names localisation is intentionally disabled.
A section to change these names is planned in the 'Customization' tool, as well as a section to customize the application grid (change names, icons, hide...).*

**NEW --> Until 'Customization' is developed, I created a set of basic tools to more easily customize GDM3:**
```bash
wget https://raw.githubusercontent.com/pl453s/linux-mint-gnome/main/gdm3/gdm3-patch.sh
wget https://raw.githubusercontent.com/pl453s/linux-mint-gnome/main/gdm3/gdm3-reset.sh
wget https://raw.githubusercontent.com/pl453s/linux-mint-gnome/main/gdm3/gdm3-tweak.sh
# Now, run for example:
bash gdm3-patch /usr/share/themes/Materia-dark gnome-shell.css
# If a theme is incompatible and makes crash GDM3, login to another TTY and run:
bash gdm3-reset
```

## Migrate from an official edition

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation**  
**WARNING: I strongly recommand to NOT migrate from a live session, reboot when asked**
- Get the ISO of any edition of Linux Mint 20: https://linuxmint.com/release.php?id=38
- Use this ISO to install Mint on a computer or a virtual machine
- Download the lastest release packages and scripts
```bash
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/mint-gnome-core.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/mint-info-gnome.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/gnome-customization.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/plymouth-theme-mint.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/papirus-cursor-theme.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/libreoffice-style-papirus.deb
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/script_install_1.sh
wget https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/script_install_2.sh
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

- mint-gnome-core: Welcome screen, Gnome extensions, .desktop files, default schemas and default user folder
- mint-info-gnome: Necessary information about the Linux Mint release and edition (here Gnome)
- gnome-customization: 'gnome-tweaks', only better (customize Gnome, QT5, GDM3, Plymouth and Grub)
- plymouth-theme-mint: Spinner boot screen which support UEFI manufacturer logo (BGRT)
- papirus-cursor-theme: Cursors from 'Paper' icon theme
- libreoffice-style-papirus: LibreOffice 'Papirus' style icon pack
- mint-themes: Delete Mint themes without breaking 'mint-arkwork'
- mint-x-icons: Delete Mint-X icons without breaking 'mint-arkwork'
- mint-y-icons: Delete Mint-Y icons without breaking 'mint-arkwork'

## Remaining work

- Publish gdm3-tools and rework GDM3 screenshot
- Develop the welcome screen and 'gnome-customization' (these are just Zenity boxs for now)
- 'Customization' features: Gnome, GDM3, Plymouth, Grub, App-grid, User folders names, QT5
- Host and maintain the new packages somewhere (in a repository, a PPA or just in Git... IDK)
- PUBLISH A NEW ISO FILE

## Credits

- 'Dash to Panel extension' created by 'jderose9' --> https://github.com/home-sweet-gnome/dash-to-panel
- 'Dash to Dock extension' created by 'micheleg' --> https://github.com/micheleg/dash-to-dock/
- 'Papirus icon theme' created by 'varlesh' --> https://github.com/PapirusDevelopmentTeam/papirus-icon-theme
- 'Paper icon theme' created by 'snwh' --> https://github.com/snwh/paper-icon-theme
- 'Materia GTK theme' created by 'nana-4' --> https://github.com/nana-4/materia-theme
