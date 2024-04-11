/* eslint-disable no-undef */

import {
	RcmailDialog,
	RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelLinkVisualizer, MelFolderLink } from './mel_link.js';

export class LinkManager extends MelObject {
	constructor() {
		super();
	}

	main() {
		super.main();

		this.displayLinks();

		this.bindActions();
	}

	/**
	 * Créé la modale de modification d'un nouveau lien
	 */
	openLinkModal(id = null, title = null, url = null) {
		let self = this;
		if (this.newLinkModal) {
			this.newLinkModal.show();
			this.getModalValue(id, title, url);

			this.bindModalActions();
		} else {
			const html = MelHtml.start
				.row({ class: 'mx-2' })
				.span({ class: 'text-danger' })
				.text('*')
				.end()
				.text(rcmail.gettext('required_fields', 'mel_useful_link'))
				.end()
				.input({ id: 'mulc-id', type: 'hidden', value: id })
				.row({ class: 'mx-2' })
				.label({ class: 'span-mel t1 first', for: 'mulc-title' })
				.span({ class: 'text-danger' })
				.text('*')
				.end()
				.text(rcmail.gettext('link_name', 'mel_useful_link'))
				.end()
				.input({
					id: 'mulc-title',
					class: 'form-control input-mel required',
					required: true,
					placeholder: rcmail.gettext('link_title', 'mel_useful_link'),
					value: title,
				})
				.end()
				.row({ class: 'mx-2' })
				.label({ class: 'span-mel t1 first', for: 'mulc-url' })
				.span({ class: 'text-danger' })
				.text('*')
				.end()
				.text(rcmail.gettext('link_url', 'mel_useful_link'))
				.end()
				.input({
					id: 'mulc-url',
					class: 'form-control input-mel required',
					required: true,
					placeholder: 'URL',
					value: url,
				})
				.end()
				.row({ class: 'mr-1 mt-3 mx-2' })
				.label({ class: 'span-mel t1 first', for: 'mulc-url' })
				.text(rcmail.gettext('preview', 'mel_useful_link'))
				.end()
				.div({ class: 'link-block' })
				.div({ class: 'link-icon-container' })
				.img({
					id: 'icon-image',
					class: 'link-icon-image',
					src: '',
					onerror: 'imgError(this.id, \'no-image\')',
					style: 'display:none',
				})
				.span({ id: 'no-image', class: 'link-icon-no-image' })
				.end()
				.end()
				.end()
				.end()
				.generate();

			this.newLinkModal = new RcmailDialog(html, {
				title: id
					? rcmail.gettext('update_new_link', 'mel_useful_link')
					: rcmail.gettext('create_new_link', 'mel_useful_link'),
				buttons: [
					new RcmailDialogButton(
						id
							? rcmail.gettext('update', 'mel_useful_link')
							: rcmail.gettext('add', 'mel_useful_link'),
						{
							id: 'add-mel-link',
							classes: 'add-mel-link mel-button btn btn-secondary',
							click: () => {
								if (self.checkEmptyInputs()) this.addMelLink();
							},
						},
					),
				],
			});
			if (url) {
				this.displayIcon(url);
			}
			this.bindModalActions();
		}
	}

	/**
	 * Créé la modale de modification d'un dossier
	 */
	openFolderModal(id = null, title = null) {
		const html = MelHtml.start
			.input({ id: 'mulc-id', type: 'hidden', value: id })
			.row({ class: 'mx-2' })
			.label({ class: 'span-mel t1 first', for: 'mulc-title' })
			.span({ class: 'text-danger' })
			.text('*')
			.end()
			.text(rcmail.gettext('folder_name', 'mel_useful_link'))
			.end()
			.input({
				id: 'mulc-title',
				class: 'form-control input-mel required',
				required: true,
				placeholder: rcmail.gettext('link_title', 'mel_useful_link'),
				value: title,
			})
			.end()
			.generate();

		this.newFolderModal = new RcmailDialog(html, {
			title: rcmail.gettext(
				rcmail.gettext('update_new_folder', 'mel_useful_link'),
				'mel_useful_link',
			),
			buttons: [
				new RcmailDialogButton(rcmail.gettext('update', 'mel_useful_link'), {
					id: 'modify-mel-folder',
					classes: 'modify-mel-folder mel-button btn btn-secondary',
					click: () => {
						this.updateFolder(id);
					},
				}),
			],
		});
	}

