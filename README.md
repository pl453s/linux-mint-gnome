# Linux Mint Gnome
Who needs a description? Everything is in the title!

I'm not afiliated with Linux Mint, this is a "fan-made" distribution without any pretension.

For now, it's just a Linux Mint 20 Cinnamon virtual machine with some extra packages (and a few packages less).

## Screenshots

### Plymouth boot screen

<img src="https://github.com/pl453s/linux-mint-gnome/blob/main/1_boot.png" align="left"/>~~~~~~~~~~

### GDM3 login screen

<img src="https://github.com/pl453s/linux-mint-gnome/blob/main/2_gdm3.png" align="left"/>~~~~~~~~~~

### Gnome-shell desktop

<img src="https://github.com/pl453s/linux-mint-gnome/blob/main/3_desktop.png" align="left"/>~~~~~~~~~~

### Nautilus file manager

<img src="https://github.com/pl453s/linux-mint-gnome/blob/main/4_nautilus.png" align="left"/>~~~~~~~~~~

### Gnome-shell app grid

<img src="https://github.com/pl453s/linux-mint-gnome/blob/main/5_apps.png" align="left"/>~~~~~~~~~~

## New packages

The packages I've made are not in the Ubuntu repository:
- mint-gnome: The distribution base package (welcome screen, Gnome extensions and .desktop files)
- gnome-customization: 'gnome-tweaks', only better (customize gnome, themes, extensions, qt5, gdm, plymouth and grub)
- mint-wallpapers: It contains the sames wallpapers as Linux Mint ones, it's just to avoid the heavy 'mint-artwork'
- plymouth-theme-mint: Boot screen wich support UEFI manufacturer logo (BGRT), based on and requires 'plymouth-theme-spinner'
- papirus-cursor-theme: I did not do anything, those are the cursors from snwh's "Paper" icon theme
- libreoffice-style-papirus: The same, this package is just not available without a PPA

## Remaining work

- Make this distribution available (I can't just upload a 8Go .img or .vdi file, so there is nothing in this git for now)
- Create a default configuration for new users (Templates folder, Gnome, Firefox, Thunderbird, LibreOffice, Nautilus, Gedit...)
- Publish these new .deb files (eventualy in a repository, a PPA or just in Git... I don't know)
- Create an autonomous LiveCD ISO (at this stage I would have already made good progress)
- Make the GDM3 login screen themable (for now, GDM3 crashes when I link 'gdm3-theme.gresource' with a third party gnome-shell theme)
- Develop the welcome screen and develop 'gnome-customization' (for now, these are just Zenity info boxes)
