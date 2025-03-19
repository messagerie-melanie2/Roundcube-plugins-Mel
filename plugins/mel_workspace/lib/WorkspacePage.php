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

  public function append($sizeLG, $html, $sizeMD = null, $sizeSD = null) {
    $this->row[] = ['size' => $sizeLG, 'html' => $html, 'md' => ($sizeMD ?? $sizeLG), 'sd' => ($sizeSD ?? $sizeMD ?? $sizeLG)];
  }

  public function prepend($sizeLG, $html, $sizeMD = null, $sizeSD = null) {
    array_unshift($this->row, ['size' => $sizeLG, 'html' => $html, 'md' => ($sizeMD ?? $sizeLG), 'sd' => ($sizeSD ?? $sizeMD ?? $sizeLG)]);
  }

  public function count() {
    return count($this->row);
  }

  public function get() {
    $html = '';
    $sizeTotal = 12;
    $currentRowSize = 0;
    for ($i=0, $len = count($this->row), $size = 0; $i < $len; ++$i) {
      $size = $this->row[$i]['size'];
      $currentRowSize += $size;

      //On enlève le padding entre les différentes colonnes
      $padding = '';
      if ($len > 1) {
        $padding = $i === 0 ? 'pr-3 pr-md-0' : ($i === $len-1 ? 'pl-3 pl-md-0' : 'px-3 px-md-0'); 
      }

      if ($i+1 >= $len && ($sizeTotal - $currentRowSize) > 0) $size += ($sizeTotal - $currentRowSize);

      $html .= html::div(['class' => "col-lg-$size".' '.($this->row[$i]['md'] === null ? '' : 'col-md-'.$this->row[$i]['md']).' '.($this->row[$i]['sd'] === null ? '' : 'col-sd-'.$this->row[$i]['sd']) .' '. $padding], $this->row[$i]['html']);
    }

    return $html;
  }
}