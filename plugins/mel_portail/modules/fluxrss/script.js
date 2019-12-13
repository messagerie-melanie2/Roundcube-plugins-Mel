var rssTimeouts = {};

for ( var id in rcmail.env.portail_items) {
	if (rcmail.env.portail_items[id].type == 'fluxrss') {
		readRss(id, rcmail.env.portail_items[id].rss);
	}
}

function readRss(id, feedUrl) {
	window.clearTimeout(window.rssTimeouts[id]);
	window.rssTimeouts[id] = setTimeout(() => {
		fetch(feedUrl).then((res) => {
		  res.text().then((xmlTxt) => {
		    var domParser = new DOMParser()
		    let doc = domParser.parseFromString(xmlTxt, 'text/xml')
		    var ul = document.querySelector('#' + id + ' .front ul.news');
		    if (!ul) {
		    	ul = document.createElement('ul');
		    	ul.className = 'news';
		    	document.querySelector('#' + id + ' .front').appendChild(ul);
		    }
		    ul.innerHTML = '';
		    var back = document.querySelector('#' + id + ' .back');
		    if (back) {
		    	var ul_back = back.querySelector('ul.news');
		    	if (!ul_back) {
		    		ul_back = document.createElement('ul');
		    		ul_back.className = 'news';
		    		back.appendChild(ul_back);
		    	}
		    }
		    var items = doc.querySelectorAll('item');
		    for (let i = 0; i < Math.min(items.length, 5); i++) {
		      if (i < 1) {
		      	let item = items[i];
			      let li = document.createElement('li');
			    	let a = document.createElement('a');
			    	a.href = item.querySelector('link').textContent;
			    	li.appendChild(a)
			      ul.appendChild(li);
			    	let h1 = document.createElement('h1');
			      h1.textContent = item.querySelector('title').textContent;
			      a.appendChild(h1)
			      let span = document.createElement('span');
			      span.innerHTML = item.querySelector('description').textContent;
			      a.appendChild(span)
		      }
		      else if (ul_back) {
		      	let item = items[i];
			      let li = document.createElement('li');
			    	let a = document.createElement('a');
			    	a.href = item.querySelector('link').textContent;
			    	li.appendChild(a)
			      ul_back.appendChild(li);
			    	let h1 = document.createElement('h1');
			      h1.textContent = item.querySelector('title').textContent;
			      a.appendChild(h1)
			      let span = document.createElement('span');
			      span.innerHTML = item.querySelector('description').textContent;
			      a.appendChild(span)
		      }
		    }
		  });
		});
	}, 500);
}
