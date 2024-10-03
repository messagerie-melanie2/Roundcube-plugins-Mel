<?php
/**
 * Fichier d'index contenant la liste des pages d'aide pour Mél
 */

// Inclus la config
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link rel="stylesheet" href="style.css?s=4987593847" />
<link rel="stylesheet" href="custom.css?s=4987593847" />
<link rel="icon" type="image/png" href="images/favicon_help.png" />
<title><?= $config['title'] ?></title>
</head>
<body>
  <div id="prevcontent">
    <h1><?= $config['title'] ?></h1>
    <div id="content">
    	<?php 
        if (isset($config['search'])) {
      ?>
      <div id="help-search">
      	<span class="help-search-label"><?= $config['search label'] ?></span>
      	<span class="help-search-input"><input type="text" placeholder="<?= $config['search placeholder'] ?>" onkeyup="search(event, this);"></span>
      </div>
      <div id="help-search-results"></div>
      <?php 
        }
      ?>    
      <div id="help-url-list">
        <ul>
        <?php
          foreach($config['pages'] as $name => $page) {
            if ($page['show']) {
            ?>
              <li title="<?= $page['title'] ?>" class="<?= $page['class'] ?>">
                <a target="_blank" href="<?= $page['url'] ?>">
                  <span class="image"></span>
                  <span class="name"><?= $name ?></span>
                </a>
              </li>
            <?php
            }
          }
        ?>
        </ul>
      </div>
      <div id="help-details">
          <?php
          foreach($config['details'] as $name => $list) {
            if ($list['show']) {
            ?>
              <div class="details">
                <span class="name">
                  <?= $name ?>
                </span>
                <div class="list">
                  <ul>
                    <?php
                    foreach($list as $object_name => $object) {
                      if ($object['show'] && $object_name != 'show') {
                    ?>
                      	<li title="<?= $object['title'] ?>"><a target="_blank" href="<?= $object['url'] ?>"><?= $object_name ?></a></li>
                    <?php
                      }
                    }
                    ?>
                  </ul>
                </div>
              </div>
            <?php
            }
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
	<?php 
	$index = [];
	foreach ($config['search'] as $k => $s) {
	  if ($s['show']) {
	    foreach ($s['keywords'] as $word) {
	      if (isset($index[$word])) {
	        if (!in_array($k, $index[$word])) {
	          $index[$word][] = $k;
	        }
	      }
	      else {
	        $index[$word] = [$k];
	      }
	    }
	  }
	  else {
	    unset($config['search'][$k]);
	  }
	}
	?>
  var _search = <?= json_encode($config['search']) ?>;
  var _index = <?= json_encode($index) ?>;
  var handle;

  function search(event, object) {
    if (event.keyCode == 27) {
      object.value = "";
      document.getElementById("help-search-results").innerHTML = "";
      document.getElementById("help-search-results").style = "display: none;";
      return;
    }
    var results = {};
    if (object.value.length > 3) {
      if (handle) {
        clearTimeout(handle);
      }
    	handle = setTimeout(function() {
      	var values = object.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ');
        for (const word in _index) {
          for (const value of values) {
            if (value.length > 3) {
              if (word.indexOf(value) !== -1) {
                for (const key of _index[word]) {
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
        if (Object.keys(results).length) {
          var _res = [];
       		// Trier les résultats
          for (const key in results) {
            _res.push({key: key, value: results[key]});
          }
          _res.sort((a, b) => (a.value < b.value) ? 1 : -1)
          document.getElementById("help-search-results").style = "display: block;";
          document.getElementById("help-search-results").innerHTML = "";
          var i = 0;
          for (const r of _res) {
            if (i++ > 5)  {
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
            numbers.textContent = r.value === 1 ? "(1 <?= $config['search result label'] ?>)" : "(" + r.value + " <?= $config['search results label'] ?>)";
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
        else {
          document.getElementById("help-search-results").style = "display: block; text-align: center;";
          document.getElementById("help-search-results").textContent = "<?= $config['search no result'] ?>";
        }
    	}, 300);
    }
    else {
      document.getElementById("help-search-results").innerHTML = "";
      document.getElementById("help-search-results").style = "display: none;";
    }
  }
</script>
<?php 
}
?>