	/**
	 * Affiche les liens sur la page web
	 */
	displayLinks() {
		let links_array = [];
		for (const links in rcmail.env.mul_items) {
			let link = rcmail.env.mul_items[links];
			link = JSON.parse(link);
			let linkVisualizer;

			if (link.links) {
				linkVisualizer = new MelFolderLink(link.id, link.title, link.links);
				linkVisualizer.displayFolder().appendTo('.links-items');
				for (const key in linkVisualizer.links) {
					let subLink = linkVisualizer.links[key];
					linkVisualizer.links[key] = new MelLinkVisualizer(
						subLink.id,
						subLink.title,
						subLink.link,
						this.fetchIcon(subLink.link),
						true,
					);
					linkVisualizer.links[key]
						.displaySubLink()
						.appendTo(`#links-container-${linkVisualizer.id}`);
				}
			} else {
				linkVisualizer = new MelLinkVisualizer(
					link.id,
					link.title,
					link.link,
					this.fetchIcon(link.link),
				);
				linkVisualizer.displayLink().appendTo('.links-items');
			}
			links_array.push(linkVisualizer);
		}

		$('<li class="link-space-end"></li>').appendTo('.links-items');
		this.bindRightClickActions();
		rcmail.env.mul_items = links_array;
	}

	/**
	 * Affiche un lien sur la page web
	 */
	displayLink(link) {
		link.displayLink().insertBefore('.link-space-end');
		this.saveLink(link);
	}

	saveLink(link) {
		this.bindRightClickActions(link.id);
		this.bindActions(link.id);
		rcmail.env.mul_items.push(link);
	}

	/**
	 * Affiche un dossier sur la page web
	 *
	 * @param {MelFolderLink} folder
	 */
	displayFolder(folder, location = null) {
		const indexes = [];

		if (!location) {
			folder.displayFolder().insertBefore('.link-space-end');
		} else {
			folder.displayFolder().insertBefore(location);
		}

		for (const key in folder.links) {
			let subLink = folder.links[key];
			let index = rcmail.env.mul_items.findIndex(
				item => item.id === subLink.id,
			);
			indexes.push(index);

			this.removeContainer($('#link-block-' + subLink.id));

			subLink.displaySubLink().appendTo(`#links-container-${folder.id}`);
			this.bindRightClickActions(subLink.id);
			this.bindActions(subLink.id);
		}

		rcmail.env.mul_items = rcmail.env.mul_items.filter(
			(value, index) => !indexes.includes(index),
		);
		rcmail.env.mul_items.push(folder);

		this.bindRightClickActions(folder.id);
		this.bindActions(folder.id);
	}

	/**
	 * Ajoute ou retire un lien d'un dossier
	 *
	 * @param {MelFolderLink} folder
	 * @param {MelLinkVisualizer} link
	 */
	updateFolderLink(folder, link) {
		folder.addLink(link);
		folder.callFolderUpdate().then(() => {
			$('#link-block-' + link.id)
				.closest('.link-block-container')
				.remove();
			let index = rcmail.env.mul_items.findIndex(item => item.id === link.id);
			rcmail.env.mul_items.splice(index, 1);

			link
				.displaySubLink(folder.isOpen)
				.appendTo(`#links-container-${folder.id}`);
			this.bindRightClickActions(link.id);
			this.bindActions(link.id);
		});
	}

