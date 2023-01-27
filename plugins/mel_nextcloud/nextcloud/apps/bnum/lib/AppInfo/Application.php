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

class Application extends App implements IBootstrap {
    public const APP_ID = 'bnum';

    public function __construct(array $urlParams = []) {
		parent::__construct(self::APP_ID, $urlParams);

		$container = $this->getContainer();

		/** @var IEventDispatcher $dispatcher */
		$dispatcher = $container->query(IEventDispatcher::class);

		$dispatcher->addServiceListener(LoadAdditionalScriptsEvent::class, LoadAdditionalListener::class);

		/**
		 * Always add bnum script
		 */
		Util::addScript(self::APP_ID, 'dist/bnum');
	}

    public function register(IRegistrationContext $context): void {
		
	}

    public function boot(IBootContext $context): void {
		if (isset($_SERVER['REQUEST_METHOD']) && isset($_SERVER['REQUEST_METHOD'])
				&& $_SERVER['REQUEST_METHOD'] == 'GET' 
				&& $_SERVER['PATH_INFO'] == "/apps/files/") {
			$context->injectFn(Closure::fromCallable([$this, 'registerNavigation']));
		}
	}

    private function registerNavigation(IL10N $l10n, IUserSession $userSession, IURLGenerator $urlGenerator): void {
		// PAMELA 
        // \Psr\Container\ContainerInterface::get(\OCA\GroupFolders\Folder\FolderManager::class);
		$folderManager = $this->getContainer()->query(\OCA\GroupFolders\Folder\FolderManager::class);
		$user = $userSession->getUser();
		if (isset($folderManager) && isset($user)) {
			$folders = $folderManager->getFoldersForUser($user);

            // Sort folders by alphabetical order
			usort($folders, function($a, $b) {
				if ($a['mount_point'] == $b['mount_point']) {
					return 0;
				}
				return ($a['mount_point'] < $b['mount_point']) ? -1 : 1;
			});

			// Entities params
			$entitiesLabel = 'entite-';
			$entitiesNavBarPosition = 6;
			$entitiesNavBarPositionPosition = $entitiesNavBarPosition;
			$entitiesCurrentCount = 0;
			$entitiesSublist = [];

			// Workspaces params
			$workspacesLabel = 'dossiers-';
			$workspacesNavBarPosition = 7;
			$workspacesNavBarPositionPosition = $workspacesNavBarPosition;
			$workspacesSublist = [];
			$workspacesCurrentCount = 0;

			foreach ($folders as $folder) {
				$id = '-' . $folder['mount_point'];
				$dir = '/' . $folder['mount_point'];
				$link = $urlGenerator->linkToRoute('files.view.index', ['dir' => $dir, 'view' => 'files']);

				// Entites
				if (strpos($folder['mount_point'], $entitiesLabel) === 0) {
					$sortingValue = ++$entitiesCurrentCount;
					$name = str_replace($entitiesLabel, '', $folder['mount_point']);
					if (strpos($name, ',') !== false) {
						$name = substr($name, strrpos($name, ',') + 1);
					}
					$order = $entitiesNavBarPositionPosition;
				}
				// Workspaces
				else if (strpos($folder['mount_point'], $workspacesLabel) === 0) {
					$sortingValue = ++$workspacesCurrentCount;
					$name = str_replace($workspacesLabel, '', $folder['mount_point']);
					if (substr($name, -2) == '-1') {
						$name = substr($name, 0, strlen($name) - 2);
					}
					$order = $workspacesNavBarPositionPosition;
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

				// Entites
				if (strpos($folder['mount_point'], $entitiesLabel) === 0) {
					$element['expandedState'] = 'show_entities_menu';
					array_push($entitiesSublist, $element);
					$entitiesNavBarPositionPosition++;
				}
				// Workspaces
				else if (strpos($folder['mount_point'], $workspacesLabel) === 0) {
					array_push($workspacesSublist, $element);
					$workspacesNavBarPositionPosition++;
				}
			}

			$entitiesCollapseClasses = '';
			if (count($entitiesSublist) > 0) {
				$entitiesCollapseClasses = 'collapsible';
			}

			$workspacesCollapseClasses = '';
			if (count($workspacesSublist) > 0) {
				$workspacesCollapseClasses = 'collapsible';
			}

			// // Fichiers perso
			// \OCA\Files\App::getNavigationManager()->add(function () use ($l10n) {
			// 	return [
			// 		'id' => 'personalfiles',
			// 		'appname' => self::APP_ID,
			// 		'script' => 'list.php',
			// 		'icon' => 'files',
			// 		'order' => 1,
			// 		'name' => $l10n->t('Fichiers personnels')
			// 	];
			// });

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