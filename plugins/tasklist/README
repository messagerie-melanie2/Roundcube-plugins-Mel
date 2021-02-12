A task management module for Roundcube
--------------------------------------

This plugin currently supports a local database as well as a Kolab groupware
server as backends for tasklists and todo items storage.


REQUIREMENTS
------------

Some functions are shared with other plugins and therefore being moved to
library plugins. Thus in order to run the tasklist plugin, you also need the
following plugins installed:

* kolab/libcalendaring [1]
* kolab/libkolab [1]


INSTALLATION
------------

For a manual installation of the plugin (and its dependencies),
execute the following steps. This will set it up with the database backend
driver.

1. Get the source from git

  $ cd /tmp
  $ git clone https://git.kolab.org/diffusion/RPK/roundcubemail-plugins-kolab.git
  $ cd /<path-to-roundcube>/plugins
  $ cp -r /tmp/roundcubemail-plugins-kolab/plugins/tasklist .
  $ cp -r /tmp/roundcubemail-plugins-kolab/plugins/libcalendaring .
  $ cp -r /tmp/roundcubemail-plugins-kolab/plugins/libkolab .

2. Create tasklist plugin configuration

  $ cd tasklist/
  $ cp config.inc.php.dist config.inc.php
  $ edit config.inc.php

3. Initialize the tasklist database tables

  $ cd ../../
  $ bin/initdb.sh --dir=plugins/tasklist/drivers/database/SQL

4. Build css styles for the Elastic skin

  $ lessc --relative-urls -x plugins/libkolab/skins/elastic/libkolab.less > plugins/libkolab/skins/elastic/libkolab.min.css

5. Enable the tasklist plugin

  $ edit config/config.inc.php

Add 'tasklist' to the list of active plugins:

  $config['plugins'] = array(
    (...)
    'tasklist',
  );


IMPORTANT
---------

This plugin doesn't work with the Classic skin of Roundcube because no
templates are available for that skin.

Use Roundcube `skins_allowed` option to limit skins available to the user
or remove incompatible skins from the skins folder.

[1] https://git.kolab.org/diffusion/RPK/