	addMelLink() {
		let linkId = $(LinkManager.SELECTOR_MODAL_ID).val();
		let link;

		if (!linkId) {
			link = new MelLinkVisualizer(
				linkId,
				$(LinkManager.SELECTOR_MODAL_TITLE).val(),
				$(LinkManager.SELECTOR_MODAL_URL).val(),
				this.fetchIcon($(LinkManager.SELECTOR_MODAL_URL).val()),
			);

			link.callUpdate().then(data => {
				if (data !== link.id) {
					link.id = data;
					this.displayLink(link);
				}
				this.newLinkModal.hide();
			});
		} else {
			for (const key in rcmail.env.mul_items) {
				const item = rcmail.env.mul_items[key];
				if (item.id === linkId) {
					link = item;

					link.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();
					link.link = $(LinkManager.SELECTOR_MODAL_URL).val();
					link.icon = this.fetchIcon($(LinkManager.SELECTOR_MODAL_URL).val());

					link.callUpdate().then(() => {
						this.newLinkModal.hide();
					});
					break;
				} else if (this.isFolder(item)) {
					let findLink = item.getLink(linkId);
					if (findLink) {
						findLink.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();
						findLink.link = $(LinkManager.SELECTOR_MODAL_URL).val();
						findLink.icon = this.fetchIcon(
							$(LinkManager.SELECTOR_MODAL_URL).val(),
						);

						item.callFolderUpdate().then(() => {
							this.newLinkModal.hide();
						});
						break;
					}
				}
			}
		}
	}

	findLinkById(id) {
		for (const key in rcmail.env.mul_items) {
			const item = rcmail.env.mul_items[key];

			if (item.id === id) {
				return item;
			} else if (this.isFolder(item)) {
				let findLink = item.getLink(id);
				if (findLink) {
					return findLink;
				}
			}
		}

		return false;
	}

	findParentFolder(link) {
		for (const key in rcmail.env.mul_items) {
			const item = rcmail.env.mul_items[key];

			if (this.isFolder(item)) {
				let findLink = item.getLink(link.id);
				if (findLink) {
					return item;
				}
			}
		}

		return false;
	}

	isFolder(link) {
		if (link.links) return true;

		return false;
	}

	isInFolder(link) {
		if (link.inFolder) return true;

		return false;
	}

	deleteMelLink(id) {
		const link = this.findLinkById(id);

    if (
			confirm(rcmail.gettext('confirm_delete_link_element', 'mel_useful_link'))
		) {
			if (this.isInFolder(link)) {
				let folder = this.findParentFolder(link);
				folder.removeLink(link);
				folder.callFolderUpdate().then(() => {
					$('#link-block-' + link.id).remove();
				});
			} else {
				link.callDelete();
			}
		}
	}

	updateFolder(id) {
		let folder = rcmail.env.mul_items.find(function (objet) {
			return objet.id === id;
		});

		folder.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();

		folder.callFolderUpdate().then(() => {
			this.newFolderModal.destroy();
		});
	}

	TakeOutLinkFromFolder(folder, link, location = null) {
		folder.removeLink(link);

		if (Object.keys(folder.links).length === 0) {
			link.callUpdate().then(() => {
				//TODO le mettre au bon emplacement
				if (!location) {
					link.displayLink().insertBefore('.link-space-end');
				} else {
					link.displayLink().insertBefore(location);
				}
				this.saveLink(link);
			});
			folder.callFolderDelete();
		} else {
			folder.callFolderUpdate().then(() => {
				link.callUpdate().then(() => {
					$('#link-block-' + link.id).remove();

					if (!location) {
						link.displayLink().insertBefore('.link-space-end');
					} else {
						link.displayLink().insertBefore(location);
					}
					this.saveLink(link);
				});
				//Si il ne reste plus qu'un lien dans le dossier, on le sort et supprime le dossier
				// if (Object.keys(folder.links).length === 1) {
				// 	this.TakeOutLinkFromFolder(
				// 		folder,
				// 		folder.links[Object.keys(folder.links)[0]],
				// 	);
				// }
			});
		}
	}

