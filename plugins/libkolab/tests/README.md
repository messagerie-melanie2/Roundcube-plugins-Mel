libkolab plugin tests
=====================

In order to run the functional tests for libkolab classes, some configuration 
for the Roundcube test instance need to be created. Along with the default 
config for a given Roundcube instance, you should provide a config specifically 
for running tests. To do so, create a config file named `config-test.inc.php` 
in the regular Roundcube config dir. That should provide specific `db_dsnw` and 
`default_host` values for testing purposes as well as the credentials of a 
valid IMAP user account used for running the tests with.

Add these config options used by the libkolab tests:

```
  // Unit tests settings
  $config['tests_username'] = 'roundcube.test@example.org';
  $config['tests_password'] = '<test-account-password>';
  $config['default_host']   = '<kolab-server>';
  
  // disable all plugins
  $config['plugins'] = array();
```

WARNING
-------
Please note that the configured IMAP account as well as the Roundcube database 
configred in `db_dsnw` will be wiped and filled with test data in every test 
run. Under no circumstances you should use credentials of a production database 
or email account!


Run the tests
-------------

The tests are based on PHPUnit and need to be exected from the Roundcube
test directory in order to load and initialize the Roundcube framework context.

To execute individual tests, call `phpunit` from the tests directory:

```
  cd <roundcube-dir>/tests/
  phpunit ../plugins/libkolab/tests/<filename>
```