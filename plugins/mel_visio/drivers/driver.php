<?php

namespace MelVisio;

use rcmail;

/**
 * Classe abstraite de base pour les drivers du plugin mel_visio.
 *
 * Un driver permet d'étendre ou de remplacer le comportement par défaut
 * du plugin de façon modulaire. Il peut intercepter l'initialisation,
 * surcharger la configuration visio, ou prendre en charge l'affichage
 * de certaines pages.
 *
 * Usage : créer une sous-classe, placer le fichier dans le répertoire
 * du plugin, et déclarer son nom dans la config via 'visio-driver'.
 *
 * @example
 * class my_driver extends Driver {
 *     protected function _p_stopPluginInit(): bool { return true; }
 *     protected function _p_init(): void { // initialisation custom }
 * }
 */
abstract class Driver
{
    /**
     * Instance du plugin mel_visio parent.
     * Accessible en lecture seule via @see _p_plugin().
     *
     * @var \mel_visio
     * @todo En php 8.5, passer en readonly
     */
    private \mel_visio $plugin;

    /**
     * @param \mel_visio $plugin Instance du plugin parent,
     *                          injectée à la création du driver.
     */
    public function __construct(\mel_visio $plugin) {
        $this->plugin = $plugin;
    }

    /**
     * Retourne l'instance du plugin mel_visio parent.
     *
     * Point d'accès unique à $plugin pour les sous-classes,
     * en lecture seule (pas de setter).
     *
     * @return \mel_visio
     * @todo En php 8.5, la supprimer et utiliser la variable readonly
     */
    protected function _p_plugin(): \mel_visio {
        return $this->plugin;
    }

    /**
     * Point d'entrée de l'initialisation du driver.
     *
     * Exécute la logique d'initialisation du driver (@see _p_init),
     * puis indique au plugin s'il doit interrompre sa propre initialisation.
     *
     * Appelé par mel_visio::init() juste après le chargement du driver.
     * Si cette méthode retourne true, mel_visio arrête son init standard
     * et délègue entièrement au driver.
     *
     * @return bool true pour interrompre l'init du plugin, false pour la laisser continuer
     */
    public final function intercept(): bool {
        $this->_p_init();
        return $this->_p_stopPluginInit();
    }

    /**
     * Permet au driver de modifier la configuration envoyée à l'interface visio.
     *
     * Enveloppe @see _p_updateVisioConfig. Le tableau retourné remplace
     * intégralement la config courante.
     *
     * @param  array $configs Configuration visio courante (clés de type 'visio.*')
     * @return array Configuration modifiée ou identique
     */
    public final function updateVisioConfig(array $configs): array {
        return $this->_p_updateVisioConfig($configs);
    }

    /**
     * Permet au driver de prendre en charge l'affichage d'une page.
     *
     * Enveloppe @see _p_page. Si le driver retourne true, mel_visio
     * n'exécute pas son propre rendu de page.
     *
     * @param  string $page Nom de la page demandée (ex: 'index', 'visio', 'init')
     * @return bool   true si le driver gère la page, false pour laisser le plugin la gérer
     */
    public final function page(string $page): bool {
        return $this->_p_page($page);
    }

    /**
     * Logique d'initialisation propre au driver.
     *
     * Surcharger cette méthode pour exécuter du code au démarrage
     * (connexions, chargement de config, etc.).
     * Ne pas appeler directement : passer par @see intercept().
     */
    protected function _p_init(): void {}

    /**
     * Indique si le driver doit interrompre l'initialisation standard du plugin.
     *
     * Retourne false par défaut : le plugin s'initialise normalement après le driver.
     * Retourner true pour prendre entièrement la main sur le cycle de vie du plugin.
     *
     * @return bool true pour bloquer l'init du plugin, false pour la laisser passer
     */
    protected function _p_stopPluginInit(): bool { return false; }

    /**
     * Modifie la configuration visio avant qu'elle soit envoyée au client.
     *
     * Retourne le tableau inchangé par défaut.
     * Surcharger pour ajouter, modifier ou supprimer des entrées de config.
     *
     * @param  array $configs Configuration courante
     * @return array Configuration (potentiellement modifiée)
     */
    protected function _p_updateVisioConfig(array $configs): array { return $configs; }

    /**
     * Gère le rendu d'une page à la place du plugin.
     *
     * Retourne false par défaut : le plugin conserve le rendu.
     * Surcharger pour intercepter une ou plusieurs pages spécifiques.
     *
     * @param  string $page Nom de la page
     * @return bool   true si le driver a rendu la page, false sinon
     */
    protected function _p_page(string $page): bool { return false; }

    protected function rc(): \rcmail {
        return rcmail::get_instance();
    }
}