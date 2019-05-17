<?php

/**
 * vCard to CSV converter
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

class vcard2csv
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
                        'name'              => $this->plugin->gettext("Display Name"),
                        'prefix'            => $this->plugin->gettext("Prefix"),
                        'firstname'         => $this->plugin->gettext("First Name"),
                        'middlename'        => $this->plugin->gettext("Middle Name"),
                        'surname'           => $this->plugin->gettext("Last Name"),
                        'suffix'            => $this->plugin->gettext("Suffix"),
                        'nickname'          => $this->plugin->gettext("Nick Name"),
                        
                        'birthday'          => $this->plugin->gettext("Birthday"),
//                         'anniversary'       => $this->plugin->gettext("Anniversary"),
                        
                        'email:home'        => $this->plugin->gettext("E-mail - Home"),
                        'email:work'        => $this->plugin->gettext("E-mail - Work"),
                        'email:other'       => $this->plugin->gettext("E-mail - Other"),
                        
                        'address:home^street'   => $this->plugin->gettext("Home Address Street"),
                        'address:home^locality' => $this->plugin->gettext("Home Address City"),
                        'address:home^zipcode'  => $this->plugin->gettext("Home Address Zip Code"),
                        'address:home^region'   => $this->plugin->gettext("Home Address Region"),
                        'address:home^country'  => $this->plugin->gettext("Home Address Country"),
                        
                        'address:work^street'   => $this->plugin->gettext("Work Address Street"),
                        'address:work^locality' => $this->plugin->gettext("Work Address City"),
                        'address:work^zipcode'  => $this->plugin->gettext("Work Address Zip Code"),
                        'address:work^region'   => $this->plugin->gettext("Work Address Region"),
                        'address:work^country'  => $this->plugin->gettext("Work Address Country"),
                        
                        'address:other^street'   => $this->plugin->gettext("Other Address Street"),
                        'address:other^locality' => $this->plugin->gettext("Other Address City"),
                        'address:other^zipcode'  => $this->plugin->gettext("Other Address Zip Code"),
                        'address:other^region'   => $this->plugin->gettext("Other Address Region"),
                        'address:other^country'  => $this->plugin->gettext("Other Address Country"),
                        
                        'phone:home'        => $this->plugin->gettext("Home Phone"),
                        'phone:work'        => $this->plugin->gettext("Work Phone"),
                        'phone:mobile'      => $this->plugin->gettext("Mobile Phone"),
                        'phone:other'       => $this->plugin->gettext("Other Phone"),
                        'phone:homefax'     => $this->plugin->gettext("Home Fax"),
                        'phone:workfax'     => $this->plugin->gettext("Work Fax"),
                        'phone:pager'       => $this->plugin->gettext("Pager"),
                        
                        'organization'      => $this->plugin->gettext("Organization"),
                        'department'        => $this->plugin->gettext("Department"),
                        'jobtitle'          => $this->plugin->gettext("Job Title"),
                        'manager'           => $this->plugin->gettext("Manager"),
                        
//                         'gender'            => $this->plugin->gettext("Gender"),
//                         'assistant'         => $this->plugin->gettext("Assistant"),
//                         'phone:assistant'   => $this->plugin->gettext("Assistant's Phone"),
//                         'spouse'            => $this->plugin->gettext("Spouse"),
                        
                        'groups'            => $this->plugin->gettext("Categories"),
                        'notes'             => $this->plugin->gettext("Notes"),
                        
                        'website:homepage'  => $this->plugin->gettext("Home Web Page"),
                        'website:work'      => $this->plugin->gettext("Work Web Page"),
                        
//                         'im:jabber' => $this->plugin->gettext("Jabber"),
//                         'im:skype'  => $this->plugin->gettext("Skype"),
//                         'im:msn'    => $this->plugin->gettext("MSN"),
        );
    }


    /**
     * Convert vCard to CSV record
     *
     * @param string $vcard vCard data (single contact)
     *
     * @return string CSV record
     */
    public function record($vcard)
    {
        // Parse vCard
        $rcube_vcard = new rcube_vcard();
        $list        = $rcube_vcard->import($vcard);

        if (empty($list)) {
            return;
        }

        // Get contact data
        $data = $list[0]->get_assoc();
        $csv  = array();

        foreach (array_keys($this->fields) as $key) {
            list($key, $subkey) = explode('^', $key);
            $value = $data[$key];

            if (is_array($value)) {
                $value = $value[0];
            }

            if ($subkey) {
                $value = is_array($value) ? $value[$subkey] : '';
            }

            switch ($key) {
            case 'groups':
                $value = implode(';', (array) $data['groups']);
                break;
/*
            case 'photo':
                if ($value && !preg_match('/^https?:/', $value)) {
                    $value = base64_encode($value);
                }
                break;
*/
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
    public static function headers($filename = 'contacts.csv')
    {
        // send downlaod headers
        header('Content-Type: text/csv; charset=' . RCUBE_CHARSET);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
    }

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
