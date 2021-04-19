# Linux Mint Gnome

Who needs a description? Everything is in the title!

This distribution embeds 'Dash to Panel', 'Dash to Dock' and other Gnome extensions.
On first login, you can choose between a 'panel style' (Windows-like), a 'dock style' (macOS-like) or a 'dash style' (Gnome's defaults), whether or not to display desktop icons, and to opt for a light or a dark theme (everything can be changed later in 'Customization').

**Visual overview of this distribution: [https://github.com/pl453s/linux-mint-gnome/blob/main/github/tour.md](https://github.com/pl453s/linux-mint-gnome/blob/main/github/tour.md)**

*Also, some forks of the Materia Gnome Shell theme are availables for Gnome 3.36.x:*  
*The Materia theme with some fixes: app folders, low resolutions and on screen keyboard*  
*The same, but with the Adapta colors, because the original one doesn't work on Gnome 3.36*

## Installation (1.6)

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation.**  
**WARNING: Updates has not been tested yet, you are warned, be very careful and know what you do.**

- Download the ISO: [https://github.com/pl453s/linux-mint-gnome/releases/download/ISO-v1.6-mint20/lmg.iso](https://github.com/pl453s/linux-mint-gnome/releases/download/ISO-v1.6-mint20/lmg.iso)
- Burn it on a disk, or flash it on an USB flash drive, or just insert it in a virtual machine
- Boot your disk or your USB flash drive, and test or install the distribution

<br>

**You can also migrate from an official Mint edition installation or upgrade your Mint Gnome installation:**  
**WARNING: Some symlinks are missing to avoid breaking GitHub Pages ; refer to the 'symlinks' file**

Mint Gnome development has become too complex to support scripted migration from official Mint editions.  
Now, the DEB files will be released "as is", use them to migrate by yourself or to upgrade your Mint Gnome installation.  
A separate ISO file will be published, once at a time, each time the project has evolved enough and is stable enough.

Latest release (1.7): [https://github.com/pl453s/linux-mint-gnome/releases/tag/v1.7-mint20](https://github.com/pl453s/linux-mint-gnome/releases/tag/v1.7-mint20)

## Project packages

- mint-gnome-core: Mint Gnome session, various adjustments, default schemas and default user folder
- mint-gnome-control-center: 'Settings' application with some fixes (remove Appearance + Whoopsie)
- mint-gnome-control-center-data: 'Settings' application data with some fixes (use Linux Mint logo icon)
- mint-gnome-extensions : 'Dash to Panel', 'Dash to Dock', 'Desktop Icons NG' and 'Top Indicator App'
- mint-gnome-theme: 'Materia' theme with some fixes (app folder and on screen keyboard)
- mint-gnome-welcome: First login Python GTK welcome screen (change style, desktop and theme)
- gnome-customization: 'Gnome Tweaks', only better (customize Gnome, Qt5, GDM3, Plymouth and Grub)
- plymouth-theme-mint: Spinner boot screen which supports UEFI manufacturer logo (BGRT)
- papirus-cursor-theme: Cursors from 'Paper' icon theme
- libreoffice-style-papirus: LibreOffice 'Papirus' style icon pack
- mint-info-gnome: Necessary information about the Linux Mint release and edition (here Gnome)

## Remaining work

- Gnome Customization: Check english
- Desktop Icons: Improve localization
- PUBLISH A NEW ISO FILE
- Nautilus extension: Folder color switch
- Nautilus extension: Fix "Paste Into Folder" bug
- Nautilus extension: Open terminal (only background)
- Nautilus extension: Open as administrator
- Develop Gnome Customization
- ISO full test + Test installing updates
- PUBLISH A NEW ISO FILE

## Credits

- 'Linux Mint' developed by the 'Linux Mint Team' --> [https://github.com/linuxmint](https://github.com/linuxmint)
- 'Top Indicator extension' forked by 'quiro9' --> [https://github.com/ubuntu/gnome-shell-extension-appindicator](https://github.com/ubuntu/gnome-shell-extension-appindicator)
- 'Desktop Icons NG extension' created by 'rastersoft' --> [https://gitlab.com/rastersoft/desktop-icons-ng](https://gitlab.com/rastersoft/desktop-icons-ng)
- 'Dash to Panel extension' created by 'jderose9' --> [https://github.com/home-sweet-gnome/dash-to-panel](https://github.com/home-sweet-gnome/dash-to-panel)
- 'Dash to Dock extension' created by 'micheleg' --> [https://github.com/micheleg/dash-to-dock](https://github.com/micheleg/dash-to-dock)
- 'Papirus icon theme' created by 'varlesh' --> [https://github.com/PapirusDevelopmentTeam/papirus-icon-theme](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme)
- 'Paper icon theme' created by 'snwh' --> [https://github.com/snwh/paper-icon-theme](https://github.com/snwh/paper-icon-theme)
- 'Materia GTK theme' created by 'nana-4' --> [https://github.com/nana-4/materia-theme](https://github.com/nana-4/materia-theme)
- 'Adapta GTK theme' created by 'tista500' --> [https://github.com/adapta-project/adapta-gtk-theme](https://github.com/adapta-project/adapta-gtk-theme)
