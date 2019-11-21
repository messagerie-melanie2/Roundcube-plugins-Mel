<?php
/**
 * Fichier d'index contenant la liste des pages d'aide pour Mél
 */

// Inclus la config
require_once 'config.php';
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link rel="stylesheet" href="style.css" />
<link rel="stylesheet" href="custom.css" />
<link rel="icon" type="image/png" href="images/favicon_help.png" />
<title>Aide Mél</title>
</head>
<body>
  <div id="prevcontent">
    <h1>Aide Mél</h1>
    <div id="content">
    	<?php 
        if (isset($config['search'])) {
      ?>
      <div id="help-search">
      	<span class="help-search-label">Recherche rapide dans la documentation : </span>
      	<span class="help-search-input"><input type="text" placeholder="Saisissez des mots clés" onkeyup="search(event, this);"></span>
      </div>
      <div id="help-search-results"></div>
      <?php 
        }
      ?>    
      <div id="help-url-list">
        <ul>
        <?php
          foreach($config['pages'] as $name => $page) {
            ?>
              <li class="<?= $page['class'] ?>">
                <a href="<?= $page['url'] ?>">
                  <span class="image"></span>
                  <span class="name"><?= $name ?></span>
                </a>
              </li>
            <?php
          }
        ?>
        </ul>
      </div>
      <div id="help-details">
          <?php
          foreach($config['details'] as $name => $list) {
            ?>
              <div class="details">
                <span class="name">
                  <?= $name ?>
                </span>
                <div class="list">
                  <ul>
                    <?php
                    foreach($list as $list_name => $list_url) {
                    ?>
                      <li><a href="<?= $list_url ?>"><?= $list_name ?></a></li>
                    <?php
                    }
                    ?>
                  </ul>
                </div>
              </div>
            <?php
          }
        ?>
      </div>
    </div>
    <div id="copyright"><?= $config['copyright'] ?></div>
  </div>
</body>
</html>
<?php 
if (isset($config['search'])) {
?>
<script type="text/javascript">
  var _search = <?= json_encode($config['search']) ?>;
  var handle;
  
  function search(event, object) {
    var results = {};
    document.getElementById("help-search-results").innerHTML = "";
    document.getElementById("help-search-results").style = "display: none;";
    if (object.value.length > 3) {
      if (handle) {
        clearTimeout(handle);
      }
    	handle = setTimeout(function() {
        //var value = object.value.toLowerCase();
        for (const value of object.value.toLowerCase().split(' ')) {
          value.trim();
          if (value.length > 3) {
            for (const key in _search) {
              var keywords = _search[key].keywords;
              for (const k in _search[key].keywords) {
                if (_search[key].keywords[k].indexOf(value) !== -1) {
                  if (results[key]) {
                    results[key]++;
                  }
                  else {
                    results[key] = 1;
                  }
                }
              }
            }
          }
        }
        
        if (results) {
          var _res = [];
       		// Trier les résultats
          for (const key in results) {
            _res.push({key: key, value: results[key]});
          }
          _res.sort((a, b) => (a.value < b.value) ? 1 : -1)
          document.getElementById("help-search-results").style = "display: block;";
          var i = 0;
          for (const r of _res) {
            if (i++ > 4)  {
              break;
            }
            var title = document.createElement('span');
            title.className = "title";
            title.textContent = _search[r.key].title;
            var description = document.createElement('span');
            description.className = "description";
            description.textContent = _search[r.key].description;
            var numbers = document.createElement('span');
            numbers.className = "numbers";
            numbers.textContent = "(" + r.value + " résultat(s))";
            var url = document.createElement('a');
            url.href = _search[r.key].url;
            url.target = "_blank";
            url.appendChild(title);
            url.appendChild(numbers);
            url.appendChild(description);
            var result = document.createElement('div');
            result.className = "result";
            result.appendChild(url);
            document.getElementById("help-search-results").appendChild(result);
          }
        }
    	}, 350);
    }
  }
</script>
<?php 
}
?>