function joinWebConf(id = 'webconf') {
 	var conf = prompt("Quelle conférence souhaitez-vous rejoindre ?", generateRoomName());
	var validName = /^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$/.test(conf);
	if (validName) {
		if (rcmail.env.portail_items[id].jwt) {
			rcmail.http_get('portail/webconf_jwt', {
				_room : conf,
				_id : id
			}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
		}
		else {
			rcmail.portail_open_url(id, rcmail.env.portail_items[id].url + conf);
		}
		
	}
	else if (!validName && conf!==null){
		alert("Le nom de la conférence est invalide. Le nom de la conférence doit contenir un minimum de 10 caractères dont au moins 3 chiffres. Ces caractères sont exclusivement des lettres de l’alphabet et des chiffres, la casse (Min/Maj) n’a pas d’importance.");
		joinWebConf(id);
	}
}

//Shuffle array elements
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

// Generate random roomName
function generateRoomName() {
	var charArray= ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
	var digitArray= ["0","1","2","3","4","5","6","7","8","9"];
	var roomName = shuffle(digitArray).join("").substring(0,3) + shuffle(charArray).join("").substring(0,7);
	return shuffle(roomName.split("")).join("");
}

if (window.rcmail) {
	// Call refresh panel
	rcmail.addEventListener('responseafterwebconf_jwt', function(evt) {
		if (evt.response.id) {
			rcmail.portail_open_url(evt.response.id, rcmail.env.portail_items[evt.response.id].url + evt.response.room + '?jwt=' + evt.response.jwt);
		}
	});
}
