#!/usr/bin/python3
def inv(letter):
	if letter == "l":
		return "d"
	if letter == "d":
		return "l"
	if letter == "h":
		return "s"
	if letter == "s":
		return "h"
for slide in [1, 2, 3, 4]:
	for style in ["w", "m", "g"]:
		for icons in ["h", "s"]:
			for theme in ["l", "d"]:
				url = "https://github.com/pl453s/linux-mint-gnome/blob/main/tour/tour.md"
				if slide == 1:
					screen = "../img/1.png"
				elif slide == 2:
					screen = "../img/2.png"
				elif slide == 3:
					screen = "../img/3_{}{}{}.png".format(style, icons, theme)
				else:
					screen = "../img/4_{}.png".format(style)
				ext_back = ""
				ext_next = ""
				ext_pane = "_off"
				ext_dock = "_off"
				ext_dash = "_off"
				ext_icon = "_off"
				ext_dark = "_off"
				if style == "w":
					ext_pane = "_on"
				if style == "m":
					ext_dock = "_on"
				if style == "g":
					ext_dash = "_on"
				if icons == "s":
					ext_icon = "_on"
				if theme == "d":
					ext_dark = "_on"
				anchor   = str(slide) + style + icons + theme
				url_back = url + "#" + str(slide-1) + style + icons + theme
				url_next = url + "#" + str(slide+1) + style + icons + theme
				url_pane = url + "#" + str(slide) + "w" + icons + theme
				url_dock = url + "#" + str(slide) + "m" + icons + theme
				url_dash = url + "#" + str(slide) + "g" + icons + theme
				url_icon = url + "#" + str(slide) + style + inv(icons) + theme
				url_dark = url + "#" + str(slide) + style + icons + inv(theme)
				url_exit = "https://github.com/pl453s/linux-mint-gnome"
				url_self = url + "#" + anchor
				if slide == 1:
					ext_back = "_inactive"
					url_back = url_self
				if slide == 4:
					ext_next = "_inactive"
					url_next = url_self
				if slide < 3:
					ext_pane += "_inactive"
					url_pane = url_self
					ext_dock += "_inactive"
					url_dock = url_self
					ext_dash += "_inactive"
					url_dash = url_self
				if slide != 3:
					ext_icon += "_inactive"
					url_icon = url_self
					ext_dark += "_inactive"
					url_dark = url_self
				img_back = "../btn/back{}.png".format(ext_back)
				img_next = "../btn/next{}.png".format(ext_next)
				img_pane = "../btn/panel{}.png".format(ext_pane)
				img_dock = "../btn/dock{}.png".format(ext_dock)
				img_dash = "../btn/dash{}.png".format(ext_dash)
				img_icon = "../btn/icons{}.png".format(ext_icon)
				img_dark = "../btn/dark{}.png".format(ext_dark)
				img_exit = "../btn/exit.png"
				print("<span id=\"{}\">".format(anchor))
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_back, img_back))
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_next, img_next))
				print("  &emsp;&emsp;")
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_pane, img_pane))
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_dock, img_dock))
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_dash, img_dash))
				print("  &emsp;")
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_icon, img_icon))
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_dark, img_dark))
				print("  &emsp;&emsp;")
				print("  <a href=\"{}\"><img src=\"{}\"></a>".format(url_exit, img_exit))
				print("  <img src=\"{}\">".format(screen))
				print("</span>")
				print()
				br = ""
				for i in range(0, 16):
					br += "<br>"
				print(br)
				print()