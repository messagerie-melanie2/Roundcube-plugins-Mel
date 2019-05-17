<?php

/**
 * Task/Event to CSV converter
 *
 * @version @package_version@
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2011-2016, Kolab Systems AG <contact@kolabsys.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

class event2csv
{
    /**
     * CSV label to text mapping for English
     *
     * @var array
     */
    protected $fields = array();
    
    /**
     * Plugin csv_export
     * @var rcube_plugin
     */
    private $plugin;
    
    /**
     * Construct to translate fields
     */
    public function __construct($plugin) {
        $this->plugin = $plugin;
        
        $this->fields = array(
                        'uid'              => $this->plugin->gettext("UID"),
                        'title'            => $this->plugin->gettext("Title"),
                        'description'      => $this->plugin->gettext("Description"),
                        'start'            => $this->plugin->gettext("Start"),
                        'due'              => $this->plugin->gettext("Due"),
                        'organizer_name'   => $this->plugin->gettext("Organizer Name"),
                        'organizer_email'  => $this->plugin->gettext("Organizer Email"),
        );
    }


    /**
     * Convert task/event to CSV record
     *
     * @param string $event Event data
     *
     * @return string CSV record
     */
    public function record($event)
    {
        $csv = array();

        foreach (array_keys($this->fields) as $key) {
            $value = $event[$key];

            switch ($key) {
            case 'start':
            case 'due':
                if ($value) {
                    $value = $value->format($value->_dateonly ? 'Y-m-d' : 'Y-m-d H:i:s');
                }
                break;

            case 'organizer_email':
                $value = $event['organizer']['email'];
                break;

            case 'organizer_name':
                $value = $event['organizer']['name'];
                break;
            }

            $csv[] = $value;
        }

        return $this->csv($csv);
    }

    /**
     * Build csv data header (list of field names)
     *
     * @return string CSV file header
     */
    public function head()
    {
        return $this->csv($this->fields);
    }

    /**
     * Send headers of file download
     */
    public static function headers($filename = 'tasks.csv')
    {
        // send downlaod headers
        header('Content-Type: text/csv; charset=' . RCUBE_CHARSET);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
    }

    /**
     * Creates CSV record
     */
    protected function csv($fields = array(), $delimiter = ',', $enclosure = '"')
    {
        $str         = '';
        $escape_char = "\\";

        foreach ($fields as $value) {
            if (strpos($value, $delimiter) !== false
                || strpos($value, $enclosure) !== false
                || strpos($value, ' ') !== false
                || strpos($value, "\n") !== false
                || strpos($value, "\r") !== false
                || strpos($value, "\t") !== false
            ) {
                $str2    = $enclosure;
                $escaped = 0;
                $len     = strlen($value);

                for ($i=0; $i<$len; $i++) {
                    if ($value[$i] == $escape_char) {
                        $escaped = 1;
                    }
                    else if (!$escaped && $value[$i] == $enclosure) {
                        $str2 .= $enclosure;
                    }
                    else {
                        $escaped = 0;
                    }

                    $str2 .= $value[$i];
                }

                $str2 .= $enclosure;
                $str  .= $str2 . $delimiter;
            }
            else {
                $str .= $value . $delimiter;
            }
        }

        if (!empty($fields)) {
            $str[strlen($str)-1] = "\n";
        }

        return $str;
   }
}
