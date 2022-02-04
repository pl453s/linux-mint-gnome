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
url_exit = "https://github.com/pl453s/linux-mint-gnome/tree/main"
url = "https://github.com/pl453s/linux-mint-gnome/blob/main/github/tour.md"
print("# Interactive tour\n")
print("<br><br>")
print("<b>Text is boring isn't it?</b>  ")
print("<b>This is fine, you can also just explore through this \"interactive tour\".</b>  ")
print("<b>It's a bit more \"concrete\" and visual!</b>")
print("<br><br>")
print("<a href=\"{}\"><img src=\"{}\"></a>".format(url + "#1msd", "begin.png"))
print()
br = ""
for i in range(0, 16):
	br += "<br>"
print(br)
print()
for slide in range(1, 7):
	for style in ["w", "m", "g"]:
		for icons in ["h", "s"]:
			for theme in ["l", "d"]:
				if slide == 1:
					screen = "1.gif"
				elif slide == 2:
					screen = "2.png"
				elif slide == 3:
					screen = "3_{}{}{}.png".format(style, icons, theme)
				elif slide == 4:
					screen = "4_{}{}{}.png".format(style, icons, theme)
				elif slide == 5:
					screen = "5_{}.png".format(style)
				elif slide == 6:
					screen = "6.png"
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
				url_self = url + "#" + anchor
				if slide == 1:
					ext_back = "_inactive"
					url_back = url_self
				if slide == 6:
					ext_next = "_inactive"
					url_next = url_self
				if slide == 1 or slide == 2 or slide == 6:
					ext_pane += "_inactive"
					url_pane = url_self
					ext_dock += "_inactive"
					url_dock = url_self
					ext_dash += "_inactive"
					url_dash = url_self
				if slide == 1 or slide == 2 or slide == 5 or slide == 6:
					ext_icon += "_inactive"
					url_icon = url_self
					ext_dark += "_inactive"
					url_dark = url_self
				img_back = "back{}.png".format(ext_back)
				img_next = "next{}.png".format(ext_next)
				img_pane = "panel{}.png".format(ext_pane)
				img_dock = "dock{}.png".format(ext_dock)
				img_dash = "dash{}.png".format(ext_dash)
				img_icon = "icons{}.png".format(ext_icon)
				img_dark = "dark{}.png".format(ext_dark)
				img_exit = "exit.png"
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
