<?php

// backend type (database, kolab)
$config['tasklist_driver'] = $_ENV['RC_TASKLIST_DRIVER'] ?? 'kolab';

// default sorting order of tasks listing (auto, datetime, startdatetime, flagged, complete, changed)
$config['tasklist_sort_col'] = $_ENV['RC_TASKLIST_SORT_COL'];

// default sorting order for tasks listing (asc or desc)
$config['tasklist_sort_order'] = $_ENV['RC_TASKLIST_SORT_ORDER'] ?? 'asc';

