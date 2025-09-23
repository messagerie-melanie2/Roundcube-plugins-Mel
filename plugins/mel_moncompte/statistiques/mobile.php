<?php

/**
 * Plugin Mel mon compte
 *
 * plugin mel pour roundcube
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
// Wipe status
define("SYNC_PROVISION_RWSTATUS_NA", 0);
define("SYNC_PROVISION_RWSTATUS_OK", 1);
define("SYNC_PROVISION_RWSTATUS_PENDING", 2);
define("SYNC_PROVISION_RWSTATUS_REQUESTED", 4);
define("SYNC_PROVISION_RWSTATUS_WIPED", 8);

/**
 * Classe de gestion des statistiques mobile
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 *
 */
class Mobile_Stats
{
    /**
     * @var  rcmail The one and only instance
     */
    protected $rc;
    /**
     * @var rcube_plugin Plugin courant
     */
    private $plugin;
    /**
     * Client du Webservice SOAP
     * @var WebserviceSOAP
     */
    private $client;

    // Construct
    public function __construct($plugin)
    {
        // Chargement de l'instance rcmail
        $this->rc = rcmail::get_instance();
        // Récupération du plugin courant
        $this->plugin = $plugin;

        // Connexion au web service zpush
        try {
            $user = $this->rc->get_user_name();
            // Stream context pour les problèmes de certificat
            $streamContext = stream_context_create(array(
                'ssl' => array(
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true
                )
            ));
            // Connexion au serveur de webservice
            $this->client = new SoapClient(
                null,
                array(
                    'location'        =>  $this->rc->config->get('ws_zp') . "?Cmd=WebserviceDevice&User=$user&DeviceId=webservice&DeviceType=webservice",
                    'uri'             =>  "http://z-push.sf.net/webservice",
                    'login'           =>  $user,
                    'password'        =>  $this->rc->get_user_password(),
                    'stream_context'  =>  $streamContext,
                )
            );
        } catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            $this->rc->output->send();
            return;
        }
    }

    /**
     * INitialisation des statistiques mobile
     */
    public function init()
    {
        $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
        if (isset($fid)) {
            $fid = explode('_zp_', $fid, 2);
            $zp_version = $fid[1];
            $fid = $fid[0];
            // register UI objects
            $this->rc->output->add_handlers(array(
                'mel_statistics_device_info'    => array($this, 'device_info'),
                'mel_statistics_sync_details'   => array($this, 'sync_details'),
            ));
            $this->plugin->include_script('mobile.js');
            $this->rc->output->set_env('deviceid', $fid);
            $this->rc->output->set_env('zp_version', $zp_version);
            $this->rc->output->set_env('current_user', $this->rc->get_user_name());
            $this->rc->output->send('mel_moncompte.mobile_info');
        } else {
            // register UI objects
            $this->rc->output->add_handlers(array(
                'mel_statistics_mobiles_list'    => array($this, 'mobiles_list'),
                'mel_statistics_mobile_frame'    => array($this, 'mobile_frame'),
            ));
            $this->rc->output->include_script('list.js');
            $this->plugin->include_script('mobile.js');
            $this->rc->output->set_pagetitle($this->plugin->gettext('mobile'));
            $this->rc->output->send('mel_moncompte.mobile');
        }
    }

    /**
     * Affiche la liste des mobiles de l'utilisateur
     * @param array $attrib
     * @return string
     */
    public function mobiles_list($attrib)
    {
        // add id to message list table if not specified
        if (!strlen($attrib['id']))
            $attrib['id'] = 'rcmmobileslist';

        // define list of cols to be displayed
        $a_show_cols = array('mel_moncompte.type', 'mel_moncompte.deviceid', 'mel_moncompte.last_sync', 'mel_moncompte.z-push');

        $result = array();

        try {
            // Appel une méthode du webservice
            $devices = $this->client->ListUserDevices();
            // Parcour la liste des appareils
            foreach ($devices as $device) {
                // Récupération des données
                $deviceId = $device['deviceid'];
                $devicetype = (isset($device['devicetype']) ? $device['devicetype'] : $this->plugin->gettext('No type'));
                $version = (isset($device['deviceos']) ? $device['deviceos'] : $this->plugin->gettext('No version'));
                $useragent = $device['useragent'];
                $user = $device['deviceuser'];
                $firstsync = date('D d M y H:i:s', $device['firstsynctime']);
                $lastsync = date('D d M y H:i:s', $device['lastupdatetime']);
                $imei = (isset($device['deviceimei']) ? $device['deviceimei'] : $this->plugin->gettext('No IMEI'));
                $versionzpush = $device['zpushversion'];

                $result[] = array(
                    'id' => $deviceId . '_zp_' . $versionzpush,
                    'mel_moncompte.deviceid' => $deviceId,
                    'mel_moncompte.type' => $devicetype,
                    'mel_moncompte.last_sync' => $lastsync,
                    'mel_moncompte.z-push' => $versionzpush,
                    'class' => '',
                    // Ajout des données pour les tooltips
                    '_tooltips' => array(
                        'deviceid' => $deviceId,
                        'type' => $devicetype,
                        'lastsync' => $lastsync,
                        'zpush' => $versionzpush
                    )
                );
            }
        } catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }

        // create XHTML table
        $out = $this->rc->table_output($attrib, $result, $a_show_cols, 'id');

        // set client env
        $this->rc->output->add_gui_object('mel_statistics_mobiles_list', $attrib['id']);

        // Envoie des tooltips au JS
        $this->rc->output->set_env('mobile_tooltips', array_column($result, '_tooltips'));

        return $out;
    }

    /**
     * Gestion de la frame pour le mobile
     * @param array $attrib
     * @return string
     */
    public function mobile_frame($attrib)
    {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmmobileframe';

        $attrib['name'] = $attrib['id'];

        $this->rc->output->set_env('contentframe', $attrib['name']);
        $this->rc->output->set_env('blankpage', $attrib['src'] ?
            $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

        return $this->rc->output->frame($attrib);
    }

    /**
     * Génération des table html pour les informations sur l'appareil zpush
     * @param array $attrib
     * @return string
     */
    public function device_info($attrib)
    {
        // add id to message list table if not specified
        if (empty($attrib['id']))
            $attrib['id'] = 'rcmdeviceinfo';

        $out = "";

        try {
            $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
            $fid = explode('_zp_', $fid, 2);
            $zp_version = $fid[1];
            $deviceId = $fid[0];

            // Appel une méthode du webservice
            $devices = $this->client->ListDeviceUsers($deviceId);

            if (!empty($devices)) {
                $one = true;

                // Parcour la liste des appareils
                foreach ($devices as $device) {
                    // Affichage des informations de l'appareil
                    if ($one) {
                        // Récupération des données
                        $devicemodel = $device['devicemodel'];
                        $devicetype = $device['devicetype'];
                        $deviceos = $device['deviceos'];
                        $useragent = $device['useragent'];
                        $deviceoslanguage = $device['deviceoslanguage'];
                        $devicefriendlyname = $device['devicefriendlyname'];
                        $imei = $device['deviceimei'];
                        $operator = $device['devicemobileoperator'];
                        $versionzpush = $device['zpushversion'];
                        $announcedasversion = $device['announcedasversion'];
                        $asversion = $device['asversion'];

                        switch ($device['wipestatus']) {
                            case SYNC_PROVISION_RWSTATUS_PENDING:
                                $wipestatus = "En attente";
                                break;
                            case SYNC_PROVISION_RWSTATUS_REQUESTED:
                                $wipestatus = "Envoy&eacute; au t&eacute;léphone";
                                break;
                            case SYNC_PROVISION_RWSTATUS_WIPED:
                                $wipestatus = "T&eacute;l&eacute;phone effac&eacute;";
                                break;
                            case SYNC_PROVISION_RWSTATUS_OK:
                            case SYNC_PROVISION_RWSTATUS_NA:
                            default:
                                $wipestatus = "Aucun";
                        }
                        $wiperequestedby = $device['wiperequestedby'];
                        $wiperequestedon = (isset($device['wiperequestedon']) ? date('r', $device['wiperequestedon']) : "");
                        $wipeactionon = (isset($device['wipeactionon']) ? date('r', $device['wipeactionon']) : "");

                        // Table 1 :Informations sur l'appareil
                        $deviceInformationTable = new html_table([
                            'id' => 'rcmdeviceinfo',
                            'class' => 'listing m2_stats_device_table',
                            'summary' => 'Device informations',
                            'tabindex' => '0',
                        ]);

                    // En-têtes
                    $deviceInformationTable->add_header('mel_moncompte.deviceid', $this->plugin->gettext('mel_moncompte.deviceid'));
                    $deviceInformationTable->add_header('mel_moncompte.imei', 'IMEI');
                    $deviceInformationTable->add_header('mel_moncompte.devicetype', $this->plugin->gettext('mel_moncompte.devicetype'));
                    $deviceInformationTable->add_header('mel_moncompte.devicemodel', $this->plugin->gettext('mel_moncompte.devicemodel'));
                    $deviceInformationTable->add_header('mel_moncompte.operator', $this->plugin->gettext('mel_moncompte.operator'));
                    $deviceInformationTable->add_header('mel_moncompte.user-agent', $this->plugin->gettext('mel_moncompte.user-agent'));
                    $deviceInformationTable->add_header('mel_moncompte.version', $this->plugin->gettext('mel_moncompte.version'));
                    $deviceInformationTable->add_header('mel_moncompte.language', $this->plugin->gettext('mel_moncompte.language'));

                    // Ligne
                    $deviceInformationTable->add_row(['id' => 'rcmdeviceinfo--' . $deviceId]);
                    $deviceInformationTable->add('mel_moncompte.deviceid', rcube::Q($deviceId));
                    $deviceInformationTable->add('mel_moncompte.imei', rcube::Q($imei));
                    $deviceInformationTable->add('mel_moncompte.devicetype', rcube::Q($devicetype));
                    $deviceInformationTable->add('mel_moncompte.devicemodel', rcube::Q($devicemodel));
                    $deviceInformationTable->add('mel_moncompte.operator', rcube::Q($operator));
                    $deviceInformationTable->add('mel_moncompte.user-agent', rcube::Q($useragent));
                    $deviceInformationTable->add('mel_moncompte.version', rcube::Q($deviceos));
                    $deviceInformationTable->add('mel_moncompte.language', rcube::Q($deviceoslanguage));

                    // Titre + table
                    $out .= html::tag('div', ['class'=>'boxtitle'], $this->plugin->gettext('device_info'));
                    $out .= $deviceInformationTable->show();

                        // Table 2 : Informations sur ActiveSync
                        if ($versionzpush >= 2) {
                            $activeSyncInformationTable = new html_table([
                            'id' => 'rcmactivesyncinfo',
                            'class' => 'listing m2_stats_device_table',
                            'summary' => 'ActiveSync informations',
                            'tabindex' => '0',
                        ]);

                        $activeSyncInformationTable->add_header('mel_moncompte.asversion', $this->plugin->gettext('mel_moncompte.asversion'));
                        $activeSyncInformationTable->add_header('mel_moncompte.wipestatus', $this->plugin->gettext('mel_moncompte.wipestatus'));
                        $activeSyncInformationTable->add_header('mel_moncompte.wiperequestedby', $this->plugin->gettext('mel_moncompte.wiperequestedby'));
                        $activeSyncInformationTable->add_header('mel_moncompte.wiperequestedon', $this->plugin->gettext('mel_moncompte.wiperequestedon'));
                        $activeSyncInformationTable->add_header('mel_moncompte.wipeactionon', $this->plugin->gettext('mel_moncompte.wipeactionon'));

                        $activeSyncInformationTable->add_row(['id' => 'rcmactivesyncinfo--' . $deviceId]);

                        $activeSyncInformationTable->add('mel_moncompte.asversion', rcube::Q($asversion));
                        $activeSyncInformationTable->add('mel_moncompte.wipestatus', $wipestatus);
                        $activeSyncInformationTable->add('mel_moncompte.wiperequestedby', rcube::Q($wiperequestedby));
                        $activeSyncInformationTable->add('mel_moncompte.wiperequestedon', rcube::Q($wiperequestedon));
                        $activeSyncInformationTable->add('mel_moncompte.wipeactionon', rcube::Q($wipeactionon));

                        $out .= html::tag('div', ['class'=>'boxtitle'], $this->plugin->gettext('activesync_info'));
                        $out .= $activeSyncInformationTable->show();
                    }

                        $one = false;
                    }
                }
                    
                // Table 3 : Liste des comptes configurés sur l'appareil
                $configureAccountsList = new html_table([
                    'id' => 'rcmaccountsinfo',
                    'class' => 'listing m2_stats_device_table',
                    'summary' => 'Device informations',
                    'tabindex' => '0',
                ]);

                // En-têtes
                $configureAccountsList->add_header('mel_moncompte.user', $this->plugin->gettext('mel_moncompte.user'));
                $configureAccountsList->add_header('mel_moncompte.first_sync', $this->plugin->gettext('mel_moncompte.first_sync'));
                $configureAccountsList->add_header('mel_moncompte.last_sync', $this->plugin->gettext('mel_moncompte.last_sync'));
                $configureAccountsList->add_header('mel_moncompte.z-push', 'Z-Push');
                $configureAccountsList->add_header('mel_moncompte.resync', $this->plugin->gettext('device_resync'));
                $configureAccountsList->add_header('mel_moncompte.remove', $this->plugin->gettext('device_remove'));

                foreach ($devices as $device) {
                    $userDevice = $device['deviceuser'];
                    $firstsync = date('D d M y H:i:s', $device['firstsynctime']);
                    $lastsync = date('D d M y H:i:s', $device['lastupdatetime']);
                    $maxzpushvers = $device['zpushversion'];

                    $row_id = 'rcmaccountsinfo--' . $deviceId . '--' . $userDevice;
                    $configureAccountsList->add_row(['id' => $row_id]);

                    $configureAccountsList->add('mel_moncompte.user', rcube::Q($userDevice));
                    $configureAccountsList->add('mel_moncompte.first_sync', rcube::Q($firstsync));
                    $configureAccountsList->add('mel_moncompte.last_sync', rcube::Q($lastsync));
                    $configureAccountsList->add('mel_moncompte.z-push', rcube::Q($maxzpushvers));

                    // Bouton Resync
                    $label_resync = $this->plugin->gettext('device_resync');
                    $resync_btn = html::tag('button', [
                        'type'       => 'button',
                        'class'      => 'button icon refresh resync',
                        'title'      => $label_resync,
                        'aria-label' => $label_resync . ' ' . $userDevice,
                        'onclick'    => "zpush_command('ResyncUserDevice', '" . rcube::JQ($deviceId) . "', '" . rcube::JQ($userDevice) . "')",
                    ], html::tag('span', ['class' => 'sr-only'], $label_resync));
                    $configureAccountsList->add('actions.resync', $resync_btn);

                    // Bouton Enlever
                    $label_remove = $this->plugin->gettext('device_remove');
                    $remove_btn = html::tag('button', [
                        'type'       => 'button',
                        'class'      => 'button icon delete remove',
                        'title'      => $label_remove,
                        'aria-label' => $label_remove . ' ' . $userDevice,
                        'onclick'    => "zpush_command('DeleteUserDevice', '" . rcube::JQ($deviceId) . "', '" . rcube::JQ($userDevice) . "')",
                    ], html::tag('span', ['class' => 'sr-only'], $label_remove));
                    $configureAccountsList->add('action.remove', $remove_btn);
                }

                $out .= html::tag('div', ['class'=>'boxtitle'], $this->plugin->gettext('accounts_list'));
                $out .= $configureAccountsList->show();
            }
        } catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }

        return $out;
    }

    /**
     * Génération de la table html : Détail des synchronisation sur l'appareil
     * @param array $attrib
     * @return string
     */
    public function sync_details($attrib)
    {
        // add id to message list table if not specified
        if (empty($attrib['id']))
            $attrib['id'] = 'rcmsyncdetails';

        $out = "";

        try {
            $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
            $fid = explode('_zp_', $fid, 2);
            $zp_version = $fid[1];
            $deviceId = $fid[0];

            // Récupère les détails d'un appareil
            $foldersinfos = $this->client->GetDeviceDetails($deviceId);

            if (!empty($foldersinfos)) {
                $deviceSyncDetails = new html_table([
                    'id' => 'rcmsyncdetails',
                    'class' => 'listing m2_stats_device_table',
                    'summary' => 'Sync details',
                    'tabindex' => '0',
                ]);

                $deviceSyncDetails->add_header('mel_moncompte.mailbox', $this->plugin->gettext('mel_moncompte.mailbox'));
                $deviceSyncDetails->add_header('mel_moncompte.type', $this->plugin->gettext('mel_moncompte.type'));
                $deviceSyncDetails->add_header('mel_moncompte.foldersync', $this->plugin->gettext('mel_moncompte.foldersync'));
                $deviceSyncDetails->add_header('mel_moncompte.last_sync', $this->plugin->gettext('mel_moncompte.last_sync'));
                $deviceSyncDetails->add_header('mel_moncompte.z-push', 'Z-Push');
                $deviceSyncDetails->add_header('mel_moncompte.resync', $this->plugin->gettext('device_resync'));
                $deviceSyncDetails->add_header('mel_moncompte.remaining', $this->plugin->gettext('mel_moncompte.remaining'));

                // Pour chaque folder : c'est à dire pour chaque backend
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[sync_details] " . print_r($foldersinfos, 1));
                foreach ($foldersinfos as $userFolder => $folderinfo) {
                    foreach ($folderinfo as $folderid => $zpush) {
                        foreach ($zpush as $zpushversion => $data) {
                            // type de bakend : contact, calendar, ...
                            $type = $data['contentclass'];
                            $folderidname = $data['folderid'];
                            $lastsync = date('D d M y H:i:s', $data['lastsynctime']);
                            $total = (isset($data['foldersynctotal']) && $data['foldersynctotal'] !== '') ? $data['foldersynctotal'] : "-";
                            $remaining = (isset($data['foldersyncremaining']) && $data['foldersyncremaining'] !== '') ? $data['foldersyncremaining'] : "-";
                            $synced = (is_numeric($total) && is_numeric($remaining)) ? ((int)$total - (int)$remaining) : "-";
                            // MANTIS 3592: La ré initialisation d'un conteneur spécifique resynchronise toutes les données du compte
                            $id_folderid = str_replace('/', '_-s-_', $folderid);
                            $id_folderid = str_replace('.', '_-p-_', $id_folderid);
                            $id_userFolder = str_replace('.', '_-p-_', $userFolder);

                            $row_id = 'rcmsyncdetails--' . $deviceId . '--' . $id_userFolder . '--' . $id_folderid;
                            $deviceSyncDetails->add_row(['id' => $row_id]);

                            $deviceSyncDetails->add('mel_moncompte.mailbox', rcube::Q($userFolder));
                            $deviceSyncDetails->add('mel_moncompte.type', rcube::Q($type));
                            $deviceSyncDetails->add('mel_moncompte.foldersync', rcube::Q($folderidname));
                            $deviceSyncDetails->add('mel_moncompte.last_sync', rcube::Q($lastsync));
                            $deviceSyncDetails->add('mel_moncompte.z-push', rcube::Q($zpushversion));

                            $label_resync_folder = $this->plugin->gettext('device_resync');
                            $resync_btn = html::tag('button', [
                                'type'       => 'button',
                                'class'      => 'button icon refresh resync',
                                'title'      => $label_resync_folder,
                                'aria-label' => $label_resync_folder . ' ' . $userFolder . ' / ' . $folderidname,
                                'onclick'    => "zpush_command('ResyncFolderId', '" . rcube::JQ($deviceId) . "', '" . rcube::JQ($id_userFolder) . "', '" . rcube::JQ($id_folderid) . "')",
                            ], html::tag('span', ['class' => 'sr-only'], $label_resync_folder));
                            $deviceSyncDetails->add('actions.resync', $resync_btn);

                            $deviceSyncDetails->add('mel_moncompte.remaining', rcube::Q($synced . ' / ' . $total));
                        }
                    }
                }

                $out .= html::tag('div', ['class'=>'boxtitle'], $this->plugin->gettext('sync_details'));
                $out .= $deviceSyncDetails->show();
            }
        } catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }

        return $out;
    }

    /**
     * Execution de la command zpush
     * Ecrit le résultat en json
     */
    public function zpush_command()
    {
        $status = "success";
        $message = "";

        $command = trim(rcube_utils::get_input_value('_command', rcube_utils::INPUT_POST));
        $deviceId = trim(rcube_utils::get_input_value('_device_id', rcube_utils::INPUT_POST));
        $unlock = trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST));

        try {
            if (
                isset($command)
                && isset($deviceId)
            ) {
                switch ($command) {
                    case "Wipe":
                        // Suppression à distance des données de l'appareil
                        $this->client->WipeDevice($deviceId);
                        $message = "success_$command";
                        break;
                    case "Unwipe":
                        // Arrêt de la suppression à distance des données de l'appareil
                        $this->client->UnWipeDevice($deviceId);
                        $message = "success_$command";
                        break;
                    case "Resync":
                        // Remise à zéro de la synchronisation
                        $this->client->ResyncDevice($deviceId);
                        $message = "success_$command";
                        break;
                    case "Delete":
                        // Suppression de l'appareil
                        $this->client->RemoveDevice($deviceId);
                        $message = "success_$command";
                        break;
                    case "DeleteZP1":
                        // Suppression de l'appareil
                        $this->client->RemoveDeviceZP1($deviceId);
                        $message = "success_$command";
                        break;
                    case "ResyncFolderId":
                        // resynchronisation du folder id
                        $folderId = trim(rcube_utils::get_input_value('_folder_id', rcube_utils::INPUT_POST));
                        $userFolder = trim(rcube_utils::get_input_value('_user_folder', rcube_utils::INPUT_POST));
                        if (
                            isset($folderId)
                            && isset($userFolder)
                        ) {
                            $this->client->ResyncFolder($deviceId, $folderId, $userFolder);
                            $message = "success_$command";
                        } else {
                            $status = "error";
                            $message = "Missing arguments";
                        }

                        break;
                    case "ResyncUserDevice":
                        // resynchronisation du user device
                        $userDevice = trim(rcube_utils::get_input_value('_user_device', rcube_utils::INPUT_POST));
                        if (isset($userDevice)) {
                            $this->client->ResyncDeviceByUser($deviceId, $userDevice);
                            $message = "success_$command";
                        } else {
                            $status = "error";
                            $message = "Missing arguments";
                        }
                        break;
                    case "DeleteUserDevice":
                        // resynchronisation du user device
                        $userDevice = trim(rcube_utils::get_input_value('_user_device', rcube_utils::INPUT_POST));
                        if (isset($userDevice)) {
                            $this->client->RemoveDeviceByUser($deviceId, $userDevice);
                            $message = "success_$command";
                        } else {
                            $status = "error";
                            $message = "Missing arguments";
                        }
                        break;
                    case "DeleteUserDeviceZP1":
                        // resynchronisation du user device
                        $userDevice = trim(rcube_utils::get_input_value('_user_device', rcube_utils::INPUT_POST));
                        if (isset($userDevice)) {
                            $this->client->RemoveDeviceByUserZP1($deviceId, $userDevice);
                            $message = "success_$command";
                        } else {
                            $status = "error";
                            $message = "Missing arguments";
                        }
                        break;
                }
            } else {
                $status = "error";
                $message = "Missing arguments";
            }
        } catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            $status = "error";
            $message = "Webservice error";
        }

        // Ecriture du resultat en json
        echo json_encode(array("action" => "plugin.statistics.zpush_command", "status" => $status, "message" => $this->plugin->gettext($message), 'command' => $command, 'unlock' => $unlock));
        exit;
    }
}
