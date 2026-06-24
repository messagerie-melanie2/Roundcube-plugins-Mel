<?php

/**
 * Classe de base abstraite pour la définition du layout d'un espace de travail.
 *
 * Chaque skin fournit une implémentation concrète de cette classe dans
 * `skins/<skin>/php/workspace_layout.php` sous le nom de classe `WorkspaceLayout`.
 * Le plugin découvre et instancie automatiquement cette classe lors du rendu
 * de la page d'accueil d'un espace de travail.
 *
 * La classe implémentante est responsable de peupler le layout via
 * {@see WorkspacePageLayout} en définissant les blocs, colonnes et entrées
 * de navigation propres à la skin.
 *
 * @see WorkspacePageLayout
 * @see WorkspacePageRow
 */
abstract class AWorkspaceLayout
{
    /**
     * Layout à peupler et à retourner par {@see AWorkspaceLayout::render()}.
     *
     * @var WorkspacePageLayout
     */
    private WorkspacePageLayout $layout;

    /**
     * Instance du plugin principal, permettant l'accès à Roundcube
     * et aux utilitaires du plugin (traductions, configuration, etc.).
     *
     * @var mel_workspace
     */
    private mel_workspace $plugin;

    /**
     * Données de l'espace de travail courant à afficher.
     *
     * @var Workspace
     */
    private Workspace $workspace;

    /**
     * Initialise le layout avec les dépendances nécessaires au rendu.
     *
     * @param WorkspacePageLayout $layout    Layout vide à peupler
     * @param mel_workspace       $plugin    Instance du plugin principal
     * @param Workspace           $workspace Espace de travail courant
     */
    public function __construct(WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace)
    {
        $this->layout    = $layout;
        $this->plugin    = $plugin;
        $this->workspace = $workspace;
    }

    /**
     * Peuple le layout avec les blocs, colonnes et entrées de navigation
     * propres à la skin, puis le retourne.
     *
     * Cette méthode est le point d'entrée unique appelé par le plugin.
     * L'implémentation concrète doit utiliser {@see AWorkspaceLayout::getLayout()}
     * pour accéder au layout et le retourner en fin de méthode.
     *
     * @return WorkspacePageLayout Layout configuré par la skin
     */
    abstract public function render(): WorkspacePageLayout;

    /**
     * Retourne le layout à peupler.
     *
     * @return WorkspacePageLayout
     */
    protected function getLayout(): WorkspacePageLayout
    {
        return $this->layout;
    }

    /**
     * Retourne l'instance du plugin principal.
     *
     * @return mel_workspace
     */
    protected function getPlugin(): mel_workspace
    {
        return $this->plugin;
    }

    /**
     * Retourne les données de l'espace de travail courant.
     *
     * @return Workspace
     */
    protected function getWorkspace(): Workspace
    {
        return $this->workspace;
    }
}