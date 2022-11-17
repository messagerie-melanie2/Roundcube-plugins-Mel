<?php

/**
 * Plugin Mél_Moncompte
 *
 * plugin mel_Moncompte pour roundcube
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
require_once 'Moncompteobject.php';

use LibMelanie\Api\Defaut\Users\Outofoffice;

/**
 * Classe de modification de l'absence de l'utilisateur
 */
class Gestionnaireabsence extends Moncompteobject
{
  /**
   * Est-ce que cet objet Mon compte doit être affiché
   * 
   * @return boolean true si l'objet doit être affiché false sinon
   */
  public static function isEnabled()
  {
    return rcmail::get_instance()->config->get('enable_moncompte_abs', true);
  }

  /**
   * Chargement des données de l'utilisateur depuis l'annuaire
   */
  public static function load($plugin = null)
  {
    // Récupération de l'utilisateur
    $user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.gestionnaireabsence');
    // Authentification
    if ($user->authentification(Moncompte::get_current_user_password(), true)) {
      // Chargement des informations supplémenaires nécessaires
      $user->load(['outofoffices']);
      // Message interne
      $internal_oof = $user->outofoffices[Outofoffice::TYPE_INTERNAL];
      // Message externe
      $external_oof = $user->outofoffices[Outofoffice::TYPE_EXTERNAL];
      if (isset($internal_oof)) {
        rcmail::get_instance()->output->set_env('moncompte_absence_debut_interne', isset($internal_oof->start) ? $internal_oof->start->format('d/m/Y') : null);
        rcmail::get_instance()->output->set_env('moncompte_absence_fin_interne', isset($internal_oof->end) ? $internal_oof->end->format('d/m/Y') : null);
        rcmail::get_instance()->output->set_env('moncompte_absence_status_interne', $internal_oof->enable ? 'checked' : '');
        rcmail::get_instance()->output->set_env('moncompte_absence_texte_interne', $internal_oof->message);
      } else if (isset($external_oof)) {
        rcmail::get_instance()->output->set_env('moncompte_absence_debut_interne', isset($external_oof->start) ? $external_oof->start->format('d/m/Y') : null);
        rcmail::get_instance()->output->set_env('moncompte_absence_fin_interne', isset($external_oof->end) ? $external_oof->end->format('d/m/Y') : null);
      }

      if (isset($external_oof)) {
        rcmail::get_instance()->output->set_env('moncompte_absence_status_externe', $external_oof->enable ? 'checked' : '');
        rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe', $external_oof->message);
      }
      // Gestion du meme message interne/externe
      if (
        isset($internal_oof)
        && isset($external_oof)
        && $external_oof->enable
        && $external_oof->message == $internal_oof->message
      ) {
        rcmail::get_instance()->output->set_env('moncompte_abs_radio_same', 'checked');
        rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe_style', 'display: none;');
      } else {
        rcmail::get_instance()->output->set_env('moncompte_abs_radio_diff', 'checked');
      }
    }
    // Add script
    $plugin->include_script('absence.js');
    // Handler
    rcmail::get_instance()->output->add_handler('moncompte_absence_hebdomadaire', ['Gestionnaireabsence', 'absence_hebdomadaire']);
    // Titre de la page
    rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
    rcmail::get_instance()->output->send('mel_moncompte.gestionnaireabsence');
  }

  /**
   * Handler for moncompte_absence_hebdomadaire
   */
  public static function absence_hebdomadaire($attrib)
  {
    // Récupération de l'utilisateur
    $user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.gestionnaireabsence');
    // Parcourir les absences
    $hasAbsence = false;
    $html = self::absence_template('%%template%%');
    $i = 0;
    foreach ($user->outofoffices as $type => $outofoffice) {
      if (
        strpos($type, Outofoffice::HEBDO) === 0
        && isset($outofoffice->days)
      ) {
        $hasAbsence = true;

        $all_day = !isset($outofoffice->hour_start)
          && !isset($outofoffice->hour_end);
        $html .= self::absence_template(
          $i,
          $all_day,
          isset($outofoffice->hour_start) ? $outofoffice->hour_start->format('H:i') : '00:00',
          isset($outofoffice->hour_end) ? $outofoffice->hour_end->format('H:i') : '00:00',
          $outofoffice->days,
          $outofoffice->message,
          $outofoffice->type
        );
        $i++;
      }
    }
    // Pas d'absence ?
    if (!$hasAbsence) {
      $html .= html::div('noabsence', rcmail::get_instance()->gettext('noabsence', 'mel_moncompte'));
    }
    return $html;
  }

