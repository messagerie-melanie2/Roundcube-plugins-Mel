<?php

declare(strict_types=1);

/**
 * @author Thomas Payen <thomas.payen@i-carre.net>
 *
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program. If not, see <http://www.gnu.org/licenses/>
 *
 */

namespace OCA\Bnum\Controller;

use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\AppFramework\OCSController;
use OCP\Files\NotFoundException;
use OCP\Files\IRootFolder;
use OCP\IRequest;
use OCP\IServerContainer;
use OCP\IUserSession;
use OCP\Files\IAppData;

/**
 * Class Bnum OCS
 *
 * @package OCA\Bnum\API
 */
class BnumAPIController extends OCSController {

	/** @var IServerContainer */
	private $serverContainer;
	/** @var IUserSession */
	private $userSession;
	/** @var IAppData */
	private $appData;
	/** @var IRootFolder  */
	protected $rootFolder;
	private $userId;

	/**
	 * Bnum OCS constructor.
	 *
	 * @param IServerContainer $serverContainer
	 * @param IUserSession $userSession
	 */
	public function __construct(
		string $appName,
		IRequest $request,
		IServerContainer $serverContainer,
		IUserSession $userSession,
		IAppData $appData,
		IRootFolder $rootFolder,
		$userId
	) {
		parent::__construct($appName, $request);

		$this->request = $request;
		$this->serverContainer = $serverContainer;
		$this->userSession = $userSession;
		$this->appData = $appData;
		$this->userId = $userId;
		$this->rootFolder = $rootFolder;
	}

	/**
	 * The getFolders function.
	 *
	 * @NoAdminRequired
	 *
	 * @param string $entities
	 *
	 * - Get entities folders by the current user (?entities=true)
	 * - Get workspaces folders by the current user (?entities=false)
	 *
	 * @return DataResponse
	 * @throws NotFoundException
	 * @throws OCSBadRequestException
	 * @throws OCSNotFoundException
	 */
	public function getFolders(
		string $entities = 'true',
		string $personal = 'false'
	): DataResponse {
		
		$folders = [];

		// PAMELA 
        // \Psr\Container\ContainerInterface::get(\OCA\GroupFolders\Folder\FolderManager::class);
		$folderManager = $this->serverContainer->query(\OCA\GroupFolders\Folder\FolderManager::class);
		if (isset($folderManager)) {
			$userFolder = $this->rootFolder->getUserFolder($this->userId);
			$_folders = $folderManager->getFoldersForUser($this->userSession->getUser());
			$entitiesLabel = 'entite-';
			$workspacesLabel = 'dossiers-';
			$sharedFolderLabel = 'Partagés avec vous';

			if ($personal == 'true') {
				// Dossier à retourner en API
				$folders[] = [
					'id' 			=> $userFolder->getId(),
					'path' 			=> $userFolder->getPath(),
					'type' 			=> $userFolder->getType(),
					'displayName' 	=> $userFolder->getName(),
					'name' 			=> $userFolder->getName(),
					'freeSpace' 	=> $userFolder->getFreeSpace(),
					'mimetype' 		=> $userFolder->getMimetype(),
					'permissions' 	=> $userFolder->getPermissions(),
					'mountType'		=> $userFolder->getMountPoint()->getMountType(),
					'size' 			=> $userFolder->getSize(),
					'etag' 			=> $userFolder->getEtag(),
					'mtime' 		=> $userFolder->getMTime() * 1000,
				];
			}
			
			foreach ($userFolder->getDirectoryListing() as $directory) {
				$isGroupFolder = $directory->getMountPoint() instanceof \OCA\GroupFolders\Mount\GroupMountPoint;
				$isShared = $directory->getMountPoint() instanceof \OCA\Files_Sharing\SharedMount 
							|| $directory->getName() == $sharedFolderLabel;
				if ($personal == 'false' && $isGroupFolder) {
					if ($entities == 'true' && strpos($directory->getName(), $entitiesLabel) !== 0
							|| $entities == 'false' && strpos($directory->getName(), $workspacesLabel) !== 0) {
						continue;
					}

					// Entites
					if (strpos($directory->getName(), $entitiesLabel) === 0) {
						$name = str_replace($entitiesLabel, '', $directory->getName());
						if (strpos($name, ',') !== false) {
							$name = substr($name, strrpos($name, ',') + 1);
						}
					}
					// Workspaces
					else if (strpos($directory->getName(), $workspacesLabel) === 0) {
						$name = str_replace($workspacesLabel, '', $directory->getName());
						if (substr($name, -2) == '-1') {
							$name = substr($name, 0, strlen($name) - 2);
						}
					}

					// Rechercher le dossier pour le quota
					$quota = null;
					foreach ($_folders as $folder) {
						if ($folder['mount_point'] == $directory->getName()) {
							$quota = $folder['quota'];
						}
					}

					// Dossier à retourner en API
					$folders[] = [
						'id' 			=> '-' . $directory->getName(),
						'path' 			=> '',
						'type' 			=> $directory->getType(),
						'displayName' 	=> $name,
						'name' 			=> $directory->getName(),
						'mimetype' 		=> $directory->getMimetype(),
						'permissions' 	=> $directory->getPermissions(),
						'quota' 		=> $quota,
						'size' 			=> $directory->getSize(),
						'mtime' 		=> $directory->getMTime() * 1000,
					];
				}
				else if ($personal == 'true' && !$isGroupFolder && !$isShared && $directory->getName() != 'Partagés avec vous') {
					if ($directory->getName() == 'Partagés avec vous') {
						continue;
					}
					// Dossier à retourner en API
					$folders[] = [
						'id' 			=> $directory->getId(),
						'path' 			=> '',
						'type' 			=> $directory->getType(),
						'displayName' 	=> $directory->getName(),
						'name' 			=> $directory->getName(),
						'mimetype' 		=> $directory->getMimetype(),
						'mountType'		=> $userFolder->getMountPoint()->getMountType(),
						'permissions' 	=> $directory->getPermissions(),
						'size' 			=> $directory->getSize(),
						'etag' 			=> $directory->getEtag(),
						'mtime' 		=> $directory->getMTime() * 1000,
					];
				}
			}
		}

		return new DataResponse($folders);
	}
}