	/**
	 * Bind des actions liés aux liens
	 */
	bindActions(id = null) {
		let self = this;
		let _id = id ? `#link-block-${id} ` : '';

		if (!id) {
			$(LinkManager.CREATE_BUTTON).on('click', function () {
				self.openLinkModal();
			});
		}

		$(_id + LinkManager.COPY_LINK).on('click', function (e) {
			mel_metapage.Functions.copy($(e.currentTarget).attr('data-link'));
		});

		$(_id + LinkManager.MODIFY_LINK).on('click', function (e) {
			self.openLinkModal(
				$(e.currentTarget).attr('data-id'),
				$(e.currentTarget).attr('data-title'),
				$(e.currentTarget).attr('data-link'),
			);
		});

		$(_id + LinkManager.DELETE_LINK).on('click', function (e) {
			self.deleteMelLink($(e.currentTarget).attr('data-id'));
		});

		$(_id + LinkManager.MODIFY_FOLDER).on('click', function (e) {
			self.openFolderModal(
				$(e.currentTarget).attr('data-id'),
				$(e.currentTarget).attr('data-title'),
			);
		});

		$(_id + LinkManager.DELETE_FOLDER).on('click', function (e) {
			self.deleteMelLink($(e.currentTarget).attr('data-id'));
		});

		if (!id) {
      document.addEventListener('dragenter', function (event) {
        if (event.target.classList.contains('link-space-between')) {
          event.target.classList.add('link-space-hovered');
        }
        const linkBlock = event.target.closest('.link-block:not(.multilink-open)');
        if (linkBlock && !linkBlock.parentElement.classList.contains('multilink-container')) {
          linkBlock.classList.add('link-block-hovered');
        }
        // const multilinkIconContainer = event.target.closest('.multilink-icon-container');
        // if (multilinkIconContainer) {
        //   multilinkIconContainer.classList.add('multilink-block-hovered');
        // }
        // const sublink = event.target.classList.contains('sublink');
        // if (sublink) {
        //   event.target.closest('.multilink-icon-container').classList.add('multilink-block-hovered');
        // }
      });

			document.addEventListener('dragleave', function (event) {
				if (event.target.classList.contains('link-space-between')) {
					event.target.classList.remove('link-space-hovered');
				}
				if (event.target.closest('.link-block.link-block-hovered')) {
					event.target
						.closest('.link-block.link-block-hovered')
						.classList.remove('link-block-hovered');
				}
        // if (event.target.classList.contains('multilink-icon-container'))
        //   event.target.classList.remove('multilink-block-hovered');
        
        // const sublink = event.target.classList.contains('sublink');
        // if (sublink) {
        //   event.target.closest('.multilink-icon-container').classList.add('multilink-block-hovered');
        // }
			});

			document.addEventListener(
				'dragover',
				function (event) {
					// Empêche le comportement par défaut afin d'autoriser le drop
					event.preventDefault();
				},
				false,
			);

			document.addEventListener('drop', function (event) {
				event.preventDefault();

				let data = JSON.parse(event.dataTransfer.getData('text/plain'));

				let id = data.id;
        
				let movedElement = $('#link-block-' + id);
				let movedContainer = movedElement.closest('.link-block-container');

        let targetElement = $(event.target);
        let targetContainer = targetElement.closest('.link-block-container');

				let targetIndex = $('.link-block-container').index(targetContainer);
				let elementIndex = $('.link-block-container').index(movedContainer);

        //Si on déplace un element d'un dossier non ouvert
        if (movedElement.hasClass('sublink')){
          targetElement.removeClass('multilink-block-hovered');
          return;
        }

				//Si on sort un lien d'un dossier
				if (data.inFolder) {
					let link = self.findLinkById(id);
					let folder = self.findParentFolder(link);
					self.TakeOutLinkFromFolder(
						folder,
						link,
						targetElement.hasClass('link-space-end') ? null : targetContainer,
					);
					return;
				}

				//Si on déplace l'élément
				if (targetElement.hasClass('link-space-between')) {
					targetElement.removeClass('link-space-hovered');
					targetContainer.before(movedContainer);

					self.updateList(id, targetIndex);
				} 
        if (targetElement.hasClass('link-space-end')) {
					targetElement.before(movedContainer);

					self.updateList(id, targetIndex);
				}

				//Si on le rajoute dans un dossier
				if (
					targetElement.hasClass('multilink-icon-container') ||
					targetElement.hasClass('sublink') ||
					targetElement.hasClass('multilink-container')
				) {
          targetElement.removeClass('multilink-block-hovered');
					if (!rcmail.env.mul_items[elementIndex].links) {
						self.updateFolderLink(
							rcmail.env.mul_items[targetIndex],
							rcmail.env.mul_items[elementIndex],
						);
					}
				}

				//Si on crée un dossier
				else {
					event.target
						.closest('.link-block.link-block-hovered')
						.classList.remove('link-block-hovered');

					//Si le target n'est pas déjà un dossier
					if (!rcmail.env.mul_items[targetIndex].links) {

            //Si on déplace un dossier dans un dossier
            if (rcmail.env.mul_items[elementIndex].links) return;

						let _melFolder = new MelFolderLink('', 'Dossier', [
							rcmail.env.mul_items[elementIndex],
							rcmail.env.mul_items[targetIndex],
						]);
						_melFolder.callFolderUpdate().then(data => {
							if (data !== _melFolder.id) {
								_melFolder.id = data;
								self.displayFolder(
									_melFolder,
									targetContainer
								);
							}
						});
					} 
          //Si on ajoute un lien dans un dossier
          else {
            targetElement.removeClass('multilink-block-hovered');
						if (!rcmail.env.mul_items[elementIndex].links) {
							self.updateFolderLink(
								rcmail.env.mul_items[targetIndex],
								rcmail.env.mul_items[elementIndex],
							);
						}
					}
				}
			});
		}
	}

