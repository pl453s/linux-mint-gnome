#! /bin/bash
# Copyright 2010-2020 Yann MRN
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

common_labels_fillin() {
local fichier
echo "SET@_mainwindow.set_title('''$APPNAME2''')"
echo "SET@_mainwindow.set_icon_from_file('''/usr/share/icons/Papirus/48x48/apps/mx-boot-repair.svg''')"
echo "SET@_label_advanced_options.set_text('''$Advanced_options''')"
echo "SET@_tab_main_options.set_text('''$Main_options''')"
echo "SET@_tab_grub_location.set_text('''$GRUB_location''')"
echo "SET@_tab_grub_options.set_text('''$GRUB_options''')"
echo "SET@_tab_mbr_options.set_text('''$MBR_options''')"
echo "SET@_tab_other_options.set_text('''$Other_options''')"
echo "SET@_label_unhide_boot_menu.set_text('''$Unhide_boot_menu :''')"
echo "SET@_label_seconds.set_text('''$seconds''')"
echo "SET@_label_reinstall_grub.set_text('''$Reinstall_GRUB''')"
echo "SET@_label_restore_mbr.set_text('''$Restore_MBR''')"
echo "SET@_label_restore_bkp.set_text('''$Restore_EFI_backups''')"
BUG=hard-coded-EFI; update_translations
echo "SET@_label_create_bkp.set_text('''$Backup_and_rename_efi_files''')"
echo "SET@_label_winefi_bkp.set_text('''$Msefi_too ($solves_BUG)''')"
echo "SET@_label_bootflag.set_text('''$Place_bootflag''')"
fillin_bootflag_combobox
combobox_restore_mbrof_fillin #Restore MBR
echo "SET@_label_ostoboot_bydefault.set_text('''$OS_to_boot_by_default''')"
echo "SET@_label_signed.set_text('''SecureBoot''')"
echo "SET@_label_purge_grub.set_text('''$Purge_before_reinstalling_grub''')"
TYPE3=/boot; update_translations
echo "SET@_label_separateboot.set_text('''$Separate_TYPE3_partition''')"
TYPE3=/boot/efi; update_translations
echo "SET@_label_efi.set_text('''$Separate_TYPE3_partition''')"
TYPE3=/usr; update_translations
echo "SET@_label_sepusr.set_text('''$Separate_TYPE3_partition''')"
echo "SET@_label_place_alldisks.set_text('''$Place_GRUB_in_all_disks ($except_USB_disks_without_OS)''')"
echo "SET@_label_place_grub.set_text('''$Place_GRUB_into''')"
combobox_ostoboot_bydefault_fillin
echo "SET@_label_lastgrub.set_text('''$Use_last_grub''')"
echo "SET@_label_legacy.set_text('''GRUB Legacy''')"
BUG=FlexNet; update_translations
echo "SET@_label_blankextraspace.set_text('''$Blank_extra_space ($solves_BUG)''')"
BUG="no-signal / out-of-range"; update_translations
echo "SET@_label_uncomment_gfxmode.set_text('''$Uncomment_GRUB_GFXMODE ($solves_BUG)''')"
BUG=out-of-disk; update_translations
echo "SET@_label_ata.set_text('''$Ata_disk ($solves_BUG)''')"
echo "SET@_label_add_kernel_option.set_text('''$Add_a_kernel_option''')"
while read fichier; do echo "COMBO@@END@@_combobox_add_kernel_option@@${fichier}";
done < <( echo nomodeset; echo acpi=off; echo acpi_osi=; echo edd=on; echo i815modeset=1; echo i915modeset=0; echo "i915.modeset=0 xforcevesa"; echo noapic; echo nodmraid; echo nolapic; echo "nomodeset radeon mode=0"; echo "nomodeset radeon mode=1"; echo rootdelay=90; echo vga=771; echo xforcevesa )
echo 'SET@_combobox_add_kernel_option.set_active(0)'; CHOSEN_KERNEL_OPTION="acpi=off"
echo 'SET@_combobox_add_kernel_option.set_sensitive(True)' #solves glade3 bug
echo "SET@_label_kernelpurge.set_text('''$Purge_and_reinstall_kernels''')"
echo "SET@_label_open_etc_default_grub.set_text('''$Edit_GRUB_configuration_file''')"
echo "SET@_label_partition_booted_bymbr.set_text('''$Partition_booted_by_the_MBR''')"
echo "SET@_about.set_title('''About $CLEANNAME''')"
echo "SET@_about.set_icon_from_file('''/usr/share/icons/Papirus/48x48/apps/mx-boot-repair.svg''')"
echo "SET@_label_translate.set_text('''$Translate''')"
echo "SET@_label_thanks.set_text('''$Thanks''')"
echo "SET@_label_gpl.set_markup('''<small>GNU-GPL v3</small>''')"
echo "SET@_label_copyright.set_markup('''<small>(C) 2010-2020 Yann MRN</small>''')"
echo "SET@_backupwindow.set_title('''$APPNAME2''')"
echo "SET@_label_pleasechoosebackuprep.set_text('''${Please_choose_folder_to_put_backup}\\n$USB_disk_recommended''')"
echo "SET@_label_backup_table.set_text('''$Backup_table''')"
SYSTEM1=Windows; update_translations
echo "SET@_label_winboot.set_text('''$Repair_SYSTEM1_bootfiles''')"
echo "SET@_label_upload.set_text('''$Upload_report''')"; echo "SET@_label_upload1.set_text('''$Upload_report''')"; UPLOAD=pastebin
echo "SET@_label_stats.set_text('''$Participate_stats''')"
echo "SET@_label_internet.set_text('''$Check_internet''')"; echo "SET@_label_internet1.set_text('''$Check_internet''')"
}


