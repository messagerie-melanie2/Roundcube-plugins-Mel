<?php
class WorkspacePageLayout {
  private $first;
  private $second;
  private $third;
  private $fourth;
  private $other;
  private $navActions;

  public function __construct() {
    $this->first = new WorkspacePageRow();
    $this->second = new WorkspacePageRow();
    $this->third = new WorkspacePageRow();
    $this->fourth = new WorkspacePageRow();
    $this->other = new WorkspacePageRow();
    $this->navActions = [];
  }

  public function firstRow() {
    return $this->first;
  }

  public function secondRow() {
    return $this->second;
  }

  public function thirdRow() {
    return $this->third;
  }

  public function fourthRow() {
    return $this->fourth;
  }

  public function otherRow() {
    return $this->other;
  }

  public function setNavBarSetting($task, $icon, $canBeHidden = true, $order = 999) {
    $this->navActions[] = ['task' => $task, 'canBeHidden' => $canBeHidden, 'order' => $order, 'icon' => $icon];
    return $this;
  }

  public function getNavBarSettings() {
    return count($this->navActions) > 0 ? $this->navActions : null;
  }

  public function htmlModuleBlock($attribs = [], $content = '') {
    return html::tag('bnum-workspace-module', $attribs, $content);
  }

  public function htmlSmallModuleBlock($attribs = [], $content = '') {
    $attribs ??= [];
    $attribs['data-small'] = true;

    return $this->htmlModuleBlock($attribs, $content);
  }
}

class WorkspacePageRow {
  private $row;
  public function __construct() {
    $this->row = [];
  }

  public function append($sizeMin, $html) {
    $this->row[] = ['size' => $sizeMin, 'html' => $html];
  }

  public function prepend($sizeMin, $html) {
    array_unshift($this->row, ['size' => $sizeMin, 'html' => $html]);
  }

  public function count() {
    return count($this->row);
  }

  public function get() {
    $html = '';
    $sizeTotal = 12;
    for ($i=0, $len = count($this->row), $size = 0; $i < $len; ++$i) {
      $size = $this->row[$i]['size'];
      
      if ($i+1 >= $len && ($sizeTotal - $size) > 0) $size += ($sizeTotal - $size);

      $html .= html::div(['class' => "col-$size"], $this->row[$i]['html']);
    }

    return $html;
  }
}