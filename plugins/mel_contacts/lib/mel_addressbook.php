<?php

use LibMelanie\Api\Melanie2;

// LibM2 ORM
@include_once 'includes/libm2.php';

require_once('mel_contacts_mapping.php');

class mel_addressbook extends rcube_addressbook
{
    /**
     * @var rcube
     */
    private $rc;
    /**
     * @var LibMelanie\Api\Melanie2\Addressbook
     */
    private $addressbook;
    /**
     * @var LibMelanie\Api\Melanie2\User
     */
    private $user;
    /**
     * @var rcube_result_set
     */
    private $result;
    /**
     * @var mixed Search params to use in listing method, obtained by get_search_set()
     */
    private $filter;
    /**
     * ctag du carnet d'adresse en cours
     * @var string
     */
    private $ctag;
    /**
     * Durée de conservation du ctag
     * @var string
     */
    const CTAG_REFRESH = 60;

    const ENABLE_CACHE = false;

    /**
     * Constructeur de la classe
     * @param rcube $rc
     * @param LibMelanie\Api\Melanie2\User $user
     * @param LibMelanie\Api\Melanie2\Addressbook $addressbook
     */
    function __construct($rc, $user, $addressbook) {
        $this->rc = $rc;
        $this->user = $user;
        $this->addressbook = $addressbook;

        $this->ready    = true;
        $this->groups   = true;
        $this->readonly = !$this->addressbook->asRight(LibMelanie\Config\ConfigMelanie::WRITE);

        $this->coltypes = array(
            'name'         => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('name'), 'category' => 'main'),
            'firstname'    => array('type' => 'text', 'size' => 19, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('firstname'), 'category' => 'main'),
            'surname'      => array('type' => 'text', 'size' => 19, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('surname'), 'category' => 'main'),
            'email'        => array('type' => 'text', 'size' => 40, 'maxlength' => 254, 'label' => $this->rc->gettext('email'), 'subtypes' => array('home','work','other'), 'category' => 'main', 'limit' => 3),
            'middlename'   => array('type' => 'text', 'size' => 19, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('middlename'), 'category' => 'main'),
            'prefix'       => array('type' => 'text', 'size' => 8,  'maxlength' => 20, 'limit' => 1, 'label' => $this->rc->gettext('nameprefix'), 'category' => 'main'),
            'suffix'       => array('type' => 'text', 'size' => 8,  'maxlength' => 20, 'limit' => 1, 'label' => $this->rc->gettext('namesuffix'), 'category' => 'main'),
            'nickname'     => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('nickname'), 'category' => 'main'),
            'jobtitle'     => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('jobtitle'), 'category' => 'main'),
            'organization' => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('organization'), 'category' => 'main'),
            'category'   => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'limit' => 1, 'label' => $this->rc->gettext('categories', 'mel_contacts'), 'category' => 'personal'),
            'phone'        => array('type' => 'text', 'size' => 40, 'maxlength' => 20, 'label' => $this->rc->gettext('phone'), 'subtypes' => array('home','work','mobile','fax','pager'), 'category' => 'main', 'limit' => 5),
            'address'      => array('type' => 'composite', 'label' => $this->rc->gettext('address'), 'subtypes' => array('home','work'), 'childs' => array(
                'street'     => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'label' => $this->rc->gettext('street'), 'category' => 'main'),
                'locality'   => array('type' => 'text', 'size' => 28, 'maxlength' => 50, 'label' => $this->rc->gettext('locality'), 'category' => 'main'),
                'zipcode'    => array('type' => 'text', 'size' => 8,  'maxlength' => 15, 'label' => $this->rc->gettext('zipcode'), 'category' => 'main'),
                'region'     => array('type' => 'text', 'size' => 12, 'maxlength' => 50, 'label' => $this->rc->gettext('region'), 'category' => 'main'),
                'country'    => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'label' => $this->rc->gettext('country'), 'category' => 'main'),), 'category' => 'main'),
            'birthday'     => array('type' => 'date', 'size' => 12, 'maxlength' => 16, 'label' => $this->rc->gettext('birthday'), 'limit' => 1, 'render_func' => 'rcmail_format_date_col', 'category' => 'personal'),
            'website'      => array('type' => 'text', 'size' => 40, 'maxlength' => 50, 'label' => $this->rc->gettext('website'), 'subtypes' => array('homepage','freebusy'), 'category' => 'main'),
            'notes'        => array('type' => 'textarea', 'size' => 40, 'rows' => 15, 'maxlength' => 500, 'label' => $this->rc->gettext('notes'), 'limit' => 1),
            'photo'        => array('type' => 'image', 'limit' => 1, 'category' => 'main'),
        );
    }

    /**
     * Returns addressbook name (e.g. for addressbooks listing)
     */
    function get_name() {
        return $this->addressbook->name;
    }

    /**
     * Save a search string for future listings
     *
     * @param mixed Search params to use in listing method, obtained by get_search_set()
    */
    function set_search_set($filter) {
        $this->filter = $filter;
    }

    /**
     * Getter for saved search properties
     *
     * @return mixed Search properties used by this class
    */
    function get_search_set() {
        return $this->filter;
    }

    /**
     * Reset saved results and search parameters
    */
    function reset() {
        $this->filter = null;
    }

    /**
     * List the current set of contact records
     *
     * @param  array  List of cols to show
     * @param  int    Only return this number of records, use negative values for tail
     * @return array  Indexed list of contact records, each a hash array
     */
    function list_records($cols=null, $subset=0) {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::list_records($cols, $subset)");
        if (isset($this->result)) return $this->result;

        try {
            $count = 0;
            $limit = $this->page_size;
            $offset = $this->page_size * ($this->list_page - 1);
            // Mise en place du subset pour limiter les résultats
            if (isset($subset)) {
                if ($subset > 0) {
                    $limit = $subset;
                } else if ($subset < 0) {
                    $offset = $limit + $subset;
                    $limit = -$subset;
                }
            }
            // Ajoute le support de tous les mails
            if (isset($cols)
                    && in_array('email', $cols)) {
                if (!in_array('email:work', $cols))
                    $cols[] = 'email:work';
                if (!in_array('email:other', $cols))
                    $cols[] = 'email:other';
            }
            if (isset($cols)
                    && !in_array('ID', $cols)) {
                $cols[] = 'ID';
            }

            $this->result = new rcube_result_set();
            if (self::ENABLE_CACHE) {
                $cache = \mel::InitM2Cache();
                if (!isset($this->ctag)) {
                    if (isset($cache['contacts'])
                            && isset($cache['contacts'][$this->addressbook->id])
                            && isset($cache['contacts'][$this->addressbook->id]['ctag'])
                            && isset($cache['contacts'][$this->addressbook->id]['ctag_time'])
                            && time() - $cache['contacts'][$this->addressbook->id]['ctag_time'] < self::CTAG_REFRESH) {
                        $this->ctag = $cache['contacts'][$this->addressbook->id]['ctag'];
                    } else {
                        $this->ctag = $this->addressbook->getCTag();
                        if (isset($cache['contacts'][$this->addressbook->id]['ctag_time'])) {
                            $cache['contacts'][$this->addressbook->id]['ctag_time'] = time();
                        }
                    }
                }
                // Chargement des contacts depuis le cache
                if (isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && isset($cache['contacts'][$this->addressbook->id]['list'])) {
                    if ($cache['contacts'][$this->addressbook->id]['ctag'] == $this->ctag) {
                        $this->result->count = $cache['contacts'][$this->addressbook->id]['count'];
                        if (isset($cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset])
                                && !isset($this->group_id)) {
                            $i = 0;
                            foreach ($cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset] as $_contact) {
                                $_contact = unserialize($_contact);
                                $this->result->add(mel_contacts_mapping::m2_to_rc_contact($cols, $_contact));
                                if ($subset > 0 && $subset == $i) break;
                                $i++;
                            }
                            $this->result->first = $this->page_size * ($this->list_page - 1);
                            return $this->result;
                        }
                    } else {
                        unset($cache['contacts'][$this->addressbook->id]);
                    }
                }
            }

            if (isset($this->group_id)) {
                // Définition des champs à récupérer
                if (!isset($cols)) $cols = array_keys(mel_contacts_mapping::$mapping_contact_cols);
                $fields = array();
                foreach($cols as $col) {
                    $fields[] = mel_contacts_mapping::$mapping_contact_cols[$col];
                }
                // Un groupe est défini
                $_group = new Melanie2\Contact($this->user, $this->addressbook);
                $_group->type = Melanie2\Contact::TYPE_LIST;
                if ($this->group_id == 'favorites') {
                  $_group->uid = $this->group_id;
                }
                else {
                  $_group->id = $this->group_id;
                }                
                foreach($_group->getList(array('uid', 'addressbook', 'members')) as $group) { break; }
                $members = unserialize($group->members);
                if (is_array($members) && count($members) > 0) {
                    // Récupère les contacts membres du groupe
                    $_contact = new Melanie2\Contact($this->user, $this->addressbook);
                    $_contact->type = Melanie2\Contact::TYPE_CONTACT;
                    $_contact->id = $members;
                    $_contacts = $_contact->getList($fields, "", array(), "object_lastname, object_firstname", true, $limit, $offset);                    
                    if ($this->result->count == 0) {
                      $count = count($members);
                    }
                } else $_contacts = array();
            } else {
                $_contact = new Melanie2\Contact($this->user, $this->addressbook);
                $_contact->type = Melanie2\Contact::TYPE_CONTACT;
                $_contacts = $_contact->getList(null, "", array(), "object_lastname, object_firstname", true, $limit, $offset);
                if ($this->result->count == 0) {
                    $nb_contacts = $_contact->getList('count');
                    $count = $nb_contacts['']->count;
                    unset($nb_contacts);
                }
                if (self::ENABLE_CACHE) {
                  if (!isset($cache['contacts'])) $cache['contacts'] = array();
                  if (!isset($cache['contacts'][$this->addressbook->id])) $cache['contacts'][$this->addressbook->id] = array();
                  if (!isset($cache['contacts'][$this->addressbook->id]['list'])) $cache['contacts'][$this->addressbook->id]['list'] = array();
                  $cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset] = array();
                  foreach($_contacts as $_contact) {
                    $cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset][$_contact->id] = serialize($_contact);
                  }
                }
            }

            $i=0;
            foreach ($_contacts as $_contact) {
                $this->result->add(mel_contacts_mapping::m2_to_rc_contact($cols, $_contact));
                if ($subset > 0 && $subset == $i) break;
                $i++;
            }
            $this->result->first = $this->page_size * ($this->list_page - 1);
            if ($this->result->count == 0) {
                $this->result->count = $count;
                if (!isset($cache['contacts'])) $cache['contacts'] = array();
                if (!isset($cache['contacts'][$this->addressbook->id])) $cache['contacts'][$this->addressbook->id] = array();
                $cache['contacts'][$this->addressbook->id]['ctag'] = $this->ctag;
                $cache['contacts'][$this->addressbook->id]['count'] = $count;
                $cache['contacts'][$this->addressbook->id]['ctag_time'] = time();
            }
            \mel::SetM2Cache($cache);
            return $this->result;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::list_records() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Search records
     *
     * @param array   List of fields to search in
     * @param string  Search value
     * @param int     Matching mode:
     *                0 - partial (*abc*),
     *                1 - strict (=),
     *                2 - prefix (abc*)
     * @param boolean True if results are requested, False if count only
     * @param boolean True to skip the count query (select only)
     * @param array   List of fields that cannot be empty
     * @return object rcube_result_set List of contact records and 'count' value
    */
    function search($fields, $value, $mode=0, $select=true, $nocount=false, $required=array()) {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::search($fields, $value, $mode, $select, $nocount, $required");
        try {
            $_contact = new Melanie2\Contact($this->user, $this->addressbook);
            $_contact->type = Melanie2\Contact::TYPE_CONTACT;
            $filter = "(";
            $operators = array();
            $case_unsensitive_fields = array();
            $mode  = intval($mode);
            if (!isset($fields) || $fields == '*') $fields = array("name","firstname","surname","email","birthday");
            else if (!is_array($fields)) $fields = array($fields);
            $searchfields = array("name","firstname","lastname","email","email1","email2","id","birthday");
            foreach($fields as $key => $field) {
                if (isset(mel_contacts_mapping::$mapping_contact_cols[$field])) {
                    $mapfield = mel_contacts_mapping::$mapping_contact_cols[$field];
                    if ($filter != "(") $filter .= " OR ";
                    $filter .= "#$mapfield#";
                    $case_unsensitive_fields[] = $mapfield;
                    if ($mode == 0 || $mode > 2) {
                        if (is_array($value)) {
                            foreach ($value as $kval => $val) {
                                $value[$kval] = '%'.$val.'%';
                            }
                            $_contact->$mapfield = $value;
                        }
                        else {
                            $_contact->$mapfield = '%'.$value.'%';
                        }
                        $operators[$mapfield] = LibMelanie\Config\MappingMelanie::like;
                    } elseif ($mode == 1) {
                        $_contact->$mapfield = $value;
                        $operators[$mapfield] = LibMelanie\Config\MappingMelanie::eq;
                    } elseif ($mode == 2) {
                        if (is_array($value)) {
                            foreach ($value as $kval => $val) {
                                $value[$kval] = $val.'%';
                            }
                            $_contact->$mapfield = $value;
                        }
                        else {
                            $_contact->$mapfield = $value.'%';
                        }
                        $operators[$mapfield] = LibMelanie\Config\MappingMelanie::like;
                    }
                }
            }
            $filter .= ") AND ";
            $filter .= "#addressbook# AND #type#";
            $operators["addressbook"] = LibMelanie\Config\MappingMelanie::eq;
            $operators["type"] = LibMelanie\Config\MappingMelanie::eq;

            $i=0;
            $this->result = new rcube_result_set();
            foreach ($_contact->getList($searchfields, $filter, $operators, "object_lastname, object_firstname", true, null, null, $case_unsensitive_fields) as $_contact) {
                $this->result->add(mel_contacts_mapping::m2_to_rc_contact(null, $_contact));
                $i++;
            }
            $this->result->count = $i;
            return $this->result;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::search() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Count number of available contacts in database
     *
     * @return rcube_result_set Result set with values for 'count' and 'first'
    */
    function count() {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::count()");
        if (isset($this->group_id)) {
          // Chargement du contact depuis le cache
          $cache = \mel::InitM2Cache();
          if (isset($cache['contacts'])
              && isset($cache['contacts'][$this->addressbook->id])
              && isset($cache['contacts'][$this->addressbook->id]['groups'])
              && isset($cache['contacts'][$this->addressbook->id]['groups'][$this->group_id])) {
            if (isset($cache['contacts'][$this->addressbook->id]['groups'][$this->group_id]['count'])) {
                $count = $cache['contacts'][$this->addressbook->id]['groups'][$this->group_id]['count'];
            }
            else if (isset($cache['contacts'][$this->addressbook->id]['groups'][$this->group_id]['list'])) {
                $group = unserialize($cache['contacts'][$this->addressbook->id]['groups'][$this->group_id]['list']);
                $count = 0;
                if ($group !== false) {
                  $members = unserialize($group->members);
                  if ($members !== false) {
                    $members = array_unique($members);
                    $count = count($members);
                  }
                }
            }
          }
          else {
            $count = 0;
          }
          return new rcube_result_set($count, ($this->list_page-1) * $this->page_size);
        }
        else {
          try {
            // Chargement du contact depuis le cache
            $cache = \mel::InitM2Cache();
            // Chargement des contacts depuis le cache
            if (isset($cache['contacts'])
                && isset($cache['contacts'][$this->addressbook->id])
                && isset($cache['contacts'][$this->addressbook->id]['count'])) {
              $count = $cache['contacts'][$this->addressbook->id]['count'];
            } else {
              $_contact = new Melanie2\Contact($this->user, $this->addressbook);
              $_contact->type = Melanie2\Contact::TYPE_CONTACT;
              $results = $_contact->getList('count');
              $count = 0;
              foreach($results as $result) {
                $count = $result->count;
                break;
              }
            }
            return new rcube_result_set($count, ($this->list_page-1) * $this->page_size);
          }
          catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::count() Melanie2DatabaseException");
            return false;
          }
          catch (\Exception $ex) {
            return false;
          }
        }

        return false;
    }

    /**
     * Return the last result set
     *
     * @return rcube_result_set Current result set or NULL if nothing selected yet
    */
    function get_result() {
        return $this->result;
    }

    /**
     * Get a specific contact record
     *
     * @param mixed record identifier(s)
     * @param boolean True to return record as associative array, otherwise a result set is returned
     *
     * @return mixed Result object with all record fields or False if not found
    */
    function get_record($id, $assoc=false) {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::get_record($id, $assoc)");
        try {
            // Chargement du contact depuis le cache
            $cache = \mel::InitM2Cache();
            $limit = $this->page_size;
            $offset = $this->page_size * ($this->list_page - 1);
            // Chargement des contacts depuis le cache
            if (self::ENABLE_CACHE
                    && isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['list'])
                    && isset($cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset])
                    && isset($cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset][$id])) {
                $contact = unserialize($cache['contacts'][$this->addressbook->id]['list'][$limit."_".$offset][$id]);
            } else {
                $_contact = new Melanie2\Contact($this->user, $this->addressbook);
                $_contact->id = $id;
                $_contact->type = Melanie2\Contact::TYPE_CONTACT;
                $_contacts = $_contact->getList();

                foreach($_contacts as $_contact) {
                    $contact = $_contact;
                    break;
                }
            }

            $this->result = new rcube_result_set();
            $this->result->add(mel_contacts_mapping::m2_to_rc_contact(null, $contact));

            $first = $this->result->first();
            $sql_arr = $first['ID'] == $id ? $first : null;
            return $assoc && $sql_arr ? $sql_arr : $this->result;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::get_record() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Create a new contact record
     *
     * @param array Assoziative array with save data
     *  Keys:   Field name with optional section in the form FIELD:SECTION
     *  Values: Field value. Can be either a string or an array of strings for multiple values
     * @param boolean True to check for duplicates first
     * @return mixed The created record ID on success, False on error
     */
    function insert($save_data, $check=false)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::insert($save_data, $check)");
        if ($this->readonly) {
            return false;
        }
        try {
            $contact = mel_contacts_mapping::rc_to_m2_contact($save_data, new Melanie2\Contact($this->user, $this->addressbook));
            $contact->id = md5(uniqid(mt_rand(), true));
            $contact->uid = date('YmdHis') . '.' . substr(str_pad(base_convert(microtime(), 10, 36), 16, uniqid(mt_rand()), STR_PAD_LEFT), -16) . '@roundcube';
            $contact->modified = time();
            $ret = $contact->save();
            if (is_null($ret)) {
                return false;
            }
            else {
                // Chargement du contact depuis le cache
                $cache = \mel::InitM2Cache();
                // Chargement des contacts depuis le cache
                if (self::ENABLE_CACHE
                        && isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && isset($cache['contacts'][$this->addressbook->id]['list'])) {
                    unset($cache['contacts'][$this->addressbook->id]['list']);
                    \mel::SetM2Cache($cache);
                }
                return $contact->id;
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::insert() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Update a specific contact record
     *
     * @param mixed Record identifier
     * @param array Assoziative array with save data
     *  Keys:   Field name with optional section in the form FIELD:SECTION
     *  Values: Field value. Can be either a string or an array of strings for multiple values
     * @return boolean True on success, False on error
     */
    function update($id, $save_cols)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::update($id, $save_cols)");
        if ($this->readonly) {
            return false;
        }
        try {
            $_contact = new Melanie2\Contact($this->user, $this->addressbook);
            $_contact->id = $id;
            $_contact->type = Melanie2\Contact::TYPE_CONTACT;
            foreach($_contact->getList() as $contact) {
                break;
            }
            if (isset($contact)) {
                $contact = mel_contacts_mapping::rc_to_m2_contact($save_cols, $contact);
                $contact->id = $id;
                $contact->modified = time();
                $ret = $contact->save();
                // Chargement du contact depuis le cache
                $cache = \mel::InitM2Cache();
                // Chargement des contacts depuis le cache
                if (self::ENABLE_CACHE
                        && isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && isset($cache['contacts'][$this->addressbook->id]['list'])) {
                    unset($cache['contacts'][$this->addressbook->id]['list']);
                    \mel::SetM2Cache($cache);
                }
                return !is_null($ret);
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::update() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Mark one or more contact records as deleted
     *
     * @param array  Record identifiers
     * @param bool   Remove records irreversible (see self::undelete)
     */
    function delete($ids, $force=true)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::delete($ids, $force)");
        if ($this->readonly) {
            return false;
        }
        try {
            $_contact = new Melanie2\Contact($this->user, $this->addressbook);
            $_contact->id = $ids;
            $_contact->type = Melanie2\Contact::TYPE_CONTACT;
            $count = 0;
            foreach($_contact->getList() as $contact) {
                if (!$contact->delete()) return false;
                else $count++;
            }
            // Chargement du contact depuis le cache
            $cache = \mel::InitM2Cache();
            // Chargement des contacts depuis le cache
            if (self::ENABLE_CACHE
                    && isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['list'])) {
                unset($cache['contacts'][$this->addressbook->id]['list']);
                \mel::SetM2Cache($cache);
            }
            return $count;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::delete() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Mark all records in database as deleted
     *
     * @param bool $with_groups Remove also groups
     */
    function delete_all($with_groups = false)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::delete_all($with_groups)");
        if ($this->readonly) {
            return false;
        }
        try {
            $contacts = $this->addressbook->getAllContacts();
            foreach ($contacts as $contact) {
                if ($with_groups
                        && $contact->type == Melanie2\Contact::TYPE_LIST
                        || $contact->type == Melanie2\Contact::TYPE_CONTACT) {
                    $contact->delete();
                }
            }
            // Chargement du contact depuis le cache
            $cache = \mel::InitM2Cache();
            // Chargement des contacts depuis le cache
            if (self::ENABLE_CACHE
                    && isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['list'])) {
                unset($cache['contacts'][$this->addressbook->id]['list']);
                \mel::SetM2Cache($cache);
            }
            return true;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::delete_all() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * List all active contact groups of this source
     *
     * @param string  Optional search string to match group name
     * @param int     Matching mode:
     *                0 - partial (*abc*),
     *                1 - strict (=),
     *                2 - prefix (abc*)
     *
     * @return array  Indexed list of contact groups, each a hash array
     */
    function list_groups($search = null, $mode = 0)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::list_groups($search, $mode)");
        try {
            // Chargement du groupe depuis le cache
            $cache = \mel::InitM2Cache();
            if (self::ENABLE_CACHE) {
                if (!isset($this->ctag)) {
                    if (isset($cache['contacts'])
                            && isset($cache['contacts'][$this->addressbook->id])
                            && isset($cache['contacts'][$this->addressbook->id]['ctag'])
                            && isset($cache['contacts'][$this->addressbook->id]['ctag_time'])
                            && time() - $cache['contacts'][$this->addressbook->id]['ctag_time'] < self::CTAG_REFRESH) {
                        $this->ctag = $cache['contacts'][$this->addressbook->id]['ctag'];
                    } else {
                        $this->ctag = $this->addressbook->getCTag();
                        if (isset($cache['contacts'][$this->addressbook->id]['ctag_time'])) {
                            $cache['contacts'][$this->addressbook->id]['ctag_time'] = time();
                        }
                    }
                }
                // Chargement des contacts depuis le cache
                if (isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && !isset($search)
                        && isset($cache['contacts'][$this->addressbook->id]['groups'])
                        && isset($cache['contacts'][$this->addressbook->id]['groups']['list'])) {
                    if ($cache['contacts'][$this->addressbook->id]['ctag'] == $this->ctag) {
                        $ret = array();
                        foreach ($cache['contacts'][$this->addressbook->id]['groups']['list'] as $_g) {
                            $_g = unserialize($_g);
                            $group = mel_contacts_mapping::m2_to_rc_contact(null, $_g);
                            $group['user_id'] = $this->user->uid;
                            $group['changed'] = $_g->modified;
                            $ret[] = $group;
                        }
                        return $ret;
                    } else {
                        unset($cache['contacts'][$this->addressbook->id]);
                    }
                }
            }

            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $operators = array();
            if (!empty($search)) {
                if ($mode == 0) {
                    $operators['lastname'] = LibMelanie\Config\MappingMelanie::like;
                    $_group->lastname = '%'.$search.'%';
                } elseif ($mode == 1) {
                    $_group->lastname = $search;
                    $operators['lastname'] = LibMelanie\Config\MappingMelanie::eq;
                } else {
                    $_group->lastname = $search.'%';
                    $operators['lastname'] = LibMelanie\Config\MappingMelanie::like;
                }
            } else {
                if (!isset($cache['contacts'])) $cache['contacts'] = array();
                if (!isset($cache['contacts'][$this->addressbook->id])) $cache['contacts'][$this->addressbook->id] = array();
                $cache['contacts'][$this->addressbook->id]['groups'] = array();
                $cache['contacts'][$this->addressbook->id]['ctag'] = $this->ctag;
                $cache['contacts'][$this->addressbook->id]['ctag_time'] = time();
            }

            $ret = array();
            $favorites_exists = false;
            foreach ($_group->getList(array(), "", $operators, "lastname") as $_g) {
                if (!isset($search)) {
                    $cache['contacts'][$this->addressbook->id]['groups'][$_g->id]['list'] = serialize($_g);
                }
                else {
                    $cache['contacts'][$this->addressbook->id]['groups'][$_g->id]['count'] = count(unserialize($_g->members));
                }
                if ($_g->uid == 'favorites') {
                  $favorites_exists = true;
                }
                $group = mel_contacts_mapping::m2_to_rc_contact(null, $_g);
                $group['user_id'] = $this->user->uid;
                $group['changed'] = $_g->modified;
                $ret[] = $group;
            }
            if (!isset($search) && !$favorites_exists && $this->addressbook->id == $this->rc->get_user_name()) {
              $ret[] = $this->create_group($this->rc->gettext('favorites', 'mel_contacts'), true);
            }
            // Sauvegarde dans le cache
            \mel::SetM2Cache($cache);
            return $ret;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::list_groups() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Get group properties such as name and email address(es)
     *
     * @param string Group identifier
     * @return array Group properties as hash array
     */
    function get_group($group_id)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::get_group($group_id)");
        try {
            // Chargement du groupe depuis le cache
            $cache = \mel::InitM2Cache();
            if (isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'][$group_id])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'][$group_id]['list'])) {
                $group = unserialize($cache['contacts'][$this->addressbook->id]['groups'][$group_id]['list']);
                return mel_contacts_mapping::m2_to_rc_contact(null, $group);
            } else {
                $_group = new Melanie2\Contact($this->user, $this->addressbook);
                $_group->type = Melanie2\Contact::TYPE_LIST;
                $_group->id = $group_id;
                foreach($_group->getList() as $group) { break; }
                return mel_contacts_mapping::m2_to_rc_contact(null, $group);
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::get_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Setter for the current group
     * (empty, has to be re-implemented by extending class)
     */
    function set_group($gid) {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::set_group($gid)");
        if ($gid) $this->group_id = $gid;
        else  $this->group_id = null;
    }

    /**
     * Create a contact group with the given name
     *
     * @param string The group name
     * @return mixed False on error, array with record props in success
     */
    function create_group($name, $favoris = false)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::create_group($name)");
        try {
            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $_group->lastname = $name;
            // MANTIS 0004236: RC permet de créer des groupes de même nom
            $groups = $_group->getList();
            if (count($groups) > 0) return false;

            $_group->id = md5(uniqid(mt_rand(), true));
            if ($favoris) {
              $_group->uid = 'favorites';
            }
            else {
              $_group->uid = date('YmdHis') . '.' . substr(str_pad(base_convert(microtime(), 10, 36), 16, uniqid(mt_rand()), STR_PAD_LEFT), -16) . '@roundcube';
            }
            $_group->modified = time();
            $ret = $_group->save();
            if (!is_null($ret)) {
                $cache = \mel::InitM2Cache();
                if (isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])) {
                    if (!isset($cache['contacts'][$this->addressbook->id]['groups'])) {
                        $cache['contacts'][$this->addressbook->id]['groups'] = array();
                    }
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list'] = serialize($_group);
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['count'] = count($_group);
                    \mel::SetM2Cache($cache);
                }
                $group = mel_contacts_mapping::m2_to_rc_contact(null, $_group);
                $group['id'] = $_group->id;
                return $group;
            } else return false;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::create_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Delete the given group and all linked group members
     *
     * @param string Group identifier
     * @return boolean True on success, false if no data was changed
     */
    function delete_group($gid)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::delete_group($gid)");
        try {
            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $_group->id = $gid;
            $cache = \mel::InitM2Cache();
            if (isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'][$gid])) {
                unset($cache['contacts'][$this->addressbook->id]['groups'][$gid]);
                \mel::SetM2Cache($cache);
            }
            foreach($_group->getList() as $group) {
                return $group->delete();
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::delete_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Rename a specific contact group
     *
     * @param string Group identifier
     * @param string New name to set for this group
     * @param string New group identifier (if changed, otherwise don't set)
     * @return boolean New name on success, false if no data was changed
     */
    function rename_group($gid, $newname, &$newid)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::rename_group($gid, $newname, &$newid)");
        try {
            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $_group->id = $gid;
            foreach($_group->getList() as $group) {
                $group->lastname = $newname;
                $group->modified = time();
                $ret = $group->save();
                if (!is_null($ret)) {
                    $cache = \mel::InitM2Cache();
                    if (isset($cache['contacts'])
                            && isset($cache['contacts'][$this->addressbook->id])
                            && isset($cache['contacts'][$this->addressbook->id]['groups'])
                            && isset($cache['contacts'][$this->addressbook->id]['groups'][$gid])) {
                        $cache['contacts'][$this->addressbook->id]['groups'][$gid]['list'] = serialize($group);
                        $cache['contacts'][$this->addressbook->id]['groups'][$gid]['count'] = count($group);
                        \mel::SetM2Cache($cache);
                    }
                    return $newname;
                }
                else {
                    return false;
                }
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::rename_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Add the given contact records the a certain group
     *
     * @param string       Group identifier
     * @param array|string List of contact identifiers to be added
     *
     * @return int Number of contacts added
     */
    function add_to_group($group_id, $ids)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::add_to_group($group_id, $ids)");
        try {
            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $_group->id = $group_id;
            if (!is_array($ids)) $ids = [$ids];
            foreach($_group->getList() as $group) {
                $members = unserialize($group->members);
                if (!is_array($members)) $members = array();
                $members = array_unique($members);
                $count = 0;
                foreach($ids as $key => $id) {
                    if (!in_array($id, $members)) {
                        $count++;
                        $members[] = $id;
                    }
                }
                $group->members = serialize(array_merge($members, $ids));
                // Chargement du groupe depuis le cache
                $cache = \mel::InitM2Cache();
                // Gestion du cache
                if (isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'][$_group->id])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list'])) {
                    $_grp = unserialize($cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list']);
                    $_grp->members = $group->members;
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list'] = serialize($_grp);
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['count'] = count($_grp);
                }
                // Sauvegarde dans le cache
                \mel::SetM2Cache($cache);
                $group->modified = time();
                $ret = $group->save();
                if (!is_null($ret)) return $count;
                else return 0;
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::add_to_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Remove the given contact records from a certain group
     *
     * @param string       Group identifier
     * @param array|string List of contact identifiers to be removed
     *
     * @return int Number of deleted group members
     */
    function remove_from_group($group_id, $ids)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::remove_from_group($group_id, $ids)");
        try {
            $_group = new Melanie2\Contact($this->user, $this->addressbook);
            $_group->type = Melanie2\Contact::TYPE_LIST;
            $_group->id = $group_id;
            foreach($_group->getList() as $group) {
                $members = unserialize($group->members);
                if (!is_array($members)) $members = array();
                $members = array_unique($members);
                $count = 0;
                foreach($members as $key => $memb_id) {
                    if (in_array($memb_id, $ids)) {
                        $count++;
                        unset($members[$key]);
                    }
                }
                if (count($members) == 0) $group->members = '';
                else $group->members = serialize($members);
                // Chargement du groupe depuis le cache
                $cache = \mel::InitM2Cache();
                // Gestion du cache
                if (isset($cache['contacts'])
                        && isset($cache['contacts'][$this->addressbook->id])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'][$_group->id])
                        && isset($cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list'])) {
                    $_grp = unserialize($cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list']);
                    $_grp->members = $group->members;
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['list'] = serialize($_grp);
                    $cache['contacts'][$this->addressbook->id]['groups'][$_group->id]['count'] = count($_grp);
                }
                // Sauvegarde dans le cache
                \mel::SetM2Cache($cache);
                $group->modified = time();
                $ret = $group->save();
                if (!is_null($ret)) return $count;
                else return 0;
            }
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::remove_from_group() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }

    /**
     * Get group assignments of a specific contact record
     *
     * @param mixed Record identifier
     *
     * @return array List of assigned groups as ID=>Name pairs
     * @since 0.5-beta
     */
    function get_record_groups($id)
    {
        if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "mel_addressbook::get_record_groups($id)");
        try {
            // Chargement du groupe depuis le cache
            $cache = \mel::InitM2Cache();
            if (isset($cache['contacts'])
                    && isset($cache['contacts'][$this->addressbook->id])
                    && isset($cache['contacts'][$this->addressbook->id]['groups'])
                    && isset($cache['contacts'][$this->addressbook->id]['groups']['list'])) {
                foreach($cache['contacts'][$this->addressbook->id]['groups']['list'] as $group) {
                    $group = unserialize($group);
                    $members = unserialize($group->members);
                    if (is_array($members)
                            && in_array($id, $members)) $result[$group->id] = $group->lastname;
                }
            } else {
                $result = array();
                $_group = new Melanie2\Contact($this->user, $this->addressbook);
                $_group->type = Melanie2\Contact::TYPE_LIST;
                foreach($_group->getList() as $group) {
                    $members = unserialize($group->members);
                    if (is_array($members)
                            && in_array($id, $members)) $result[$group->id] = $group->lastname;
                }
            }
            return $result;
        }
        catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_addressbook::get_record_groups() Melanie2DatabaseException");
            return false;
        }
        catch (\Exception $ex) {
            return false;
        }
        return false;
    }
}