import { CalendarLoader } from '../../../../mel_metapage/js/lib/calendar/calendar_loader.js';
import { Slot } from '../../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js';
import { FreeBusyLoader } from '../../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import {
	DATE_FORMAT,
	DATE_HOUR_FORMAT,
} from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { html_events } from '../../../../mel_metapage/js/lib/html/html_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { ID_RESOURCES_WSP } from '../constants.js';
import { Workspace } from '../workspace.js';
export { PlanningManager };

/**
 * @typedef FullCalendarEvent
 * @property {string} title
 * @property {moment} start
 * @property {moment} end
 * @property {string} color
 * @property {string} resourceId
 */

/**
 * @typedef FullCalendarResource
 * @property {string} id
 * @property {string} title
 * @property {Slot} slot
 */

/**
 * @class
 * @classdesc Gestionnaire de planning des espaces de travail
 * @extends MelObject
 */
class PlanningManager extends MelObject {
	constructor() {
		super();
	}

	main() {
		super.main();
		this.start();
	}

	/**
	 * Démarre le gestionnaire de planning
	 *
	 * Fonctionne seulement si l'espace de travail n'est pas public
	 * @return {Promise<void>}
	 */
	async start() {
		if (!Workspace.IsPublic()) {
			this.freebusy = {};
			this.events = {};
			this.loading = [];
			this.calendar = null;
			let $body = $('#wsp-block-calendar .block-body')
				.css('margin-top', '5px')
				.html(EMPTY_STRING);
			const settings = cal.settings;

			let calendar = new FullCalendar.Calendar($body, {
				resources: await this.loadResources(),
				defaultView: 'timelineDay',
				schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
				height: 210,
				firstHour: settings.first_hour,
				scrollTime: settings.first_hour + ':00',
				slotDuration: { minutes: 60 / settings.timeslots },
				locale: 'fr',
				axisFormat: DATE_HOUR_FORMAT,
				slotLabelFormat: DATE_HOUR_FORMAT,
				eventSources: [
					{
						events: async function (start, end, timezone, callback) {
							var go = true;
							var data = this.freebusy[start.format(DATE_FORMAT)];

							if (!data) {
								go = this._set_busy();

								data = await this.generateEvents(start);
								this.freebusy[start.format(DATE_FORMAT)] = data;
							}

							callback(data);

							this._unset_busy(go);
						}.bind(this),
						id: 'resources',
					},
					{
						events: async function (start, end, timezone, callback) {
							var go = true;
							let events = this.events[start.format(DATE_FORMAT)];

							if (!events) {
								go = this._set_busy();

								if (
									start.format(DATE_FORMAT) === moment().format(DATE_FORMAT)
								) {
									events = CalendarLoader.Instance.load_all_events();
								} else {
									events = await mel_metapage.Functions.update_calendar(
										start,
										end,
									);

									events = JSON.parse(events);
								}

								events = MelEnumerable.from(events || [])
									.where(
										x =>
											!!x.categories &&
											x.categories.length > 0 &&
											x.categories[0] ===
												`ws#${rcmail.env.current_workspace_uid}`,
									)
									.select(x => {
										return {
											initial_data: x,
											title: x.title,
											start: x.start,
											end: x.end,
											resourceId: ID_RESOURCES_WSP,
											color: rcmail.env.current_settings.color,
											textColor:
												mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(
													mel_metapage.Functions.colors.kMel_extractRGB(
														rcmail.env.current_settings.color,
													),
													mel_metapage.Functions.colors.kMel_extractRGB(
														'#FFFFFF',
													),
												)
													? 'white'
													: 'black',
										};
									})
									.toArray();

								this.events[start.format(DATE_FORMAT)] = events;
							}

							callback(events);

							this._unset_busy(go);
						}.bind(this),
						id: 'events',
					},
				],
				eventRender: function (eventObj, $el) {
					if (eventObj.initial_data) {
						$el
							.click(() => {
								const start = eventObj.initial_data.start.toDate
									? eventObj.initial_data.start
									: moment(eventObj.initial_data.start);
								const date = start.toDate().getTime() / 1000.0;
								html_events._action_click(
									eventObj.initial_data.calendar,
									date,
									eventObj.initial_data,
								);
							})
							.css('cursor', 'pointer')
							.attr('title', eventObj.initial_data.title);
						if (WebconfLink.create(eventObj.initial_data)?.key) {
							$el
								.tooltip()
								.find('.fc-content')
								.prepend(
									MelHtml.start
										.icon('videocam')
										.css({
											display: 'inline-block',
											'vertical-align': 'middle',
											'font-size': '18px',
										})
										.end()
										.generate(),
								);
						}
					} else {
						$el.attr('title', eventObj.title).tooltip();
					}
				},
				resourceRender: function (resourceObj, labelTds) {
					if (resourceObj.id !== ID_RESOURCES_WSP) {
						labelTds
							.attr(
								'title',
								this.get_env('current_workspace_users')?.[resourceObj.id]
									?.fullname || resourceObj.title,
							)
							.tooltip();
					}
				}.bind(this),
			});
			calendar.render();

			change_date = () => {};

			$('#wsp-block-calendar').css('position', 'relative');
			$('#wsp-block-calendar .block-header .btn-arrow').each((i, e) => {
				e = $(e);
				e.css('float', EMPTY_STRING).parent().css('justify-content', 'center');
				switch (i) {
					case 0:
						e.off('click').on('click', async () => {
							calendar.prev();
							$('.swp-agenda-date').text(
								$('#wsp-block-calendar .fc-left h2').text(),
							);
						});

						e.parent().after(
							MelHtml.start
								.div({ class: 'btn-group col-6' })
								.css('justify-content', 'center')
								.button({
									class: 'btn btn-secondary',
									onclick: () => {
										calendar.today();
										$('.swp-agenda-date').text(
											$('#wsp-block-calendar .fc-left h2').text(),
										);
									},
								})
								.text("Aujourd'hui")
								.end()
								.button({
									class: 'btn btn-secondary',
									id: 'ojdbtn',
									onclick: () => {
										let tmp = $('<input>')
											.on('change', () => {
												calendar.gotoDate(moment(tmp.val(), 'DD/MM/YYYY'));
												tmp.remove();
												tmp = null;
												$('.swp-agenda-date').text(
													$('#wsp-block-calendar .fc-left h2').text(),
												);
											})
											.css({ position: 'absolute', opacity: 0, top: 0 })
											.appendTo('body')
											.datepicker()
											.click();
									},
								})
								.icon('arrow_drop_down')
								.css('font-size', 'unset')
								.end()
								.end()
								.end()
								.generate(),
						);

						e.parent()
							.parent()
							.parent()
							.parent()
							.find('.col-6')
							.first()
							.removeClass('col-6')
							.addClass('col-4');
						$(e.parent().parent().parent().parent().find('.col-4')[1])
							.removeClass('col-4')
							.addClass('col-6');

						e.parent()
							.removeClass('col-6')
							.addClass('col-2')
							.css('display', 'flex');
						break;

					case 1:
						e.off('click').on('click', async () => {
							calendar.next();
							$('.swp-agenda-date').text(
								$('#wsp-block-calendar .fc-left h2').text(),
							);
						});
						e.parent()
							.removeClass('col-6')
							.addClass('col-2')
							.css('display', 'flex');
						break;

					default:
						break;
				}
				calendar.render();
			});

			this.get_custom_rules().addAdvanced(
				'planning',
				'#wsp-block-calendar .fc-left h2, #wsp-block-calendar .fc-header-toolbar',
				'display:none',
			);

			this.get_custom_rules().addAdvanced(
				'planning2',
				'.block-header .row button, .swp-agenda-date, .wsp-agenda-icon',
				'align-self: center',
			);

			this.get_custom_rules().addAdvanced(
				'planning3',
				'#planningmelloader .absolute-center',
				'z-index:2',
			);

			$('.swp-agenda-date')
				.css({
					display: 'block',
					'margin-top': '4px',
				})
				.text($('#wsp-block-calendar .fc-left h2').text())
				.parent()
				.css('display', 'flex');
			$('.wsp-agenda-icon').parent().css('display', 'flex');

			this.calendar = calendar;

			this.addListeners();
		}
	}

