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

## Installation (1.3 -> 1.6 comming)

**WARNING: Your computer may be wiped, depending of what you choose to do at the installation**  
**WARNING: Updates has not been tested yet, you are warned, be very careful and know what you do**
- Download the ISO: https://github.com/pl453s/linux-mint-gnome/releases/download/v1.3-mint20/lmg.iso
- Burn-it on a disk, or flash-it on an USB flash drive, or just insert-it in a virtual machine
- Boot your disk or your USB flash drive, and you can test or install the distribution

*The keyboard layout can be incorrect with Firefox and Thunderbird under Wayland. To avoid this, you can:*
- *Run these softwares with 'MOZ_ENABLE_WAYLAND=1'*
- *OR, run 'setxkbmap -layout \<your layout\>' on each login*
- *OR, just select 'Gnome on Xorg' session on login screen*

## Migration / Upgrade (1.5 -> 1.6 comming)

The Linux Mint Gnome development has became too complex to continue to support scripted migration from official Linux Mint editions.
Now, the DEB files will be released "as is", use them to migrate by yourself or to upgrade your Linux Mint Gnome installation.
A separate ISO file will be published, once at a time, each time the project has evoluate enough and is stable enough.

Lastest release: https://github.com/pl453s/linux-mint-gnome/releases/tag/v1.5-mint20

## Project packages

- mint-gnome-core: Welcome screen, Gnome extensions, .desktop files, default schemas and default user folder
- mint-info-gnome: Necessary information about the Linux Mint release and edition (here Gnome)
- mint-gnome-theme: 'Materia' theme with some fixes (on screen keyboard icons + app-folder bug)
- mint-gnome-control-center: 'Settings' application with some fixes (remove Appearance + Whoopsie)
- mint-gnome-control-center-data: 'Settings' application with some fixes (use Linux Mint logo icon)
- gnome-customization: 'gnome-tweaks', only better (customize Gnome, QT5, GDM3, Plymouth and Grub)
- plymouth-theme-mint: Spinner boot screen which support UEFI manufacturer logo (BGRT)
- papirus-cursor-theme: Cursors from 'Paper' icon theme
- libreoffice-style-papirus: LibreOffice 'Papirus' style icon pack

## Gnome Customization

- For now, it's just a Zenity box which launch 'Gnome Tweaks'. The project is to create a central GUI to customize:  
styles, extensions, appearance, applications grid, user-folders paths, Gnome, QT5, GDM3, Plymouth and Grub.
- Currently, to change desktop style after the welcome screen passed, open 'Customization' > 'Extensions' and toggle the corresponding extensions.
Do not enable 'Dash to Panel' and 'Dash to Dock' at the same time.
- The user folders names localisation is intentionally disabled. A section to change these names is planned.
- Until 'Customization' is developed, I created a set of basic tools to more easily customize GDM3:
```bash
# With 'gnome-customization' installed (lastest release), run for example:
gdm3-patch /usr/share/themes/Materia-Dark gnome-shell.css # 'Materia-dark' for old versions
# If a theme is incompatible and makes crash GDM3, login to another TTY and run:
gdm3-reset
```

## Remaining work

- Change GitHub publication
- PUBLISH A NEW ISO FILE
- Develop Gnome Customization
- PUBLISH A NEW ISO FILE

## Credits

- 'Gnome Shell extensions' created by 'gcampax' --> https://github.com/gcampax/gnome-shell-extensions
- 'Top Indicator extension' created by 'quiro9' --> https://github.com/ubuntu/gnome-shell-extension-appindicator
- 'Desktop Icons NG extension' created by 'rastersoft' --> https://gitlab.com/rastersoft/desktop-icons-ng
- 'Dash to Panel extension' created by 'jderose9' --> https://github.com/home-sweet-gnome/dash-to-panel
- 'Dash to Dock extension' created by 'micheleg' --> https://github.com/micheleg/dash-to-dock/
- 'Papirus icon theme' created by 'varlesh' --> https://github.com/PapirusDevelopmentTeam/papirus-icon-theme
- 'Paper icon theme' created by 'snwh' --> https://github.com/snwh/paper-icon-theme
- 'Materia GTK theme' created by 'nana-4' --> https://github.com/nana-4/materia-theme
