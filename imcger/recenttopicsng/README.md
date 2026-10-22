## Recent Topics NG

### Description
Extension for phpBB - Adds a list with a number of recent topics to the board index. They can be displayed at the top, bottom or side of the page. You can also display the recent topics on a separate page. The first, last or last unread posts can be displayed in the topic list. The settings in the UCP and the user administration are displayed depending on the user permission.

The list can be split into several **sections**. Each section has its own title, shows the topics of selected forums or categories, and has its own page links. The topics of all pages of a section are loaded with the page, so changing the page of a section is instant and needs no request to the server. Only sections with more than 100 topics (e.g. with “Show all recent topic pages” enabled) load the other pages from the server, again without reloading the whole page.

Based on NV Recent Topics for phpBB 3.0, by Joas Schilling ([nickvergessen](https://github.com/nickvergessen))

[![Tests](https://github.com/IMC-GER/RecentTopicsNG/actions/workflows/tests.yml/badge.svg)](https://github.com/IMC-GER/RecentTopicsNG/actions/workflows/tests.yml)

### Version
* v1.3.0
* 22/10/2026

### Requirements
* phpBB 3.3.5 - 3.3.x
* PHP 8.0 - 8.5.x

### Supported Style
* Prosilver
* Prosilver based styles

### Screenshots
* [Index page](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_index.jpg)
* [Separate page](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_separate_page.jpg)
* [ACP Permissions](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_user_permissions.jpg)
* [UCP display option](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_ucp.jpg)
* [User administration](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_user_administration.jpg)
* [ACP settings](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_acp_settings.jpg)
* [ACP edit forum](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_edit_forum.jpg)
* [ACP server load](https://raw.githubusercontent.com/IMC-GER/images/main/screenshots/recenttopicsng/rtng_acp_load_settings.jpg)

### Authors
* © 2022 - IMC-GER & LukeWCS
* © 2017 - Sajaki
* © 2015 - PayBas

### Installation

The extension folder in this repository is `imcger/recenttopicsng`. On the server it must end up as `ext/imcger/recenttopicsng/` inside your phpBB folder, so that this file is at `ext/imcger/recenttopicsng/composer.json`.

#### Fresh install (Recent Topics NG not installed yet)
1. If one of the older extensions "Recent Topics", "Recent Topics (fork by IMC & LukeWCS)" or "Recent Topics NG" v2.2.15-pl18 is installed, go to "ACP" > "Customise" > "Manage extensions", then disable it, delete its data and remove its files. They all have the clean name `paybas/recenttopics` and cannot be used together with this extension.
2. Download this repository (on GitHub: "Code" > "Download ZIP") and unpack it. The ZIP contains a wrapper folder (e.g. `RecentTopicsNGPlus-master/`); the `imcger` folder is inside it. Do not upload the wrapper folder itself.
3. Upload the extension so you get `ext/imcger/recenttopicsng/` on the server:
   * If there is no `ext/imcger/` folder yet, upload the `imcger` folder into the `ext` folder of your board.
   * If `ext/imcger/` already exists (other extensions by IMC-GER are installed), upload only the `recenttopicsng` folder into `ext/imcger/`. Some FTP programs replace a whole folder when you upload one with the same name, which would delete the other extensions.
4. Go to "ACP" > "Customise" > "Manage extensions" and enable "Recent Topics NG".
5. Go to "ACP" > "Extensions" > "Recent Topics" > "Configuration" to set up the sections and other options (see [Setting up sections](#setting-up-sections)).
6. Check the "Recent Topics NG" user permissions under "ACP" > "Permissions", which control what users may change in their UCP.

#### Update from v1.2.x (without sections) to v1.3.0
The extension keeps its name (`imcger/recenttopicsng`), so this is a normal extension update. Your settings and user preferences are kept.

1. Go to "ACP" > "Customise" > "Manage extensions" and **disable** "Recent Topics NG".
   **Do not click "Delete data"**, because that removes all settings and user preferences of the extension.
2. Delete the old folder `ext/imcger/recenttopicsng/` on the server and upload the new one in its place (see the fresh install, steps 2 and 3). Deleting first makes sure no old files are left behind.
3. Enable "Recent Topics NG" again. phpBB runs the database update, which adds the sections setting with one default section that shows all forums. Your board looks the same as before the update.
4. Go to "ACP" > "General" > "Purge the cache" and click "Run now", so the new templates are used.
5. Add more sections under "ACP" > "Extensions" > "Recent Topics" > "Configuration".

If you use a style other than prosilver with its own copy of the Recent Topics templates or CSS, check it after the update. The template loop `rtng_topics` is now `rtng_sections`, and the ids `#rtng-box` / `#rtng` are now the classes `.rtng-box` / `.rtng-list` (see [CHANGELOG](docs/CHANGELOG.md)).

#### Using the command line (optional)
If you have shell access, run these from the phpBB folder after copying the files instead of using the ACP:
```
php bin/phpbbcli.php extension:disable imcger/recenttopicsng   # only when updating
php bin/phpbbcli.php extension:enable imcger/recenttopicsng
php bin/phpbbcli.php cache:purge
```

### Setting up sections
Under "ACP" > "Extensions" > "Recent Topics" > "Configuration", in the "Sections" block:
* **Section title:** shown in the header of the section. Leave it empty to use the default title ("Recent Topics" or "Unread Topics").
* **Forums:** select one or more forums or categories (hold Ctrl or Cmd to select several). Subforums of a selected forum or category are included automatically. Select nothing to show all forums.
* **Add section**, **Move up**, **Move down** and **Delete section** manage the list. Sections are shown on the board in the order of this list. At least one section always remains.
* Click "Submit" to save.

Forums for which "Display on Recent Topics NG" is switched off in the forum settings are never shown, in any section. The number of topics per page, the number of pages and the other display options apply to every section.

Each section has its own page parameter in the URL (`rtng_s1_start`, `rtng_s2_start`, ...), so links to a specific page of a section can be bookmarked and shared. The browser's back and forward buttons switch between the pages too.