	_set_busy() {
		this.loading.push(true);
		$('#wsp-block-calendar .block-header button')
			.addClass('disabled')
			.attr('disabled');

		if ($('#planningmelloader').length === 0)
			this.get_skin()
				.create_loader('planningmelloader', true, true)
				.appendTo($('#wsp-block-calendar'));

		if (!$('#planningblackloader').length) {
			MelHtml.start
				.div({ id: 'planningblackloader' })
				.css({
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					'background-color': '#00000082',
					'z-index': 1,
				})
				.end()
				.generate()
				.appendTo($('#wsp-block-calendar'));
		}

		return false;
	}

	_unset_busy(go) {
		if (!go) this.loading.pop();

		if (this.loading.length === 0) {
			$('#wsp-block-calendar .block-header button')
				.removeClass('disabled')
				.removeAttr('disabled');

			$('#planningmelloader').remove();
			$('#planningblackloader').remove();
		}
	}

	/**
	 * Récupère les status des membres de l'espace pour une date donnée. Si la date correspond à la date du jours, les données seront dans un premier temp, charger depuis le stockage local.
	 *
	 * Sauvegarde les ressources pour fullcalendar dans la propriété `last_resources`
	 * @param {external:moment} date
	 * @returns {Promise<FullCalendarEvent[]>}
	 */
	async generateEvents(date = moment()) {
		let resources;

		if (date.format(DATE_FORMAT) === moment().format(DATE_FORMAT))
			resources = await this.loadResources();
		else resources = await this.generateResources(date);

		let events = [];
		for (const iterator of resources) {
			if (!iterator.slot) continue;
			for (const slot of iterator.slot) {
				if (
					[Slot.STATES.telework, Slot.STATES.leave, Slot.STATES.oof].includes(
						slot.state,
					)
				) {
					events.push({
						title: Slot.TEXTES[slot.state],
						start: slot.start,
						end: slot.end,
						color: Slot.COLORS[slot.state],
						resourceId: iterator.id,
					});
				}
			}
		}

		this.last_resources = resources;

		return events;
	}