	updateList(id, newIndex) {
		const busy = rcmail.set_busy(true, 'loading');
		rcmail.env.mul_items.find(function (object, index) {
			if (object.id === id) {
				//On met l'objet dans la bonne position après le déplacement
				rcmail.env.mul_items.splice(
					newIndex,
					0,
					rcmail.env.mul_items.splice(index, 1)[0],
				);
				return mel_metapage.Functions.post(
					mel_metapage.Functions.url('useful_links', 'update_list'),
					{ _list: rcmail.env.mul_items },
					() => {
						rcmail.set_busy(false, 'loading', busy);
					},
				);
			}
		});
	}

	/**
	 * Bind des actions liés à la modale
	 */
	bindModalActions() {
		let self = this;

		$(
			`${LinkManager.SELECTOR_MODAL_URL},${LinkManager.SELECTOR_MODAL_TITLE}`,
		).on('change', function () {
			if ($(LinkManager.SELECTOR_MODAL_URL).val())
				self.displayIcon($(LinkManager.SELECTOR_MODAL_URL).val());
		});

		$(LinkManager.SELECTOR_MODAL_IMAGE).on('error', function () {
			self.imgError(
				$(this).attr('id'),
				'no-image',
				$(LinkManager.SELECTOR_MODAL_TITLE).val(),
			);
		});

		MEL_ELASTIC_UI.update_tabs();
	}

	bindRightClickActions(id = null) {
		let _id = id ? `#link-block-${id}` : '';
		let contextMenuOpened = false;
		// Open the context menu on right-click
		$(`${_id}.link-block`).on('contextmenu', function (event) {
			event.preventDefault();

			if ($(this).hasClass('multilink-open') || $(this).hasClass('sublink')) return;

			const contextMenu = $('#context-menu-' + $(this).data('id'));

			if (contextMenuOpened) {
				contextMenuOpened.hide();
			}

			// Show the context menu
			contextMenu.show();
			contextMenuOpened = contextMenu;

			$(document).on('click', function () {
				if (
					!contextMenu.is(event.target) &&
					contextMenu.has(event.target).length === 0
				) {
					contextMenu.hide();
					contextMenuOpened = false;
				}
			});
		});
	}

