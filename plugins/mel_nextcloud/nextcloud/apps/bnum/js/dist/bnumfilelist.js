/* eslint-disable */
/*
 * Copyright (c) 2023 Thomas Payen <thomas.payen@i-carre.net>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
(function() {

	/**
	 * @class OCA.Bnum.FileList
	 * @augments OCA.Files.FileList
	 *
	 * @classdesc Bnum for Entities and Workspaces file list.
	 *
	 * @param $el container element with existing markup for the #controls
	 * and a table
	 * @param [options] map of options, see other parameters
	 * @param {boolean} [options.entities] true to return entities folders
	 * false to return workspaces folders
	 * Defaults to true.
	 */
	var FileList = function($el, options) {
		this.initialize($el, options)
	}
	FileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
		/** @lends OCA.Bnum.FileList.prototype */ {
			appName: 'Bnum',

		/**
		 * Whether the list shows the files shared with the user (true) or
		 * the files that the user shared with others (false).
		 */
			_entities: true,
			_personal: false,
			_clientSideSort: true,
			_allowSelection: false,

		/**
		 * @private
		 */
			initialize: function($el, options) {
				OCA.Files.FileList.prototype.initialize.apply(this, arguments)
				if (this.initialized) {
					return
				}

				// TODO: consolidate both options
				if (options && !options.entities) {
					this._entities = false
				}
				if (options && options.personal) {
					this._personal = true
					// this._renderNewButton();
				}
			},

			_renderRow: function() {
			// HACK: needed to call the overridden _renderRow
			// this is because at the time this class is created
			// the overriding hasn't been done yet...
				return OCA.Files.FileList.prototype._renderRow.apply(this, arguments)
			},

			_createRow: function(fileData) {
			// TODO: hook earlier and render the whole row here
				var $tr = OCA.Files.FileList.prototype._createRow.apply(this, arguments);

				if (fileData.quota) {
					let simpleQuota;
					if (fileData.quota < 0) {
						simpleQuota = 'Illimité';
					}
					else if (fileData.quota === 0) {
						simpleQuota = 0;
					}
					else {
						simpleQuota = OC.Util.humanFileSize(parseInt(fileData.quota, 10), true);
					}
					
					$tr.find('td.date').before($('<td class="filequota">' + simpleQuota + '</td>'));
				}
				return $tr
			},

		/**
		 * Set whether the list should contain outgoing shares
		 * or incoming shares.
		 *
		 * @param state true for incoming shares, false otherwise
		 */
			setSharedWithUser: function(state) {
				this._sharedWithUser = !!state
			},

			updateEmptyContent: function() {
				var dir = this.getCurrentDirectory()
				if (dir === '/') {
				// root has special permissions
					this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty)
					this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty)

					// hide expiration date header for non link only shares
					if (!this._linksOnly) {
						this.$el.find('th.column-expiration').addClass('hidden')
					}
				} else {
					OCA.Files.FileList.prototype.updateEmptyContent.apply(this, arguments)
				}
			},

			/**
			 * Returns the directory permissions
			 * @return permission value as integer
			 */
			getDirectoryPermissions: function() {
				if (this._personal) {
					return this && this.dirInfo && this.dirInfo.permissions ? this.dirInfo.permissions : parseInt(this.$el.find('#permissions').val(), 10);
				}
				else {
					return OC.PERMISSION_READ;
				}
			},

			updateStorageStatistics: function() {
			// no op because it doesn't have
			// storage info like free space / used space
			},

			updateRow: function($tr, fileInfo, options) {
			// no-op, suppress re-rendering
				return $tr
			},

			_renderNewButton: function() {
				// if an upload button (legacy) already exists or no actions container exist, skip
				var $actionsContainer = this.$el.find('#controls .actions');
				if (!$actionsContainer.length || this.$el.find('.button.upload').length) {
					return;
				}
				var $newButton = $(OCA.Files.Templates['template_addbutton']({
					addText: t('files', 'New'),
					iconClass: 'icon-add'
				}));
	
				$actionsContainer.prepend($newButton);
				$newButton.tooltip({'placement': 'bottom'});
	
				$newButton.click(_.bind(this._onClickNewButton, this));
				this._newButton = $newButton;
			},

			reload: function() {
				this.showMask()
				if (this._reloadCall) {
					this._reloadCall.abort()
				}

				// there is only root
				this._setCurrentDir('/', false)

				var promises = []

				var entities = {
					url: OC.linkToOCS('apps/bnum/api/v1', 2) + 'folders',
					/* jshint camelcase: false */
					data: {
						format: 'json',
						entities: true,
						personal: false
					},
					type: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('OCS-APIREQUEST', 'true')
					}
				}

				var workspaces = {
					url: OC.linkToOCS('apps/bnum/api/v1', 2) + 'folders',
					/* jshint camelcase: false */
					data: {
						format: 'json',
						entities: false,
						personal: false
					},
					type: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('OCS-APIREQUEST', 'true')
					}
				}

				var personalfiles = {
					url: OC.linkToOCS('apps/bnum/api/v1', 2) + 'folders',
					/* jshint camelcase: false */
					data: {
						format: 'json',
						entities: false,
						personal: true
					},
					type: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('OCS-APIREQUEST', 'true')
					}
				}

				// Add the proper ajax requests to the list and run them
				// and make sure we have 2 promises
				if (this._personal) {
					promises.push($.ajax(personalfiles))
				}
				else if (this._entities) {
					promises.push($.ajax(entities))
				} else {
					promises.push($.ajax(workspaces))
				}

				this._reloadCall = $.when.apply($, promises)
				var callBack = this.reloadCallback.bind(this)
				return this._reloadCall.then(callBack, callBack)
			},

			reloadCallback: function(files, response, options) {
				delete this._reloadCall
				this.hideMask()

				var result = []

				// make sure to use the same format
				if (files[0] && files[0].ocs) {
					files = files[0]
				}

				if (files.ocs && files.ocs.data) {
					// result = result.concat(this._makeFiles(files.ocs.data))
					result = result.concat(files.ocs.data)
				}

				if (this._personal) {
					// first entry is the root
					this.dirInfo = result.shift();
					this.breadcrumb.setDirectoryInfo(this.dirInfo);

					if (this.dirInfo.permissions) {
						this._updateDirectoryPermissions();
					}
				}

				result.sort(this._sortComparator);
				this.setFiles(result)
				return true
			},

			_makeFiles: function(data) {
				var files = data

				files = _.chain(files)
				// convert share data to file data
					.map(function(share) {
						var file = {
							name: OC.basename(share.name),
							mtime: share.mtime * 1000,
							mimetype: share.mimetype,
							type: share.type,
							id: share.id,
							path: OC.dirname(share.path),
							permissions: share.permissions,
							tags: share.tags || []
						}

						// file.shares = [{
						// 	id: share.id,
						// 	type: OC.Share.SHARE_TYPE_REMOTE
						// }]
						return file
					})
					.value()
				return files
			},
		})

	/**
	 * Share info attributes.
	 *
	 * @typedef {Object} OCA.Bnum.ShareInfo
	 *
	 * @property {int} id share ID
	 * @property {int} type share type
	 * @property {String} target share target, either user name or group name
	 * @property {int} stime share timestamp in milliseconds
	 * @property {String} [targetDisplayName] display name of the recipient
	 * (only when shared with others)
	 * @property {String} [targetShareWithId] id of the recipient
	 *
	 */

	/**
	 * Recipient attributes
	 *
	 * @typedef {Object} OCA.Bnum.RecipientInfo
	 * @property {String} shareWith the id of the recipient
	 * @property {String} shareWithDisplayName the display name of the recipient
	 */

	/**
	 * Shared file info attributes.
	 *
	 * @typedef {OCA.Files.FileInfo} OCA.Bnum.SharedFileInfo
	 *
	 * @property {Array.<OCA.Bnum.ShareInfo>} shares array of shares for
	 * this file
	 * @property {int} mtime most recent share time (if multiple shares)
	 * @property {String} shareOwner name of the share owner
	 * @property {Array.<String>} recipients name of the first 4 recipients
	 * (this is mostly for display purposes)
	 * @property {Object.<OCA.Bnum.RecipientInfo>} recipientData (as object for easier
	 * passing to HTML data attributes with jQuery)
	 */

	OCA.Bnum.FileList = FileList
})()
