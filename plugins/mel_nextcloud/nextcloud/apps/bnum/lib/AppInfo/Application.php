<?php

declare(strict_types=1);

/**
 * App permettant l'intégration de nextCloud au Bnum.
 * 
 * Plusieurs fonctionnalité :
 *  - Authentification transparente depuis Roundcube
 *  - Gestion de l'authentification depuis le client
 *  - Gestion des espaces d'entités et de travail dans la NavBarre
 * 
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

namespace OCA\Bnum\AppInfo;

use Closure;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\EventDispatcher\IEventDispatcher;
use OCA\Bnum\Listener\LoadAdditionalListener;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\IL10N;
use OCP\Util;
use OCP\IURLGenerator;
use OCP\IUserSession;
use OCP\Files\IRootFolder;

class Application extends App implements IBootstrap {
    public const APP_ID = 'bnum';

    public function __construct(array $urlParams = []) {
		parent::__construct(self::APP_ID, $urlParams);

		$container = $this->getContainer();

		// /** @var IEventDispatcher $dispatcher */
		$dispatcher = $container->query(IEventDispatcher::class);

		$dispatcher->addServiceListener(LoadAdditionalScriptsEvent::class, LoadAdditionalListener::class);
	}

    public function register(IRegistrationContext $context): void {
		
	}

    public function boot(IBootContext $context): void {
		if (isset($_SERVER['REQUEST_METHOD']) && isset($_SERVER['PATH_INFO'])
				&& $_SERVER['REQUEST_METHOD'] == 'GET' 
				&& trim($_SERVER['PATH_INFO'], '/') == "apps/files") {
			$context->injectFn(Closure::fromCallable([$this, 'registerNavigation']));
		}
	}

    private function registerNavigation(IL10N $l10n, IUserSession $userSession, IURLGenerator $urlGenerator, IRootFolder $rootFolder): void {
		$user = $userSession->getUser();
		if (isset($user)) {
			$userFolder = $rootFolder->getUserFolder($user->getUID());

			$sharedFolderLabel = 'Partagés avec vous';

			// Personal folders params
			$personalFoldersSublist = [];
			$personalFoldersNavBarPosition = 6;
			$personalFoldersNavBarPositionPosition = $personalFoldersNavBarPosition;
			$personalFoldersCurrentCount = 0;

			// Entities params
			$entitiesLabel = 'entite-';
			$entitiesNavBarPosition = 7;
			$entitiesNavBarPositionPosition = $entitiesNavBarPosition;
			$entitiesCurrentCount = 0;
			$entitiesSublist = [];

			// Workspaces params
			$workspacesLabel = 'dossiers-';
			$workspacesNavBarPosition = 8;
			$workspacesNavBarPositionPosition = $workspacesNavBarPosition;
			$workspacesSublist = [];
			$workspacesCurrentCount = 0;

			foreach ($userFolder->getDirectoryListing() as $directory) {
				$id = '-' . $directory->getName();
				$dir = '/' . $directory->getName();
				$link = $urlGenerator->linkToRoute('files.view.index', ['dir' => $dir, 'view' => 'files']);

				$isGroupFolder = $directory->getMountPoint() instanceof \OCA\GroupFolders\Mount\GroupMountPoint;
				$isShared = $directory->getMountPoint() instanceof \OCA\Files_Sharing\SharedMount 
							|| $directory->getName() == $sharedFolderLabel;
				if ($isGroupFolder) {
					if (strpos($directory->getName(), $entitiesLabel) !== 0 && strpos($directory->getName(), $workspacesLabel) !== 0) {
						continue;
					}

					// Entites
					if (strpos($directory->getName(), $entitiesLabel) === 0) {
						$sortingValue = ++$entitiesCurrentCount;
						$name = str_replace($entitiesLabel, '', $directory->getName());
						if (strpos($name, ',') !== false) {
							$name = substr($name, strrpos($name, ',') + 1);
						}
						$order = $entitiesNavBarPositionPosition;
					}
					// Workspaces
					else if (strpos($directory->getName(), $workspacesLabel) === 0) {
						$sortingValue = ++$workspacesCurrentCount;
						$name = str_replace($workspacesLabel, '', $directory->getName());
						if (substr($name, -2) == '-1') {
							$name = substr($name, 0, strlen($name) - 2);
						}
						$order = $workspacesNavBarPositionPosition;
					}
				}
				else if ($isShared || $directory->getType() != 'dir') {
					continue;
				}
				else {
					$name = $directory->getName();
					$sortingValue = ++$personalFoldersCurrentCount;
					$order = $personalFoldersNavBarPositionPosition;
				}

				$element = [
					'id' => $id,
					'view' => 'files',
					'href' => $link,
					'dir' => $dir,
					'order' => $order,
					'folderPosition' => $sortingValue,
					'name' => $name,
					'icon' => 'files',
					'quickaccesselement' => 'true'
				];

				if (!$isGroupFolder) {
					array_push($personalFoldersSublist, $element);
					$personalFoldersNavBarPositionPosition++;
				}
				else if (strpos($directory->getName(), $entitiesLabel) === 0) {
					array_push($entitiesSublist, $element);
					$entitiesNavBarPositionPosition++;
				}
				else if (strpos($directory->getName(), $workspacesLabel) === 0) {
					array_push($workspacesSublist, $element);
					$workspacesNavBarPositionPosition++;
				}
			}

			$personalFoldersCollapseClasses = '';
			if (count($personalFoldersSublist) > 0) {
				$personalFoldersCollapseClasses = 'collapsible';
			}

			$entitiesCollapseClasses = '';
			if (count($entitiesSublist) > 0) {
				$entitiesCollapseClasses = 'collapsible';

				// Trier par name
				usort($entitiesSublist, function ($a, $b) {
					if ($a['name'] == $b['name']) {
						return 0;
					}
					return ($a['name'] < $b['name']) ? -1 : 1;
				});
			}

			$workspacesCollapseClasses = '';
			if (count($workspacesSublist) > 0) {
				$workspacesCollapseClasses = 'collapsible';
			}

			// Fichiers perso
			\OCA\Files\App::getNavigationManager()->add(function () use ($l10n, $personalFoldersCollapseClasses, $personalFoldersNavBarPosition, $personalFoldersSublist) {
				return [
					'id' => 'personalfiles',
					'appname' => self::APP_ID,
					'script' => 'list.php',
					'classes' => $personalFoldersCollapseClasses,
					'icon' => 'files',
					'order' => $personalFoldersNavBarPosition,
					'name' => $l10n->t('Espace individuel'),
					'expandedState' => 'show_personal_files_menu',
					'sublist' => $personalFoldersSublist,
				];
			});

			// Entites
			\OCA\Files\App::getNavigationManager()->add(function () use ($entitiesNavBarPosition, $l10n, $entitiesCollapseClasses, $entitiesSublist) {
				return [
					'id' => 'entities',
					'appname' => self::APP_ID,
					'script' => 'entities.php',
					'order' => $entitiesNavBarPosition,
					'name' => $l10n->t('Espaces d\'entités'),
					'classes' => $entitiesCollapseClasses,
					'icon' => 'shareoverview',
					'expandedState' => 'show_entities_menu',
					'sublist' => $entitiesSublist,
				];
			});

			// Espaces de travail
			\OCA\Files\App::getNavigationManager()->add(function () use ($workspacesNavBarPosition, $l10n, $workspacesCollapseClasses, $workspacesSublist) {
				return [
					'id' => 'workspaces',
					'appname' => self::APP_ID,
					'script' => 'workspaces.php',
					'order' => $workspacesNavBarPosition,
					'name' => $l10n->t('Espaces de travail'),
					'classes' => $workspacesCollapseClasses,
					'icon' => 'shareoverview',
					'expandedState' => 'show_workspaces_menu',
					'sublist' => $workspacesSublist,
				];
			});
		}
	}
}