  /**
   * Génération du template pour les absence hebdo
   */
  private static function absence_template($i, $all_day = false, $hour_start = '', $hour_end = '', $days = [], $message = '', $perimeter = Outofoffice::TYPE_ALL)
  {
    $input_hour_start = new html_inputfield(['id' => "hour_start$i", 'class' => 'form-control', 'name' => "hour_start$i", "type" => "text", 'disabled' => $all_day]);
    $input_hour_end = new html_inputfield(['id' => "hour_end$i", 'class' => 'form-control', 'name' => "hour_end$i", "type" => "text",  'disabled' => $all_day]);
    $textarea_message = new html_textarea(['id' => "message$i", 'class' => 'form-control', 'name' => "message$i", 'rows' => '3', 'cols' => '100']);
    $checkbox_all_day = new html_checkbox(['id' => "all_day$i", 'class' => 'form-check-input', 'name' => "all_day$i", 'value' => '1', 'onclick' => 'all_day_check(this);']);

    // MCE - Ajouter le périmètre de réponse dans les absences hebdo
		$span_perimeter = '';
		if (rcmail::get_instance()->config->get('moncompte_absence_hebdo_perimetre', false)) {
			$select = new html_select(['id' => "perimeter$i", 'name' => "perimeter$i"]);
			$select->add(rcmail::get_instance()->gettext('absence_type_all', 'mel_moncompte'), Outofoffice::TYPE_ALL);
			$select->add(rcmail::get_instance()->gettext('absence_type_interne', 'mel_moncompte'), Outofoffice::TYPE_INTERNAL);
			$select->add(rcmail::get_instance()->gettext('absence_type_externe', 'mel_moncompte'), Outofoffice::TYPE_EXTERNAL);
			$span_perimeter = html::div('form-group',
        html::span('perimeter',
          html::label(['for' => "perimeter$i"], rcmail::get_instance()->gettext('absence_perimetre_label', 'mel_moncompte')) .
          $select->show($perimeter)
        )
			);
		}

    return html::div(
      'absence' . ($i === '%%template%%' ? ' template' : ''),
      html::div(
        'form-row justify-content-between',
        $span_perimeter . 
        html::div(
          'form-group',
          html::div(
            'form-check',
            html::span(
              'allday',
              $checkbox_all_day->show($all_day ? '1' : '0') .
                html::label(['for' => "all_day$i", 'class' => 'form-check-label'], rcmail::get_instance()->gettext('allday', 'mel_moncompte'))
            )
          )
        ) .
          html::div(
            'form-group',
            html::div(
              'form-check',
              html::span(
                'delete',
                html::a(['href' => '#', 'class' => 'btn btn-secondary delete', 'onclick' => 'delete_absence(this);'], rcmail::get_instance()->gettext('deleteabsence', 'mel_moncompte'))
              )
            )
          )
      ) .
        html::div(
          'form-row',
          html::div(
            'form-group col-6',
            html::span(
              'hourstart',
              html::label(['for' => "hour_start$i"], rcmail::get_instance()->gettext('hourstart', 'mel_moncompte'))
                .
                $input_hour_start->show($hour_start)
            )
          ) .
            html::div(
              'form-group col-6',
              html::span(
                'hourend',
                html::label(['for' => "hour_end$i"], rcmail::get_instance()->gettext('hourend', 'mel_moncompte'))
                  .
                  $input_hour_end->show($hour_end)
              )
            )
        ) .
        html::div(
          'form-row justify-content-between',
          self::days_checkbox($days, $i)
        ) .
        html::div(
          'form-group',
          html::span(
            'message',
            $textarea_message->show($message)
          )
        )

    );
  }

