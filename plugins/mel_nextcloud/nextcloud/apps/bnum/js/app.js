/**
 * Copyright (c) 2023 Thomas Payen <thomas.payen@i-carre.net>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
(function() {

	if (!OCA.Bnum) {
		/**
		 * @namespace OCA.Bnum
		 */
		OCA.Bnum = {}
	}

	/**
	 * @namespace
	 */
	OCA.Bnum.App = {

		_entitiesFileList: null,
		_workspacesFileList: null,
		_personalFileList: null,

		initEntities($el) {
			if (this._entitiesFileList) {
				return this._entitiesFileList
			}

			this._entitiesFileList = new OCA.Bnum.FileList(
				$el,
				{
					id: 'entities',
					entities: true,
					personal: false,
					fileActions: this._createFileActions(),
					config: OCA.Files.App.getFilesConfig(),
					// The file list is created when a "show" event is handled, so
					// it should be marked as "shown" like it would have been done
					// if handling the event with the file list already created.
					shown: true,
				}
			)

			this._extendFileList(this._entitiesFileList)
			this._entitiesFileList.appName = t('bnum', 'Espaces d\'entités')
			this._entitiesFileList.$el.find('#emptycontent').html('<div class="icon-shared"></div>'
				+ '<h2>' + t('bnum', 'Pas encore d\'espace d\'entité.') + '</h2>'
				+ '<p>' + t('bnum', 'Les espaces d\'entités sont créés par votre support informatique local depuis l\'application AMEDEE.') + '</p>')
			return this._entitiesFileList
		},

		initWorkspaces($el) {
			if (this._workspacesFileList) {
				return this._workspacesFileList
			}

			this._workspacesFileList = new OCA.Bnum.FileList(
				$el,
				{
					id: 'workspaces',
					entities: false,
					personal: false,
					fileActions: this._createFileActions(),
					config: OCA.Files.App.getFilesConfig(),
					// The file list is created when a "show" event is handled, so
					// it should be marked as "shown" like it would have been done
					// if handling the event with the file list already created.
					shown: true,
				}
			)

			this._extendFileList(this._workspacesFileList)
			this._workspacesFileList.appName = t('bnum', 'Espaces de travail')
			this._workspacesFileList.$el.find('#emptycontent').html('<div class="icon-shared"></div>'
				+ '<h2>' + t('bnum', 'Pas encore d\'espace de travail.') + '</h2>'
				+ '<p>' + t('bnum', 'Pour créer un espace de travail, utilisez le bouton "Créer" du Bureau numérique.') + '</p>')
			return this._workspacesFileList
		},

		initPersonalFiles($el) {
			if (this._personalFileList) {
				return this._personalFileList
			}

			this._personalFileList = new OCA.Bnum.FileList(
				$el,
				{
					id: 'personalfiles',
					entities: false,
					personal: true,
					enableUpload: true,
					fileActions: this._createFileActions(),
					config: OCA.Files.App.getFilesConfig(),
					// The file list is created when a "show" event is handled, so
					// it should be marked as "shown" like it would have been done
					// if handling the event with the file list already created.
					shown: true,
					dragOptions: dragOptions,
					folderDropOptions: folderDropOptions,
					multiSelectMenu: [
						{
								name: 'copyMove',
								displayName:  t('files', 'Move or copy'),
								iconClass: 'icon-external',
						},
						{
								name: 'download',
								displayName:  t('files', 'Download'),
								iconClass: 'icon-download',
						},
						{
								name: 'delete',
								displayName: t('files', 'Delete'),
								iconClass: 'icon-delete',
						}
					]
				}
			)

			this._extendFileList(this._personalFileList)
			this._personalFileList.appName = t('bnum', 'Fichiers personnels')
			this._personalFileList.$el.find('#emptycontent').html('<div class="icon-folder"></div>'
				+ '<h2>' + t('bnum', 'Pas de fichier personnel.') + '</h2>'
				+ '<p>' + t('bnum', 'Créez un fichier ou un dossier personnel via le bouton (+) ci-dessus.') + '</p>')
			return this._personalFileList
		},

		removeEntities() {
			if (this._entitiesFileList) {
				this._entitiesFileList.$fileList.empty()
			}
		},

		removeWorkspaces() {
			if (this._workspacesFileList) {
				this._workspacesFileList.$fileList.empty()
			}
		},

		removePersonalFiles() {
			if (this._personalFileList) {
				this._personalFileList.$fileList.empty()
			}
		},

		/**
		 * Destroy the app
		 */
		destroy() {
			this.removeEntities()
			this.removeWorkspaces()
			this.removePersonalFiles()
			this._entitiesFileList = null
			this._workspacesFileList = null
			this._personalFileList = null
			delete this._globalActionsInitialized
		},

		_createFileActions() {
			// inherit file actions from the files app
			const fileActions = new OCA.Files.FileActions()
			// note: not merging the legacy actions because legacy apps are not
			// compatible with the sharing overview and need to be adapted first
			fileActions.registerDefaultActions()
			fileActions.merge(OCA.Files.fileActions)

			if (!this._globalActionsInitialized) {
				// in case actions are registered later
				this._onActionsUpdated = _.bind(this._onActionsUpdated, this)
				OCA.Files.fileActions.on('setDefault.app-sharing', this._onActionsUpdated)
				OCA.Files.fileActions.on('registerAction.app-sharing', this._onActionsUpdated)
				this._globalActionsInitialized = true
			}

			// when the user clicks on a folder, redirect to the corresponding
			// folder in the files app instead of opening it directly
			fileActions.register('dir', 'Open', OC.PERMISSION_READ, '', function(filename, context) {
				OCA.Files.App.setActiveView('files', { silent: true })
				OCA.Files.App.fileList.changeDirectory(OC.joinPaths(context.$file.attr('data-path'), filename), true, true)
			})
			fileActions.setDefault('dir', 'Open')
			return fileActions
		},

		_onActionsUpdated(ev) {
			_.each([this._entitiesFileList, this._workspacesFileList], function(list) {
				if (!list) {
					return
				}

				if (ev.action) {
					list.fileActions.registerAction(ev.action)
				} else if (ev.defaultAction) {
					list.fileActions.setDefault(
						ev.defaultAction.mime,
						ev.defaultAction.name
					)
				}
			})
		},

		_extendFileList(fileList) {
			// remove size column from summary
			fileList.fileSummary.$el.find('.filesize').remove()
		},
	};
})();

