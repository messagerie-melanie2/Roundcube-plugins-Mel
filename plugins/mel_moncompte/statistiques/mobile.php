<?php
/**
 * Plugin Melanie2
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
class Mobile_Stats {
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
            $this->client = new SoapClient(null,
                    array(
                        'location'        =>  $this->rc->config->get('ws_zp') . "?Cmd=WebserviceDevice&User=$user&DeviceId=webservice&DeviceType=webservice",
                        'uri'             =>  "http://z-push.sf.net/webservice",
                        'login'           =>  $user,
                        'password'        =>  $this->rc->get_user_password(),
                        'stream_context'  =>  $streamContext,
                    )
            );
        }
        catch (Exception $ex) {
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
        $a_show_cols = array('mel_moncompte.deviceid', 'mel_moncompte.type', 'mel_moncompte.last_sync', 'mel_moncompte.z-push');

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
                    'id' => $deviceId.'_zp_'.$versionzpush,
                    'mel_moncompte.deviceid' => $deviceId,
                    'mel_moncompte.type' => $devicetype,
                    'mel_moncompte.last_sync' => $lastsync,
                    'mel_moncompte.z-push' => $versionzpush,
                    'class' => '',
                );

            }
        }
        catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }

        // create XHTML table
        $out = $this->rc->table_output($attrib, $result, $a_show_cols, 'id');

        // set client env
        $this->rc->output->add_gui_object('mel_statistics_mobiles_list', $attrib['id']);

        return $out;
    }

    /**
     * Gestion de la frame pour le mobile
     * @param array $attrib
     * @return string
     */
    public function mobile_frame($attrib) {
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
    public function device_info($attrib) {
        // add id to message list table if not specified
        if (!strlen($attrib['id']))
            $attrib['id'] = 'rcmdeviceinfo';

        $out = "";
        $result = array();

        try {
            $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
            $fid = explode('_zp_', $fid, 2);
            $zp_version = $fid[1];
            $deviceId = $fid[0];

            // Appel une méthode du webservice
    		$devices = $this->client->ListDeviceUsers($deviceId);

    		if (count($devices) > 0) {
        		$one = true;

        		// define list of cols to be displayed
        		$a_show_cols_accounts = array(
        		    'mel_moncompte.user',
        		    'mel_moncompte.first_sync',
        		    'mel_moncompte.last_sync',
        		    'mel_moncompte.z-push',
        		    'mel_moncompte.resync',
        		    'mel_moncompte.remove',
        		);

        		$result_accounts = array();

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

        				$attrib['id'] = 'rcmdeviceinfo';

        				// define list of cols to be displayed
        				$a_show_cols = array(
        				    'mel_moncompte.deviceid',
        				    'mel_moncompte.imei',
        				    'mel_moncompte.devicetype',
        				    'mel_moncompte.devicemodel',
        				    'mel_moncompte.operator',
        				    'mel_moncompte.user-agent',
        				    'mel_moncompte.version',
        				    'mel_moncompte.language',
        				);

        				$result = array(array(
        				    'id' => $attrib['id'].$deviceId,
        				    'mel_moncompte.deviceid' => $deviceId,
        				    'mel_moncompte.imei' => $imei,
        				    'mel_moncompte.devicetype' => $devicetype,
        				    'mel_moncompte.devicemodel' => $devicemodel,
        				    'mel_moncompte.operator' => $operator,
        				    'mel_moncompte.user-agent' => $useragent,
        				    'mel_moncompte.version' => $deviceos,
        				    'mel_moncompte.language' => $deviceoslanguage,
        				    'class' => '',
        				));

        				$out .= html::div(null, $this->plugin->gettext('device_info'));
        				// create XHTML table
        				$out .= $this->rc->table_output($attrib, $result, $a_show_cols, 'id');

        				if ($versionzpush >= 2) {
        				    $attrib['id'] = 'rcmactivesyncinfo';

        				    // define list of cols to be displayed
        				    $a_show_cols = array(
        				        'mel_moncompte.asversion',
        				        'mel_moncompte.wipestatus',
        				        'mel_moncompte.wiperequestedby',
        				        'mel_moncompte.wiperequestedon',
        				        'mel_moncompte.wipeactionon',
        				    );

        				    $result = array(array(
        				        'id' => $attrib['id'].$deviceId,
        				        'mel_moncompte.asversion' => $asversion,
        				        'mel_moncompte.wipestatus' => $wipestatus,
        				        'mel_moncompte.wiperequestedby' => $wiperequestedby,
        				        'mel_moncompte.wiperequestedon' => $wiperequestedon,
        				        'mel_moncompte.wipeactionon' => $wipeactionon,
        				        'class' => '',
        				    ));

        				    $out .= html::div(null, $this->plugin->gettext('activesync_info'));
        				    // create XHTML table
        				    $out .= $this->rc->table_output($attrib, $result, $a_show_cols, 'id');
        				}

        				$one = false;
        			}
        			// Récupération des données
        			$userDevice = $device['deviceuser'];
        			$firstsync = date('D d M y H:i:s', $device['firstsynctime']);
        			$lastsync = date('D d M y H:i:s', $device['lastupdatetime']);
        			$maxzpushvers = $device['zpushversion'];

        			$result_accounts[] = array(
        			    'id' => 'rcmaccountsinfo--'.$deviceId.'--'.$userDevice,
        			    'mel_moncompte.user' => $userDevice,
            		    'mel_moncompte.first_sync' => $firstsync,
            		    'mel_moncompte.last_sync' => $lastsync,
            		    'mel_moncompte.z-push' => $maxzpushvers,
        			    'mel_moncompte.resync' => "",
        			    'mel_moncompte.remove' => "",
        			    'class' => '',
    			    );
        		}

        		$attrib['id'] = 'rcmaccountsinfo';
        		$out .= html::div(null, $this->plugin->gettext('accounts_list'));
        		// create XHTML table
        		$out .= $this->rc->table_output($attrib, $result_accounts, $a_show_cols_accounts, 'id');
    		}
        }
        catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }

        return $out;
    }

    /**
     * Génération de la table hmlt d'information sur les synchronisations
     * @param array $attrib
     * @return string
     */
    public function sync_details($attrib) {
        // add id to message list table if not specified
        if (!strlen($attrib['id']))
            $attrib['id'] = 'rcmsyncdetails';

        $out = "";

        try {
            $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
            $fid = explode('_zp_', $fid, 2);
            $zp_version = $fid[1];
            $deviceId = $fid[0];

            // Récupère les détails d'un appareil
    		$foldersinfos = $this->client->GetDeviceDetails($deviceId);

    		if (count($foldersinfos) > 0) {
        		// define list of cols to be displayed
        		$a_show_cols = array(
        		    'mel_moncompte.mailbox',
        		    'mel_moncompte.type',
        		    'mel_moncompte.foldersync',
        		    'mel_moncompte.last_sync',
        		    'mel_moncompte.z-push',        		    
        			'mel_moncompte.resync',
        			'mel_moncompte.remaining',
        		);
        		$result = array();

        		// Pour chaque folder : c'est à dire pour chaque backend
        		mel_logs::get_instance()->log(mel_logs::DEBUG, "[sync_details] " . print_r($foldersinfos, 1));
        		foreach ($foldersinfos as $userFolder => $folderinfo) {
        			foreach ($folderinfo as $folderid => $zpush) {
        				foreach ($zpush as $zpushversion => $data) {
        					// type de bakend : contact, calendar, ...
        					$type = $data['contentclass'];
        					$folderidname = $data['folderid'];
        					$lastsync = date('D d M y H:i:s', $data['lastsynctime']);
        					$total = (!isset($data['foldersynctotal']) || $data['foldersynctotal'] != '') ? $data['foldersynctotal'] : "-";
        					$remaining = (!is_null($data['foldersyncremaining']) || $data['foldersyncremaining'] != '') ? $data['foldersyncremaining'] : "-";
        					$synced = (is_integer($total) && is_integer($remaining)) ? $data['foldersynctotal'] - $data['foldersyncremaining'] : "-";
        					// MANTIS 3592: La ré initialisation d'un conteneur spécifique resynchronise toutes les données du compte
        					$id_folderid = str_replace('/', '_-s-_', $folderid);
        					$id_folderid = str_replace('.', '_-p-_', $id_folderid);
        					$id_userFolder = str_replace('.', '_-p-_', $userFolder);

        					$result[] = array(
        					    'id' => 'rcmsyncdetails--'.$deviceId.'--'.$id_userFolder.'--'.$id_folderid,
        					    'mel_moncompte.mailbox' => $userFolder,
        					    'mel_moncompte.type' => $type,
        					    'mel_moncompte.foldersync' => $folderidname,
        					    'mel_moncompte.last_sync' => $lastsync,
        					    'mel_moncompte.z-push' => $zpushversion,
        						'mel_moncompte.resync' => "",
        						'mel_moncompte.remaining' => $synced . " / " . $total,
    					    );
        				}
        			}
        		}

        		$out .= html::div(null, $this->plugin->gettext('sync_details'));
        		// create XHTML table
        		$out .= $this->rc->table_output($attrib, $result, $a_show_cols, 'id');
    		}
        }
        catch (Exception $ex) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[mobiles_list] " . $ex->getTraceAsString());
            return "";
        }
        return $out;
    }

    /**
     * Execution de la command zpush
     * Ecrit le résultat en json
     */
    public function zpush_command() {
        $status = "success";
        $message = "";

        $command = trim(rcube_utils::get_input_value('_command', rcube_utils::INPUT_POST));
        $deviceId = trim(rcube_utils::get_input_value('_device_id', rcube_utils::INPUT_POST));
        $unlock = trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST));

        try {
            if (isset($command)
                    && isset($deviceId)) {
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
                        if (isset($folderId)
                                && isset($userFolder)) {
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