  /**
   * Generation for the days checkbox form
   * 
   * @param array $days list of checked days
   * @param string $id id of the line
   * 
   * @return string $html
   */
  private static function days_checkbox($days, $id)
  {
    $dayslist = [
      'monday'   => Outofoffice::DAY_MONDAY,
      'tuesday'   => Outofoffice::DAY_TUESDAY,
      'wednesday' => Outofoffice::DAY_WEDNESDAY,
      'thursday'   => Outofoffice::DAY_THURSDAY,
      'friday'   => Outofoffice::DAY_FRIDAY,
      // Ne pas afficher les weekend
      'saturday'   => Outofoffice::DAY_SATURDAY,
      'sunday'   => Outofoffice::DAY_SUNDAY,
    ];
    $html = '';
    foreach ($dayslist as $day => $map) {
      $checked = in_array($map, $days);
      $checkbox = new html_checkbox(['id' => "day_$day$id", 'class' => 'form-check-input', 'name' => "day_$day$id", 'value' => '1']);
      $html .=
        html::div(
          'form-group col-sm-1',
          html::div(
            'form-check',
            html::span(
              'checkbox',
              $checkbox->show($checked ? '1' : '0') .
                html::label(['for' => "day_$day$id", 'class' => 'form-check-label'], rcmail::get_instance()->gettext($day, 'mel_moncompte'))
            )
          )
        );
    }
    return $html;
  }

