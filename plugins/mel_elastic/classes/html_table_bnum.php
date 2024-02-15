<?php
/**
 * Plugin Mel Elastic
 *
 * Add header for rows in html_table
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class html_table_bnum extends html_table {
  
      /**
     * Add a table cell
     *
     * @param array  $attr Cell attributes
     * @param string $cont Cell content
     */
    public function add_col_header($attr, $cont, $header = false)
    {
        if (is_string($attr)) {
            $attr = ['class' => $attr];
        }

        $cell = new stdClass;
        $cell->attrib  = $attr;
        $cell->content = $cont;
        $cell->header = $header;

        if (!isset($this->rows[$this->rowindex])) {
            $this->rows[$this->rowindex] = new stdClass;
            $this->rows[$this->rowindex]->attrib = [];
        }

        $this->rows[$this->rowindex]->cells[$this->colindex] = $cell;
        $this->colindex += max(1, isset($attr['colspan']) ? intval($attr['colspan']) : 0);

        if (!empty($this->attrib['cols']) && $this->colindex >= $this->attrib['cols']) {
            $this->add_row();
        }
    }

    /**
     * Build HTML output of the table data
     *
     * @param array $attrib Table attributes
     *
     * @return string The final table HTML code
     */
    public function show($attrib = null)
    {
        if (is_array($attrib)) {
            $this->attrib = array_merge($this->attrib, $attrib);
        }

        $thead        = '';
        $tbody        = '';
        $col_tagname  = $this->_col_tagname();
        $row_tagname  = $this->_row_tagname();
        $head_tagname = $this->_head_tagname();

        // include <thead>
        if (!empty($this->header)) {
            $rowcontent = '';
            foreach ($this->header->cells as $c => $col) {
                $rowcontent .= self::tag($head_tagname, $col->attrib, $col->content);
            }
            $thead = $this->tagname == 'table' ? self::tag('thead', null, self::tag('tr', $this->header->attrib ?: null, $rowcontent, parent::$common_attrib)) :
                self::tag($row_tagname, ['class' => 'thead'], $rowcontent, parent::$common_attrib);
        }

        foreach ($this->rows as $r => $row) {
            $rowcontent = '';
            foreach ($row->cells as $c => $col) {
                if ($row_tagname == 'li' && empty($col->attrib) && count($row->cells) == 1) {
                    $rowcontent .= $col->content;
                }
                else {
                    $rowcontent .= self::tag($col->header ? $head_tagname : $col_tagname, $col->attrib, $col->content);
                }
            }

            if ($r < $this->rowindex || count($row->cells)) {
                $tbody .= self::tag($row_tagname, $row->attrib, $rowcontent, parent::$common_attrib);
            }
        }

        if (!empty($this->attrib['rowsonly'])) {
            return $tbody;
        }

        // add <tbody>
        $this->content = $thead . ($this->tagname == 'table' ? self::tag('tbody', null, $tbody) : $tbody);

        unset($this->attrib['cols'], $this->attrib['rowsonly']);

        return html::show();
    }

}