	/**
	 * Récupère les données de disponibilités.
	 *
	 * Si la date correspond à la date du jours, les données seront dans un premier temp, charger depuis le stockage local, si ils existent.
	 * @returns {Promise<FullCalendarResource[]>}
	 */
	async loadResources() {
		let resources = FreeBusyLoader.Instance.load_from_memory(
			rcmail.env.wsp_shares,
			FreeBusyLoader.Instance.interval,
			moment(),
		);

		if (!resources || Object.keys(resources).length === 0) {
			resources = await this.generateResources();
		} else {
			resources = MelEnumerable.from(resources)
				.select(x => x.value)
				.select(x => {
					return {
						id: x.email,
						title:
							rcmail.env.current_workspace_users?.[x.email]?.name || x.email,
						slot: x,
					};
				});

			resources = MelEnumerable.from([
				{
					id: ID_RESOURCES_WSP,
					title: $('.header-wsp').text(),
				},
			])
				.aggregate(resources)
				.toArray();

			FreeBusyLoader.Instance.clear_in_memory();

			this.memory_clear = true;
		}

		return MelEnumerable.from(resources)
			.orderBy(x => (x.id === ID_RESOURCES_WSP ? 'A' : x.title))
			.toArray();
	}

	/**
	 * Récupère les données de disponibilités pour une date donnée
	 * @param {external:moment} date
	 * @returns {Promise<FullCalendarResource[]>}
	 */
	async generateResources(date = moment()) {
		let resources = [];

		resources.push({
			id: ID_RESOURCES_WSP,
			title: $('.header-wsp').text(),
		});

		for await (const iterator of FreeBusyLoader.Instance.generate_and_save(
			rcmail.env.wsp_shares,
			{
				interval: FreeBusyLoader.Instance.interval,
				start: moment(date).startOf('day'),
				end: moment(date).endOf('day'),
				save: moment().format(DATE_FORMAT) === date.format(DATE_FORMAT),
			},
		)) {
			resources.push({
				id: iterator.email,
				title:
					this.get_env('current_workspace_users')?.[iterator.email]?.name ||
					iterator.email,
				slot: iterator,
			});
		}

		return resources;
	}

	/**
	 * Ajoute les écouteurs d'événements
	 */
	addListeners() {
		MelObject.Empty().add_event_listener(
			mel_metapage.EventListeners.calendar_updated.after,
			this._refresh_callback.bind(this),
			{
				callback_key: `planning-${parent.workspace_frame_manager?.getActiveFrame?.()?.get?.()?.attr?.('id') || 0}`,
			},
		);
	}

	/**
	 * Met à jours les évènements du planning
	 * @package
	 * @returns {void}
	 */
	_refresh_callback() {
		if (!this.calendar) return;

		this.freebusy = {};
		this.events = {};
		this.calendar.refetchEvents();
	}

	/**
	 * Lance un planning
	 * @static
	 * @returns {PlanningManager}
	 */
	static Start() {
		return new PlanningManager();
	}

	static AddCommands() {
		// This is a placeholder for the add commands method
	}
}