  /**
   * Modification des données de l'utilisateur depuis l'annuaire
   */
  public static function change()
  {
    $date_debut = trim(rcube_utils::get_input_value('absence_date_debut', rcube_utils::INPUT_POST));
    $date_fin = trim(rcube_utils::get_input_value('absence_date_fin', rcube_utils::INPUT_POST));
    $status_interne = trim(rcube_utils::get_input_value('absence_status_interne', rcube_utils::INPUT_POST));
    $status_externe = trim(rcube_utils::get_input_value('absence_texte_externe', rcube_utils::INPUT_POST));
    $message_interne = trim(rcube_utils::get_input_value('absence_message_interne', rcube_utils::INPUT_POST));
    $radio_externe = trim(rcube_utils::get_input_value('absence_reponse_externe', rcube_utils::INPUT_POST));
    $message_externe = trim(rcube_utils::get_input_value('absence_message_externe', rcube_utils::INPUT_POST));

    // Récupération de l'utilisateur
    $user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.gestionnaireabsence');
    // Authentification
    if ($user->authentification(Moncompte::get_current_user_password(), true)) {
      // Chargement des informations supplémenaires nécessaires
      $user->load(['outofoffices']);
      // Res
      $outofoffices = [];
      if (
        isset($message_interne) && !empty($message_interne)
        && isset($date_debut) && !empty($date_debut)
        && isset($date_fin) && !empty($date_fin)
      ) {
        // Mise a jour des message d'absence
        $outofoffice_interne = driver_mel::gi()->users_outofoffice();
        $outofoffice_interne->type = Outofoffice::TYPE_INTERNAL;
        $outofoffice_interne->enable = (isset($status_interne) && $status_interne == '1');
        $outofoffice_interne->start = \DateTime::createFromFormat('d/m/Y', $date_debut);
        $outofoffice_interne->end = \DateTime::createFromFormat('d/m/Y', $date_fin);
        $outofoffice_interne->message = $message_interne;
        $outofoffice_interne->order = 50;
        $outofoffices[] = $outofoffice_interne;
      }

      if ((isset($message_externe) && !empty($message_externe)
          || isset($message_interne) && !empty($message_interne) && isset($radio_externe) && $radio_externe == 'abs_texte_nodiff')
        && isset($date_debut) && !empty($date_debut)
        && isset($date_fin) && !empty($date_fin)
      ) {
        $outofoffice_externe = driver_mel::gi()->users_outofoffice();
        $outofoffice_externe->type = Outofoffice::TYPE_EXTERNAL;
        $outofoffice_externe->enable = (isset($status_externe) && $status_externe == '1');
        $outofoffice_externe->start = \DateTime::createFromFormat('d/m/Y', $date_debut);
        $outofoffice_externe->end = \DateTime::createFromFormat('d/m/Y', $date_fin);
        $outofoffice_externe->message = isset($radio_externe) && $radio_externe == 'abs_texte_nodiff' ? $message_interne : $message_externe;
        $outofoffice_externe->order = 60;
        $outofoffices[] = $outofoffice_externe;
      }

      // Gestion des absences hebdo
      $i = 0;
      while (isset($_POST["message$i"])) {
        if (!empty($_POST["hour_start$i"]) || !empty("all_day$i")) {
          $outofoffice = driver_mel::gi()->users_outofoffice();
          $days = [];
          if (isset($_POST["day_monday$i"])) {
            $days[] = Outofoffice::DAY_MONDAY;
          }
          if (isset($_POST["day_tuesday$i"])) {
            $days[] = Outofoffice::DAY_TUESDAY;
          }
          if (isset($_POST["day_wednesday$i"])) {
            $days[] = Outofoffice::DAY_WEDNESDAY;
          }
          if (isset($_POST["day_thursday$i"])) {
            $days[] = Outofoffice::DAY_THURSDAY;
          }
          if (isset($_POST["day_friday$i"])) {
            $days[] = Outofoffice::DAY_FRIDAY;
          }
          if (isset($_POST["day_saturday$i"])) {
            $days[] = Outofoffice::DAY_SATURDAY;
          }
          if (isset($_POST["day_sunday$i"])) {
            $days[] = Outofoffice::DAY_SUNDAY;
          }
          if (!empty($days)) {
            $outofoffice->order = 70;
            $outofoffice->days = $days;
            $type = trim(rcube_utils::get_input_value("perimeter$i", rcube_utils::INPUT_POST));
						$outofoffice->type = $type ?: Outofoffice::TYPE_ALL;
            $outofoffice->message = trim(rcube_utils::get_input_value("message$i", rcube_utils::INPUT_POST));
            $all_day = trim(rcube_utils::get_input_value("all_day$i", rcube_utils::INPUT_POST));
            if ($all_day) {
              $outofoffice->hour_start = \DateTime::createFromFormat('H:i', '00:00', new \DateTimeZone(rcmail::get_instance()->config->get('timezone', 'GMT')));
              $outofoffice->hour_end = \DateTime::createFromFormat('H:i', '00:00', new \DateTimeZone(rcmail::get_instance()->config->get('timezone', 'GMT')));
            } else {
              $hour_start = trim(rcube_utils::get_input_value("hour_start$i", rcube_utils::INPUT_POST));
              $hour_end = trim(rcube_utils::get_input_value("hour_end$i", rcube_utils::INPUT_POST));
              $outofoffice->hour_start = \DateTime::createFromFormat('H:i', $hour_start, new \DateTimeZone(rcmail::get_instance()->config->get('timezone', 'GMT')));
              $outofoffice->hour_end = \DateTime::createFromFormat('H:i', $hour_end, new \DateTimeZone(rcmail::get_instance()->config->get('timezone', 'GMT')));
            }
            $outofoffices[] = $outofoffice;
          }
        }
        $i++;
      }
      $user->outofoffices = $outofoffices;

      // Enregistrement de l'utilisateur avec les nouvelles données
      if ($user->save()) {
        // Ok
        rcmail::get_instance()->output->show_message('mel_moncompte.absence_ok', 'confirmation');
        return true;
      } else {
        // Erreur
        $err = \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
        rcmail::get_instance()->output->show_message(rcmail::get_instance()->gettext('mel_moncompte.absence_nok') . ' : ' . $err, 'error');
        return false;
      }
    } else {
      // Erreur d'auth
      rcmail::get_instance()->output->show_message('mel_moncompte.absence_nok', 'error');
      return false;
    }
  }
}