	/**
	 * Reset les informations précédentes de la modale
	 */
	getModalValue(id = null, title = null, url = null) {
		$(LinkManager.SELECTOR_MODAL_ID).val(id);
		$(LinkManager.SELECTOR_MODAL_TITLE).val(title);
		$(LinkManager.SELECTOR_MODAL_URL).val(url);

		if (url) {
			this.displayIcon(url);
		} else {
			$(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', '');
			$(LinkManager.SELECTOR_MODAL_IMAGE).css('display', 'none');
		}

		if (id) {
			$('.add-mel-link').text(rcmail.gettext('update', 'mel_useful_link'));
		} else {
			$('.add-mel-link').text(rcmail.gettext('add', 'mel_useful_link'));
		}
	}

	/**
	 * Affiche l'icone du lien
	 * @param {string} url Url du lien
	 */
	displayIcon(url) {
		$(LinkManager.SELECTOR_MODAL_NO_IMAGE).css('display', 'none');
		$(LinkManager.SELECTOR_MODAL_IMAGE).css('display', 'flex');

		const validProtocol = /^https?:\/\//i;

		if (!validProtocol.test(url)) {
			// Si le protocole n'est pas présent, ajoute 'https://' avant l'URL
			url = 'https://' + url;
		} else if (url === 'https://') {
			url = '';
		}

		$(LinkManager.SELECTOR_MODAL_URL).val(url);

		const apiUrl = this.fetchIcon(url);

		$(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', apiUrl);
	}

	/**
	 * Récupère le nom de domaine de l'url pour retourner l'url de l'icone
	 * @param {string} url Url du lien
	 * @returns Url de l'icone
	 */
	fetchIcon(url) {
		let domain = '';
		try {
			domain = new URL(url).hostname;
		} catch (error) {
			console.error('Erreur :', error.message);
			return null;
		}

		return rcmail.env.external_icon_url + domain;
	}

	/**
	 * Affiche la première lettre si l'image n'est pas trouvée
	 * @param {string} iconId Id de l'image
	 * @param {string} iconId Id de l'overlay si l'image n'est pas chargée
	 * @param {string} title Titre du lien
	 */
	imgError(iconId = null, noImageId = null, title) {
		let iconImage = $('#' + iconId);
		let noImage = $('#' + noImageId);

		const firstLetter = title
			? title[0].toUpperCase()
			: $(LinkManager.SELECTOR_MODAL_TITLE).val()
				? $(LinkManager.SELECTOR_MODAL_TITLE).val()[0].toUpperCase()
				: null;

		iconImage.hide();
		noImage.html(firstLetter);
		noImage.css('display', 'flex');
	}

	/**
	 * Helpers functions
	 */

	removeContainer(target) {
		target.closest('.link-block-container').remove();
	}

	checkEmptyInputs() {
		const titleInput = $(LinkManager.SELECTOR_MODAL_TITLE);
		const urlInput = $(LinkManager.SELECTOR_MODAL_URL);

		if (!titleInput.val()) {
			titleInput.addClass('error');
			return false;
		} else {
			titleInput.removeClass('error');
		}

		if (!urlInput.val()) {
			urlInput.addClass('error');
			return false;
		} else {
			urlInput.removeClass('error');
		}

		return true;
	}
}

LinkManager.SELECTOR_MODAL_ID = '#mulc-id';
LinkManager.SELECTOR_MODAL_TITLE = '#mulc-title';
LinkManager.SELECTOR_MODAL_URL = '#mulc-url';
LinkManager.SELECTOR_MODAL_IMAGE = '#icon-image';
LinkManager.SELECTOR_MODAL_NO_IMAGE = '#no-image';
LinkManager.CREATE_BUTTON = '#mulba';
LinkManager.COPY_LINK = '.copy-link';
LinkManager.MODIFY_LINK = '.modify-link';
LinkManager.DELETE_LINK = '.delete-link';
LinkManager.MODIFY_FOLDER = '.modify-folder';
LinkManager.DELETE_FOLDER = '.delete-folder';