######################################### LOOP OF THE GLADE2SCRIPT INTERFACE ###############################
# inputs : user interactions
# outputs : the Glade interface managed by the Bash script
loop_of_the_glade2script_interface() {
while read ligneg2s;do
	if [[ ${ligneg2s} =~ GET@ ]]
	then
		eval ${ligneg2s#*@}
		echo "DEBUG => in boucle bash :" ${ligneg2s#*@}
	else
		echo "DEBUG=> in bash NOT GET" ${ligneg2s}
		${ligneg2s}
	fi 
done < <(while true
do
	read entreeg2s < ${FIFO}
	[[ ${entreeg2s} == QuitNow ]] && break
	echo ${entreeg2s} 
done)
exit
}


########################################## BOOTFLAG ####################
fillin_bootflag_combobox() {
local loop disk p q TMPDISK fbfc fichier
QTY_FLAGPART=0
for ((disk=1;disk<=NBOFDISKS;disk++));do
	if [[ "${BOOTFLAG_NEEDED[$disk]}" ]] && [[ "${EFI_DISK[$disk]}" = has-no-EFIpart ]] \
	&& [[ "${USBDISK[$disk]}" != liveusb ]] && [[ "${MMCDISK[$disk]}" != livemmc ]];then
		TMPDISK="$disk"
		order_primary_partitions_of_tmpdisk
		QTY_TARGETMBRPART="$QTY_PRIMPART"
		for ((fbfc=1;fbfc<=QTY_PRIMPART;fbfc++)); do
			(( QTY_FLAGPART += 1 ))
			FLAGPART[$QTY_FLAGPART]="${PRIMPART[$fbfc]}"			#eg ${LISTOFPARTITIONS[FLAGPART[a]]}= sda3
			FLAGPARTNAME[$QTY_FLAGPART]="${PRIMPARTNAME[$fbfc]}"	#eg sda3 (XP)
		done
	fi
done
echo "COMBO@@CLEAR@@_combobox_bootflag"
if [[ "$QTY_FLAGPART" != 0 ]];then
	echo 'SET@_hbox_bootflag.show()'
	while read fichier; do echo "COMBO@@END@@_combobox_bootflag@@${fichier}";done < <( for ((fbfc=1;fbfc<=QTY_FLAGPART;fbfc++)); do
		echo "${FLAGPARTNAME[$fbfc]}"
	done)
fi
}


bootflag_update() {
if [[ "$QTY_FLAGPART" != 0 ]];then
	echo 'SET@_combobox_bootflag.set_active(0)'; BOOTFLAG_TO_USE="${FLAGPART[1]}"
	[[ "$DEBBUG" ]] && echo "[debug]BOOTFLAG_TO_USE is : ${LISTOFPARTITIONS[$BOOTFLAG_TO_USE]}"
fi
if [[ "$QTY_FLAGPART" = 0 ]];then #[[ "$GRUBPACKAGE" =~ efi ]] && [[ "$MBR_ACTION" = reinstall ]] || [[ "$MBR_ACTION" = restore ]] ||
	echo 'SET@_hbox_bootflag.set_sensitive(False)'
else
	echo 'SET@_hbox_bootflag.set_sensitive(True)'
fi
# https://forum.ubuntu-fr.org/viewtopic.php?id=1999956
if [[ "$MBR_ACTION" = reinstall ]] || [[ "$NB_BISEFIPART" != 0 ]] || [[ "$MBR_ACTION" = restore ]] || [[ "$QTY_FLAGPART" = 0 ]];then
	unset_bootflag
	echo 'SET@_checkbutton_bootflag.set_active(False)'
else
	set_bootflag
	echo 'SET@_checkbutton_bootflag.set_active(True)'
fi
}

_checkbutton_bootflag() {
[[ "${@}" = True ]] && set_bootflag || unset_bootflag
}


_combobox_bootflag() {
RETOURCOMBO_flag="${@}"
local i
[[ "$DEBBUG" ]] && echo "[debug]RETOURCOMBO_flag (BOOTFLAG_TO_USE) : $RETOURCOMBO_flag"
for ((i=1;i<=QTY_FLAGPART;i++)); do
	[[ "$RETOURCOMBO_flag" = "${FLAGPARTNAME[$i]}" ]] && BOOTFLAG_TO_USE="${FLAGPART[$i]}"
done
[[ "$DEBBUG" ]] && echo "[debug]BOOTFLAG_TO_USE becomes : ${LISTOFPARTITIONS[$BOOTFLAG_TO_USE]}"
}

set_bootflag() {
BOOTFLAG_ACTION=set-bootflag; echo 'SET@_combobox_bootflag.set_sensitive(True)'
}

unset_bootflag() {
BOOTFLAG_ACTION=""; echo 'SET@_combobox_bootflag.set_sensitive(False)'
}

########################### Install necessary packages for repair (lvm, raid..) after user confirmation
installpackagelist() {
local temp=ok temp2=ok NEEDEDREP=Misc
if [[ "$(type -p lsb_release)" ]];then
	[[ "$(lsb_release -is)" = Ubuntu ]] && NEEDEDREP=Universe
fi
update_translations
echo "SET@_label0.set_text('''$Enabling_FUNCTION. $This_may_require_several_minutes''')"
check_missing_packages
if [[ "$MISSINGPACKAGE" ]];then
	echo "$PACKAGELIST packages needed"
	UPDCOM="$PACKMAN $PACKUPD"
	INSCOM="$PACKMAN $PACKINS $PACKYES $PACKAGELIST"
	end_pulse
	zenity --width=300 --question --title="$APPNAME2" --text="$This_will_install_PACKAGELIST $Do_you_want_to_continue" || useroktoinstall=no
	if [[ "$useroktoinstall" != no ]];then
		start_pulse
		check_internet_connection
		ask_internet_connection
		if [[ "$INTERNET" = connected ]];then
			temp="$($UPDCOM)"; temp2="$($INSCOM)"
		fi
		check_missing_packages
		installpackagelist_extra
		if [[ "$MISSINGPACKAGE" ]];then
			echo "Could not install $PACKAGELIST"
			end_pulse
			if [[ "$INTERNET" != connected ]];then
				echo "$No_internet_connection_detected. $Please_connect_internet $Then_try_again"
				zenity --width=300 --info --title="$APPNAME2" --text="$No_internet_connection_detected. $Please_connect_internet $Then_try_again"
			elif [[ ! "$temp" ]] || [[ ! "$temp2" ]];then
				echo "$Please_close_all_your_package_managers ($Software_Centre, $Update_Manager, Synaptic, ...). $Then_try_again"
				zenity --width=300 --info --title="$APPNAME2" --text="$Please_close_all_your_package_managers ($Software_Centre, $Update_Manager, Synaptic, ...). $Then_try_again $Alternatively_you_can_use"
			else
				echo "$please_install_PACKAGELIST $This_may_require_to_enable_universe $Then_try_again"
				zenity --width=300 --info --title="$APPNAME2" --text="$please_install_PACKAGELIST $This_may_require_to_enable_universe $Then_try_again $Alternatively_you_can_use"
			fi
			start_pulse
		fi
	else
		echo "User refused to install $PACKAGELIST"
		zenity --width=300 --info --title="$APPNAME2" --text="$Alternatively_you_can_use"
		start_pulse
	fi
fi
}

check_missing_packages() {
local test
MISSINGPACKAGE=""
for test in $FILETOTEST;do
	[[ ! "$(type -p $test)" ]] && MISSINGPACKAGE=yes
done
}


################### Winboot repair
_checkbutton_winboot() {
[[ "${@}" = True ]] && WINBOOT_ACTION=fix-windows-boot || WINBOOT_ACTION=""
[[ "$DEBBUG" ]] && echo "[debug]WINBOOT_ACTION becomes: $WINBOOT_ACTION"
}

################### Other Options
_checkbutton_stats() {
[[ "${@}" = True ]] && SENDSTATS=sendstats || SENDSTATS=nostats
[[ "$DEBBUG" ]] && echo "[debug]SENDSTATS becomes : $SENDSTATS"
}

_checkbutton_internet() {
[[ "${@}" = True ]] && DISABLEWEBCHECK="" || DISABLEWEBCHECK=disable-internet-check
[[ "$DEBBUG" ]] && echo "[debug]DISABLEWEBCHECK becomes : $DISABLEWEBCHECK"
}

_checkbutton_internet1() {
[[ "${@}" = True ]] && DISABLEWEBCHECK="" || DISABLEWEBCHECK=disable-internet-check
[[ "$DEBBUG" ]] && echo "[debug]DISABLEWEBCHECK1 becomes : $DISABLEWEBCHECK"
}

_checkbutton_upload() {
[[ "${@}" = True ]] && UPLOAD=pastebin || UPLOAD=""
[[ "$DEBBUG" ]] && echo "[debug]UPLOAD becomes : $UPLOAD"
}
