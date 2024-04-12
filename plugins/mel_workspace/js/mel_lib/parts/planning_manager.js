import { CalendarLoader } from '../../../../mel_metapage/js/lib/calendar/calendar_loader.js';
import { Slot } from '../../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js';
import { FreeBusyLoader } from '../../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import { DATE_FORMAT } from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { Workspace } from '../workspace.js';
import { PartManager } from './part_manager.js';

export class PlanningManager extends PartManager {
	static async Start() {
		if (!Workspace.IsPublic()) {
			this.freebusy = {};
			this.events = {};
			this.loading = [];
			let $body = $('#wsp-block-calendar .block-body').html(EMPTY_STRING);
			const settings = cal.settings;

			let calendar = new FullCalendar.Calendar($body, {
				resources: await this.LoadResources(),
				defaultView: 'timelineDay',
				schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
				height: 200,
				slotDuration: { minutes: 60 / settings.timeslots },
				locale: 'fr',
				axisFormat: 'HH:mm',
				slotLabelFormat: 'HH:mm',
				eventSources: [
					{
						events: async function (start, end, timezone, callback) {
							var go = true;
							var data = PlanningManager.freebusy[start.format(DATE_FORMAT)];

							if (!data) {
								go = false;
								PlanningManager.loading.push(true);
								$('#wsp-block-calendar .block-header .btn-arrow')
									.addClass('disabled')
									.attr('disabled');
								data = await PlanningManager.GenerateEvents(start);
								PlanningManager.freebusy[start.format(DATE_FORMAT)] = data;
							}

							callback(data);

							if (!go) PlanningManager.loading.pop();

							if (PlanningManager.loading.length === 0) {
								$('#wsp-block-calendar .block-header .btn-arrow')
									.removeClass('disabled')
									.removeAttr('disabled');
							}
						},
						id: 'resources',
					},
					{
						events: async function (start, end, timezone, callback) {
							var go = true;
							let events = PlanningManager.events[start.format(DATE_FORMAT)];

							if (!events) {
								go = false;
								PlanningManager.loading.push(true);
								$('#wsp-block-calendar .block-header .btn-arrow')
									.addClass('disabled')
									.attr('disabled');
								if (
									start.format(DATE_FORMAT) === moment().format(DATE_FORMAT)
								) {
									events = CalendarLoader.Instance.load_all_events();

									if (events.length > 0) {
										events =
											await CalendarLoader.Instance.update_agenda_local_datas(
												true,
											);
									}
								} else {
									events = await mel_metapage.Functions.update_calendar(
										start,
										end,
									);

									events = JSON.parse(events);
								}

								events = MelEnumerable.from(events)
									.where(
										x =>
											!!x.categories &&
											x.categories.length > 0 &&
											x.categories[0] ===
												`ws#${rcmail.env.current_workspace_uid}`,
									)
									.select(x => {
										return {
											title: x.title,
											start: x.start,
											end: x.end,
											resourceId: 'wsp',
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

								PlanningManager.events[start.format(DATE_FORMAT)] = events;
							}

							callback(events);

							if (!go) PlanningManager.loading.pop();

							if (PlanningManager.loading.length === 0) {
								$('#wsp-block-calendar .block-header .btn-arrow')
									.removeClass('disabled')
									.removeAttr('disabled');
							}
						},
						id: 'events',
					},
				],
			});
			calendar.render();

			change_date = () => {};

			$('#wsp-block-calendar .block-header .btn-arrow').each((i, e) => {
				e = $(e);
				switch (i) {
					case 0:
						e.off('click').on('click', async () => {
							calendar.prev();
							$('.swp-agenda-date').text(
								$('#wsp-block-calendar .fc-left h2').text(),
							);
						});
						break;

					case 1:
						e.off('click').on('click', async () => {
							calendar.next();
							$('.swp-agenda-date').text(
								$('#wsp-block-calendar .fc-left h2').text(),
							);
						});
						break;

					default:
						break;
				}
				calendar.render();
			});

			MelObject.Empty()
				.get_custom_rules()
				.addAdvanced(
					'planning',
					'#wsp-block-calendar .fc-left h2',
					'display:none',
				);

			$('.swp-agenda-date').text($('#wsp-block-calendar .fc-left h2').text());
		}
	}

	static async GenerateEvents(date = moment()) {
		// const resources =
		// 	date.format(DATE_FORMAT) === moment().format(DATE_FORMAT)
		// 		? await this.LoadResources()
		// 		: await this.GenerateResources(date);
		let resources;

		if (date.format(DATE_FORMAT) === moment().format(DATE_FORMAT))
			resources = await this.LoadResources();
		else resources = await this.GenerateResources(date);

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

	static async LoadResources() {
		let resources = FreeBusyLoader.Instance.load_from_memory(
			rcmail.env.wsp_shares,
			FreeBusyLoader.Instance.interval,
		);

		if (!resources || Object.keys(resources).length === 0) {
			resources = await this.GenerateResources();
		} else {
			resources = MelEnumerable.from(resources)
				.select(x => x.value)
				.select(x => {
					return { id: x.email, title: x.email, slot: x };
				});

			resources = MelEnumerable.from([
				{
					id: 'wsp',
					title: $('.header-wsp').text(),
				},
			])
				.aggregate(resources)
				.toArray();

			FreeBusyLoader.Instance.clear_in_memory();

			this.memory_clear = true;
		}

		return resources;
	}

	static async GenerateResources(date = moment()) {
		let resources = [];

		resources.push({
			id: 'wsp',
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
				title: iterator.email,
				slot: iterator,
			});
		}

		return resources;
	}

	static AddListeners() {
		// This is a placeholder for the add listeners method
	}

	static AddCommands() {
		// This is a placeholder for the add commands method
	}
}
