<?php

/**
 * Classe interne pour conserver les infos du Gestionnaire Absence.
 */
class InfoAbsence {
  var $_isActive; // etat activation Gestionnaire Absence
  var $_dateStart; // date de debut d'activation
  var $_dateStop; // date de fin d'activation
  var $_msg; // message
}

/**
 *
 */
class BalAbsence {

  // Info du Gestionnaire Absence pour les destinataires internes.
  var $_infoMelanie;

  // Info du Gestionaire Absence pour les destinataires externes.
  var $_infoInternet;

  /*
   * Initialiser l'objet
   */
  function BalAbsence() {
    // Instancier les objets Infos Gestionnaire Absence
    $this->_infoMelanie = new InfoAbsence();
    $this->_infoInternet = new InfoAbsence();
  }

  /*
   * Renseigner le message d'absence pour les destinataires internes.
   */
  function setInfoMelanie($reponseRAIN) {
    $this->setInfo($reponseRAIN, $this->_infoMelanie);

  }

  /*
   * Recupérer le message Absence pour les destinaires internes.
   */
  function getMsgMelanie() {
    if (isset($this->_infoMelanie)) {
      return $this->_infoMelanie->_msg;
    }
    else {
      return "";
    }
  }

  /*
   * Recupérer l'état du Gestionnaire Absence pour les destinaires internes.
   *
   */
  function getStatusMelanie() {
    if (isset($this->_infoMelanie)) {
      return $this->_infoMelanie->_isActive;
    }
    else {
      return false;
    }
  }

  /**
   * Recupérer l'état du Gestionnaire Absence pour les destinaires externes.
   */
  function getStatusInternet() {
    if (isset($this->_infoInternet)) {
      return $this->_infoInternet->_isActive;
    }
    else {
      return false;
    }
  }

  /**
   * Récupérer les dates pour les destinaires internes
   */
  function getDatesMelanie(&$start_date, &$stop_date) {
    if (isset($this->_infoMelanie)) {
      $this->getDates($start_date, $stop_date, $this->_infoMelanie);
    }
  }

  /**
   * Récupérer les dates pour les destinaires externes
   */
  function getDatesInternet(&$start_date, &$stop_date) {
    if (isset($this->_infoInternet)) {
      $this->getDates($start_date, $stop_date, $this->_infoInternet);
    }
  }

  /**
   * Récupérer les dates debut et fin d'activation
   */
  function getDates(&$start_date, &$stop_date, &$info) {
    // 20080630 -> [20][08][06][30]
    if (isset($info->_dateStart)) {
      $arr = str_split($info->_dateStart, 2);
      if (isset($arr[3]))
        $start_date['mday'] = $arr[3];
      if (isset($arr[2]))
        $start_date['mon'] = $arr[2];

        // PAMELA 05/05/2010 Pb annee a 0000
      if (isset($arr[0]) && isset($arr[1])) {
        if ($info->_dateStart < 20080000) {
          $arr = str_split(date('Y'), 2);
        }
      }
      // PAMELA fin modifs ----------

      if (isset($arr[0]) && isset($arr[1]))
        $start_date['year'] = $arr[0] . $arr[1];
    }
    else {
      // La date de debut d'activation n'a pas été renseignée
      // elle sera renseignée par défaua la date du jour.
    }

    if (isset($info->_dateStop)) {
      $arr = str_split($info->_dateStop, 2);
      if (isset($arr[3]))
        $stop_date['mday'] = $arr[3];
      if (isset($arr[2]))
        $stop_date['mon'] = $arr[2];

        // PAMELA 05/05/2010 Pb annee a 0000
      if (isset($arr[0]) && isset($arr[1])) {
        if ($info->_dateStop < '20080000') {
          $arr = str_split(date('Y'), 2);
        }
      }
      // PAMELA fin modifs ----------

      if (isset($arr[0]) && isset($arr[1]))
        $stop_date['year'] = $arr[0] . $arr[1];
    }
  }

  /**
   * Récupérer le message Absence pour les destinataires externes.
   */
  function getMsgInternet() {
    if (isset($this->_infoInternet)) {
      return $this->_infoInternet->_msg;
    }
    else {
      return "";
    }
  }

  /**
   * Renseigner le message d'absence pour les destinataires externes
   */
  function setInfoInternet($reponseRAEX) {
    $this->setInfo($reponseRAEX, $this->_infoInternet);
  }

  /**
   * Renseigner le message d'absence p
   * PAMELA 26/06/09 stripos -> strpos et rajouter ' '
   */
  function setInfo($reponse, &$info) {
    // Format de la reponse pour les destinaires externes
    // 50~ RAxx: DDEB:aaammjj DFIN:aaaammjj TEXTE:le texte

    // Extraire la date de debut d'activation
    $temp = strstr($reponse, 'DDEB');
    $active = true;
    if ($temp != false) {
      if (strpos($temp, '0/') !== false) {
        $temp = str_replace('0/', '', $temp);
        $active = false;
      }
      list($t0, $info->_dateStart, $t1) = preg_split("/[: ]/", $temp, 3);
    }

    // Extraire la date de fin d'activation
    $temp = strstr($reponse, 'DFIN');
    if ($temp != false) {
      // si DFIN debute par 0/ : le gestionnaire n'est pas actif
      if (strstr($temp, 'DFIN:0/') === false) {
        // Le gestionnaire d'absence est actif
        $info->_isActive = true;
      }
      else {
        // Le gestionnaire d'absence n'est pas actif
        $info->_isActive = false;
        $temp = str_replace('0/', '', $temp);
      }
      list($t0, $info->_dateStop, $t1) = preg_split("/[: ]/", $temp, 3);
    }

    // PAMELA 12/12/12 modif gestionnaire absence si bal desactivee
    if (strpos($reponse, 'DFIN') === false) {
      if (! $test)
        $info->_isActive = $active;
    }
    // --------------

    // Extraire le texte du message d'absence
    $temp = strstr($reponse, 'TEXTE');
    if ($temp != false) {
      list($t0, $info->_msg) = preg_split("/[:]/", $temp, 2);
      // PAMELA passage en utf8
      // $info->_msg = utf8_decode($info->_msg);
      $info->_msg = $info->_msg;
    }
  }
}

