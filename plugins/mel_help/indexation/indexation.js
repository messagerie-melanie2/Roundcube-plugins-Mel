/**
 * Script d'indexation pour l'aide Bnum
 */
var urlPart = 'co/index.txt';

window.addEventListener('load', (event) => {
    // Ajout de l'url
    document.getElementById('launch').onclick = (event) => {
        if (document.getElementById('url').value.length > 20) {
            launchIndexation(document.getElementById('url').value);
        }
    };
});

/**
 * Fonction de lancement de l'indexation
 * 
 * @param string url 
 */
function launchIndexation(url) {
    document.getElementById('message').innerText = 'Chargement en cours de l\'url ' + url;

    const myRequest = new Request(url + '/' + window.urlPart);
    fetch(myRequest)
        .then((response) => response.text())
        .then((text) => {
            document.getElementById('message').innerText = 'URL Chargée ' + text.length + ' caractères trouvés';
            analyzeData(text);
        });
}

/**
 * Analyse les données d'indexation récupérée
 * 
 * @param {*} result 
 */
function analyzeData(result) {
    window.words = {};
    result = result.split(/\r?\n/);
    for (let index = 0; index < result.length; index++) {
        const line = result[index];
        if (index === 0) {
            window.pages = JSON.parse(line);
        }
        else if (index === 1) {}
        else if (index === 2) {
            let exclude = JSON.parse(line);
            for (const filter of exclude.filters) {
                if (filter.type == 'ignoreWords') {
                    window.ignoreWords = filter.words;
                    break;
                }
            }
        }
        else {
            const words_index = line.split(/\t/);
            const word = words_index.shift();
            window.words[word] = words_index;
        }
    }
    document.getElementById('message').innerHTML = 'Traitement fait<br>' + Object.keys(window.pages).length + ' pages trouvées<br>' + Object.keys(window.words).length + ' mots trouvés';
    getDataFromPages();
}

/**
 * Parcours toutes les pages pour générer l'url et récupérer les data
 */
function getDataFromPages() {
    window.pages_data = {};
    window.pages_count = 0;
    document.getElementById('message').innerHTML = '';
    for (const key in window.pages) {
        if (Object.hasOwnProperty.call(window.pages, key)) {
            const element = window.pages[key];
            if (element == 'co/about.html' || element == 'co/glossary.html') {
                continue;
            }
            const url = document.getElementById('url').value + '/' + element;
            window.pages_count++;
            getDataFromPage(key, url);
        }
    }
}

/**
 * Récupère les data d'une page dans un DOM
 * 
 * @param {*} key 
 * @param {*} url 
 */
function getDataFromPage(key, url) {
    const myRequest = new Request(url);
    fetch(myRequest)
        .then((response) => response.text())
        .then((html) => {
            const parser = new DOMParser();
            window.pages_data[key] = parser.parseFromString(html, "text/html");
            const regEx = new RegExp("⚓", "g");
            const title = window.pages_data[key].querySelector('main h1').innerText.replace(regEx, '');
            document.getElementById('message').innerHTML += 'Page ' + title + ' chargée<br>'
            window.pages_count--;

            if (window.pages_count === 0) {
                indexPages();
            }
        });
}

/**
 * Lancement de l'indexation des pages
 */
function indexPages() {
    document.getElementById('message').innerHTML += '<br>Lancement de l\'indexation des pages...<br>';
    window.indexation = [];

    for (const key in window.pages_data) {
        if (Object.hasOwnProperty.call(window.pages_data, key)) {
            const page = window.pages_data[key];
            indexPage(key, page);
        }
    }

    document.getElementById('message').innerHTML += '<br>Indexation terminée<br>';
    document.getElementById('result').innerText = JSON.stringify(window.indexation);
}

/**
 * Indexation d'une page
 * 
 * @param {*} key 
 * @param {*} page 
 */
function indexPage(key, page) {
    const regEx = new RegExp("⚓", "g");
    const title = page.querySelector('main h1').innerText.replace(regEx, '');

    document.getElementById('message').innerHTML += '<br>Indexation de la page ' + title +'<br>';

    const sections = page.querySelectorAll('section');
    for (const section of sections) {
        if (section.querySelector('h2')) {
                       
            const item = {
                title: title + ' - ' + section.querySelector('h2').innerText.replace(regEx, ''),
                description: '',
                keywords: getKeywords(title + ' ' + section.querySelector('h2').innerText.replace(regEx, '')),
                help_name: "En savoir plus...",
                help_url: getUrl(window.pages[key], section),
                help_title: "Ouvrez l'aide pour en découvrir plus sur " + title
            };

            const section_descriptions = section.querySelectorAll('p.txt_p');
            if (section_descriptions[0]) {
                item.description = section_descriptions[0].innerText;
            }

            document.getElementById('message').innerHTML += 'Section ' + item.title + ' / Description ' + item.description.length + '<br>';
            window.indexation.push(item);
        }
    }
}

/**
 * Génére une liste de mots clés à partir du text
 * 
 * @param {*} text 
 * @returns 
 */
function getKeywords(text) {
    let keywords = [];
    text = text.split(' ');
    for (let index = 0; index < text.length; index++) {
        const word = text[index].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (word.length > 3 
                && !window.ignoreWords[word] 
                && keywords.indexOf(word) === -1
                && keywords.indexOf(word+'s') === -1
                && keywords.indexOf(word+'r') === -1) {
            keywords.push(word);
        }
    }
    return keywords;
}

/**
 * Génère l'url à partir de la page donnnées et de la section
 * 
 * @param {*} page 
 * @param {*} section 
 */
function getUrl(page, section) {
    let split_url = document.getElementById('url').value.split('/');
    split_url.shift();
    split_url.shift();
    split_url.shift();
    const help_url = split_url.join('/');
    const regExCo = new RegExp('co/', 'g');
    const regExHtml = new RegExp('.html', 'g');

    return '/' + help_url + '/index.html' + page.replace(regExCo, '#').replace(regExHtml, '') + ':' + section.querySelector('h2').id
}