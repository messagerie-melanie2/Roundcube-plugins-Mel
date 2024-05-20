$(document).ready(() => {
	const BUTTON_CONTAINER = '#notification-sound-container';

	let $querry = $(BUTTON_CONTAINER);

	if ($querry.length > 0) {
		$querry.html(
			$(
				'<button class="mel-button no-button-margin no-margin-button" type="button">Tester</button>',
			).click(() => {
				play_sound();
			}),
		);
	}

	function play_sound(sound = 'sound', ext = 'mp3') {
		var audio = new Audio(
			window.location.origin +
				window.location.pathname +
				`/plugins/mel_notification/${sound}.${ext}`,
		);
		audio.addEventListener('ended', () => {
			audio.remove();
			audio = null;
		});

		audio.play();
	}
});
