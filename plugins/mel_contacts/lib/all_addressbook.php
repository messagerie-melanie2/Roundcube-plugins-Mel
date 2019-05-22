<?php

class all_addressbook extends rcube_addressbook
{
    /**
     * @var rcube
     */
    private $rc;
    /**
     * @var rcube_result_set
     */
    private $result;
    /**
     * @var mixed Search params to use in listing method, obtained by get_search_set()
     */
    private $filter;

    /**
     * Constructeur de la classe
     * @param rcube $rc
     */
    function __construct($rc) {
        $this->rc = $rc;

        $this->ready    = true;
        $this->groups   = false;
        $this->readonly = true;

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
        return $this->rc->gettext('allcontacts', 'mel_larry');
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
        if (isset($this->result)) return $this->result;

        return new rcube_result_set();
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
        return new rcube_result_set();
    }

    /**
     * Count number of available contacts in database
     *
     * @return rcube_result_set Result set with values for 'count' and 'first'
    */
    function count() {
        return new rcube_result_set(0, ($this->list_page-1) * $this->page_size);
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
        return false;
    }

    /**
     * Mark all records in database as deleted
     *
     * @param bool $with_groups Remove also groups
     */
    function delete_all($with_groups = false)
    {
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
        return [];
    }

    /**
     * Get group properties such as name and email address(es)
     *
     * @param string Group identifier
     * @return array Group properties as hash array
     */
    function get_group($group_id)
    {
        return false;
    }

    /**
     * Setter for the current group
     * (empty, has to be re-implemented by extending class)
     */
    function set_group($gid) {
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
        return false;
    }
}