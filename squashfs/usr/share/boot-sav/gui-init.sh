#! /bin/bash
# Copyright 2012-2020 Yann MRN
#
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License version 3, as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranties of
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR
# PURPOSE. See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

gui_init() {
######## Initialization of translations ######
set -a
source gettext.sh
set +a
export TEXTDOMAIN=boot-sav    # same .mo for boot-repair and os-uninstaller
export TEXTDOMAINDIR="/usr/share/locale"
. /usr/bin/gettext.sh
######## Preparation of the first pulsate #########
echo "SET@pulsatewindow.set_icon_from_file('''/usr/share/icons/Papirus/48x48/apps/mx-boot-repair.svg''')"
echo "SET@pulsatewindow.set_title('''$(eval_gettext "$CLEANNAME")''')" #can't replace by APPNAME2 yet
LAB="$(eval_gettext $'Scanning systems')"
echo "SET@_label0.set_text('''$LAB. $(eval_gettext $'This may require several minutes...')''')"
start_pulse
GUI=yes
DEBBUG=yes
. /usr/share/boot-sav/gui-translations.sh			#Dialogs common to os-uninstaller and boot-repair
. /usr/share/boot-sav/${APPNAME}-translations.sh	#Translations specific to the app
lib_init
}

lib_init() {
######## During first pulsate ########
if [[ -d /usr/share/boot-sav-extra ]];then
	. /usr/share/boot-sav-extra/gui-extra.sh	#Extra librairies
else
	. /usr/share/boot-sav/gui-dummy.sh				#Dummy librairies
fi
. /usr/share/boot-sav/bs-cmd_terminal.sh			#Librairies common to os-uninstaller, boot-repair, and boot-info
. /usr/share/boot-sav/gui-raid-lvm.sh				#Init librairies common to os-uninstaller and boot-repair
. /usr/share/boot-sav/gui-tab-other.sh				#Glade librairies common to os-uninstaller and boot-repair
DASH="==================="
EMAIL1="boot.repair@gmail.com"
PLEASECONTACT="Please report this message to $EMAIL1"
LOG_PATH_LINUX="/var/log/$APPNAME"
LOG_PATH_OTHER="/$APPNAME/log"
TMP_FOLDER_TO_BE_CLEARED="$(mktemp -td ${APPNAME}-XXXXX)"
DATE="$(date +'%Y%m%d_%H%M')"; SECOND="$(date +'%S')"
LOGREP="$LOG_PATH_LINUX/$DATE$SECOND"; 
TMP_LOG="$LOGREP/$DATE_$APPNAME.log"
if [[ "$GUI" ]];then
	mkdir -p "$LOGREP"
	exec >& >(tee "$TMP_LOG")
	echo "$DASH log of $APPNAME $DATE $DASH"
	echo_version
	first_translations
fi
[[ "$(LANGUAGE=C LC_ALL=C lscpu | grep 64-bit)" ]] && ARCHIPC=64 || ARCHIPC=32
WGETTIM=10
slist='/etc/apt/sources.list'
activate_lvm_if_needed
[[ "$choice" != exit ]] && activate_raid_if_needed
if [[ "$choice" = exit ]];then
	if [[ "$GUI" ]];then
		end_pulse
		zenity --width=300 --info --title="$APPNAME2" --text="$No_change_on_your_pc_See_you"
		echo 'EXIT@@'
	else
		exit
	fi
else
	LAB="$Scanning_systems"
	[[ "$GUI" ]] && echo "SET@_label0.set_text('''$LAB. $This_may_require_several_minutes''')"
fi
. /usr/share/boot-sav/bs-common.sh					#Librairies common to os-uninstaller, boot-repair, and boot-info
. /usr/share/boot-sav/gui-scan.sh					#Scan librairies common to os-uninstaller and boot-repair
. /usr/share/boot-sav/gui-tab-main.sh				#Glade librairies common to os-uninstaller and boot-repair
. /usr/share/boot-sav/gui-tab-loca.sh
. /usr/share/boot-sav/gui-tab-grub.sh
. /usr/share/boot-sav/gui-tab-mbr.sh
. /usr/share/boot-sav/gui-actions.sh				#Action librairies common to os-uninstaller and boot-repair
. /usr/share/boot-sav/gui-actions-grub.sh
. /usr/share/boot-sav/gui-actions-purge.sh
. /usr/share/boot-sav/${APPNAME}-actions.sh			#Action librairies specific to the app
. /usr/share/boot-sav/${APPNAME}-gui.sh				#GUI librairies specific to the app
}

######################################### Pulsate ###############################

start_pulse() {
echo 'SET@pulsatewindow.show()'; while true; do echo 'SET@_progressbar1.pulse()'; sleep 0.2; done &
pid_pulse=$!
}

end_pulse() {
kill ${pid_pulse}; echo 'SET@pulsatewindow.hide()'
}

