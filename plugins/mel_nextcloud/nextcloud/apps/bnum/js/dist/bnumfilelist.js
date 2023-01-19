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

			getDirectoryPermissions: function() {
				return OC.PERMISSION_READ | OC.PERMISSION_DELETE
			},

			updateStorageStatistics: function() {
			// no op because it doesn't have
			// storage info like free space / used space
			},

			updateRow: function($tr, fileInfo, options) {
			// no-op, suppress re-rendering
				return $tr
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
						entities: true
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
						entities: false
					},
					type: 'GET',
					beforeSend: function(xhr) {
						xhr.setRequestHeader('OCS-APIREQUEST', 'true')
					}
				}

				// Add the proper ajax requests to the list and run them
				// and make sure we have 2 promises
				if (this._entities) {
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

		/**
		 * Converts the OCS API share response data to a file info
		 * list
		 * @param {Array} data OCS API share array
		 * @returns {Array.<OCA.Bnum.SharedFileInfo>} array of shared file info
		 */
			_makeFilesOld: function(data, sharedWithUser) {
			/* jshint camelcase: false */
				var files = data

				// OCS API uses non-camelcased names
				files = _.chain(files)
				// convert share data to file data
					.map(function(_file) {
					// TODO: use OC.Files.FileInfo
						var file = {
							id: _file.id,
							type: 'dir',
							mimetype: 'httpd/unix-directory',
							name: OC.basename(_file.name),
							path: OC.dirname(_file.path),
							permissions: _file.permissions
						}
						
						if (file.path) {
							file.extraData = _file.path
						}
						return file
					})
				// Group all files and have a "shares" array with
				// the share info for each file.
				//
				// This uses a hash memo to cumulate share information
				// inside the same file object (by file id).
					.reduce(function(memo, file) {
						var data = memo[file.id]
						var recipient = file.share.targetDisplayName
						var recipientId = file.share.targetShareWithId
						if (!data) {
							data = memo[file.id] = file
							data.shares = [file.share]
							// using a hash to make them unique,
							// this is only a list to be displayed
							data.recipients = {}
							data.recipientData = {}
							// share types
							data.shareTypes = {}
							// counter is cheaper than calling _.keys().length
							data.recipientsCount = 0
							data.mtime = file.share.stime
						} else {
						// always take the most recent stime
							if (file.share.stime > data.mtime) {
								data.mtime = file.share.stime
							}
							data.shares.push(file.share)
						}

						if (recipient) {
						// limit counterparts for output
							if (data.recipientsCount < 4) {
							// only store the first ones, they will be the only ones
							// displayed
								data.recipients[recipient] = true
								data.recipientData[data.recipientsCount] = {
									'shareWith': recipientId,
									'shareWithDisplayName': recipient
								}
							}
							data.recipientsCount++
						}

						data.shareTypes[file.share.type] = true

						delete file.share
						return memo
					}, {})
				// Retrieve only the values of the returned hash
					.values()
				// Clean up
					.each(function(data) {
					// convert the recipients map to a flat
					// array of sorted names
						data.mountType = 'shared'
						delete data.recipientsCount
						if (sharedWithUser) {
						// only for outgoing shares
							delete data.shareTypes
						} else {
							data.shareTypes = _.keys(data.shareTypes)
						}
					})
				// Finish the chain by getting the result
					.value()

				// Sort by expected sort comparator
				return files.sort(this._sortComparator)
			}
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