window.addEventListener('DOMContentLoaded', function() {
	$('#app-content-entities').on('show', function(e) {
		OCA.Bnum.App.initEntities($(e.target))
	})
	$('#app-content-entities').on('hide', function() {
		OCA.Bnum.App.removeEntities()
	})
	$('#app-content-workspaces').on('show', function(e) {
		OCA.Bnum.App.initWorkspaces($(e.target))
	})
	$('#app-content-workspaces').on('hide', function() {
		OCA.Bnum.App.removeWorkspaces()
	})
	$('#app-content-personalfiles').on('show', function(e) {
		OCA.Bnum.App.initPersonalFiles($(e.target))
	})
	$('#app-content-personalfiles').on('hide', function() {
		OCA.Bnum.App.removePersonalFiles()
	})

	// Gérer le switch des thèmes
	window.addEventListener("message", (event) => {
		if (event.data === 'switch-theme-dark' || event.data === 'switch-theme-light') {
			const current_theme = document.querySelector('body').dataset.themes;
			const themeId = event.data.replace(/switch-theme-/, '');
			const real_theme = themeId == 'dark' ? 'light' : 'dark';
			if (current_theme == real_theme || !current_theme) {
				const requesttoken = document.querySelector('head').dataset.requesttoken;
				fetch(
					'/mdrive/ocs/v2.php/apps/theming/api/v1/theme/' + themeId + '/enable', 
					{ 
						method: "PUT",
						headers: {
							"requesttoken": requesttoken
						}
					}
				);
				document.querySelector('body').dataset.themes = themeId;

				if (themeId == 'dark') {
					document.querySelector('body').dataset.themeDark = '';
					delete document.querySelector('body').dataset.themeLight;
				}
				else {
					document.querySelector('body').dataset.themeLight = '';
					delete document.querySelector('body').dataset.themeDark;
				}
			}
		}
	});
});
