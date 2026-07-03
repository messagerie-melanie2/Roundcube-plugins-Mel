/**
 * Déclarations de types pour le script global `mel_metapage.js`.
 *
 * @remarks
 * `mel_metapage.js` est un script "classique" (non ESM, sans `export`) qui pose
 * `window.mel_metapage`. Ce fichier `.d.ts` ne fait donc que déclarer le type
 * global correspondant, afin que l'éditeur arrête de typer `mel_metapage` en `any`.
 * Il n'a aucun effet sur le runtime : aucune des méthodes ci-dessous n'est ré-implémentée.
 *
 * @remarks
 * Les types `EventListenerDatas`, `MelDataStore`, `ArianePopUp`, `ArianeButton`,
 * `WebconfLink` et `Enumerable` sont supposés déjà déclarés ailleurs dans le projet
 * (ce sont des classes globales utilisées par d'autres scripts). Si ce n'est pas le cas,
 * il faudra soit les déclarer, soit les remplacer ponctuellement par `any` en attendant.
 *
 * Pour que l'éditeur prenne en compte ce fichier, il suffit qu'il soit visible par le
 * compilateur TS/JS (même dossier que les autres `.d.ts`, ou listé dans `"include"` /
 * `"files"` du `tsconfig.json`/`jsconfig.json`) : aucun import n'est nécessaire.
 */

/**
 * Frame mémorisée dans l'historique de navigation de `mel_metapage.Frames`.
 */
interface MelMetapageFrame {
  /** Nom affiché de la frame. */
  name: string;
  /** Tâche Roundcube associée à la frame. */
  task: string;
  /** Icône associée à la frame. */
  icon: string;
}

/**
 * Élément de vérification retourné par `mel_metapage.Storage.check()` pour une clé donnée.
 */
interface MelMetapageStorageCheckItem {
  /**
   * Attend la fin de la mise à jour en cours (si une mise à jour a été déclenchée),
   * puis retourne la valeur à jour.
   */
  wait: () => Promise<any>;
}

/**
 * Résultat global retourné par `mel_metapage.Storage.check()` lorsqu'aucune clé n'est précisée.
 */
interface MelMetapageStorageCheckAll {
  /** Liste des éléments vérifiés. */
  items: MelMetapageStorageCheckItem[];
  /** Attend la fin de toutes les mises à jour en cours. */
  wait: () => Promise<void>;
}

interface EventListenerDatas {
  after: Readonly<string>;
  before: Readonly<string>;
  get: Readonly<string>;
  toString(): string;
}

/**
 * Liste des évènements (`EventListenerDatas`) déclenchés par le plugin `mel_metapage`.
 */
interface MelMetapageEventListeners {
  calendar_updated: EventListenerDatas;
  tasks_updated: EventListenerDatas;
  mails_updated: EventListenerDatas;
  wsp_stockage_updated: EventListenerDatas;
  workspaces_updated: EventListenerDatas;
}

interface MelDataStore {
  set<T>(id: string, val: T): MelDataStore;
  get<T>(id: string): T | null;
  remove(id: string): MelDataStore;
  getSize(): string;
}

/**
 * Stockage local (clé/valeur) utilisé par le plugin `mel_metapage`.
 */
interface MelMetapageStorage {
  /** Symbole représentant une valeur "inexistante" dans le stockage local. */
  readonly unexist: symbol;

  /** Vérifie si une valeur issue du stockage local existe réellement. */
  exists(val: unknown): boolean;

  /** Récupère (et instancie si besoin) le `MelDataStore` interne. */
  _getDataStore(): MelDataStore;

  /** Récupère une donnée depuis le stockage local (retourne `unexist` en cas d'erreur de lecture). */
  get<T = any>(key: string, _default?: T | null): T | symbol;

  /** Ajoute ou modifie une donnée dans le stockage local. */
  set(key: string, item: unknown, stringify?: boolean): void;

  /** Supprime une donnée dans le stockage local. */
  remove(key: string): void;

  /** Notifie la fenêtre courante et les frames "mm-frame" qu'une donnée a changé. */
  setStoreChange(key: string, item: unknown): void;

  /** Taille (en octets) des données présentes dans le stockage local. */
  getAppStorageSize(): number;

  /** Vérifie si une (ou toutes les) clé(s) de stockage doivent être rafraîchies. */
  check(
    storage?: string | symbol | null,
  ): MelMetapageStorageCheckAll | MelMetapageStorageCheckItem;

  // --- Clés de stockage (constantes) ---
  calendar_all_events: string;
  calendar: string;
  calendar_by_days: string;
  calendars_number_wainting: string;
  tasks: string;
  other_tasks: string;
  other_tasks_count: string;
  mail: string;
  wsp_mail: string;
  last_calendar_update: string;
  last_task_update: string;
  ariane: string;
  wait_frame_loading: string;
  wait_frame_waiting: string;
  wait_frame_loaded: string;
  wait_call_loading: string;
  color_mode: string;
  title_workspaces: string;
}

/**
 * Symboles utilisés à travers le plugin `mel_metapage` (évite les comparaisons par chaîne magique).
 */
interface MelMetapageSymbols {
  my_day: {
    calendar: symbol;
    tasks: symbol;
  };
  nextcloud: {
    folder: symbol;
    file: symbol;
  };
  navigator: {
    firefox: symbol;
  };
  /** Symbole générique représentant l'absence de valeur (différent de `null`/`undefined`). */
  null: symbol;
}

/**
 * Identifiants DOM utilisés par le plugin `mel_metapage`.
 */
interface MelMetapageIds {
  menu: {
    badge: {
      calendar: string;
      tasks: string;
      mail: string;
      ariane: string;
    };
  };
  create: {
    doc_input: string;
    doc_input_ext: string;
    doc_input_hidden: string;
    doc_input_path: string;
  };
}

interface ArianePopUp {}

/**
 * Gestion de la popup de chat "Ariane".
 */
interface MelMetapagePopUp {
  /** Ouvre (ou bascule l'affichage de) la popup de chat "Ariane". */
  open_ariane(): void;
  /** Instance courante de la popup "Ariane", ou `null` si elle n'a pas encore été créée. */
  ariane: ArianePopUp | null;
}

/**
 * Constantes annexes diverses.
 */
interface MelMetapageOther {
  webconf: {
    private: string;
  };
}

/**
 * Actions exécutées au démarrage de Roundcube.
 */
interface MelMetapageRcmailStart {
  /** Vérifie si le serveur Nextcloud configuré est joignable. */
  ping_nextcloud(): Promise<void>;
}

/**
 * Historique des dernières frames affichées (pile à taille limitée).
 */
interface MelMetapageFrames {
  /** Nombre maximum de frames mémorisées. */
  max: number;
  /** Pile des dernières frames affichées. */
  lastFrames: MelMetapageFrame[];

  add(frame: MelMetapageFrame): this;
  reset(): this;
  pop(): MelMetapageFrame | null;
  last(it?: number): MelMetapageFrame | null;
  back(_default?: string): Promise<this>;
  create_frame(name: string, task: string, icon: string): MelMetapageFrame;
}

/**
 * Fonctions liées au stockage Nextcloud ("Drive").
 */
interface MelMetapageFunctionsStockage {
  go(
    datas: unknown,
    goFunc?: (() => void) | string | null,
    thenFunc?: (() => void) | string | null,
  ): this;
  have_0_quota(): boolean;
  is_stockage_active(): boolean;
  canDriveActions(): boolean;
}

/**
 * Fonctions de mise à jour de certaines données.
 */
interface MelMetapageFunctionsUpdate {
  calendar(): MelMetapageFunctions;
}

/**
 * Fonctions utilitaires liées au contraste/luminance des couleurs (WCAG).
 */
interface MelMetapageFunctionsColors {
  kMel_Luminance(rgb: number[]): number;
  kMel_CompareLuminance(rgb1: number[], rgb2: number[]): number;
  kMel_LuminanceRatioAAA(rgb1: number[], rgb2: number[]): boolean;
  kMel_extractRGB(color: string): number[] | undefined;
}

/**
 * Fonctions utilitaires diverses du plugin `mel_metapage`.
 */
interface MelMetapageFunctions {
  copy(text: string): this;
  /**
   * @remarks `start`/`end` sont des instances `moment`. Typé en `any` ici pour ne pas dépendre
   * de `@types/moment` ; remplacer par `moment.Moment` si ce paquet est installé.
   */
  update_calendar(start: any, end: any): any;
  check_if_calendar_valid(
    element: any,
    events: any[],
    test?: boolean,
  ): boolean | any;
  check_if_date_is_okay(
    sd: string | any,
    ed: string | any,
    date: string | any,
  ): boolean;
  get_from_url(url: string): Record<string, string>;
  url(
    task: string,
    action?: string | null,
    args?: Record<string, unknown> | null,
  ): string;
  public_url(path: string, args?: Record<string, unknown> | null): string;
  change_frame(
    frame: string,
    changepage?: boolean,
    waiting?: boolean,
    args?: Record<string, unknown> | null,
    actions?: unknown[],
  ): Promise<this>;
  change_page(
    task: string,
    action?: string | null,
    params?: Record<string, unknown>,
    update?: boolean,
    force?: boolean,
  ): Promise<this>;
  open_chat(channel_or_group?: string | null): Promise<void>;
  update_frame(frame: string): this;
  frame_back(wait?: boolean, default_frame?: string | null): Promise<any>;
  get_current_title(current_task?: string | null, _default?: string): string;
  call(
    exec: string | Function | Record<string, unknown>,
    child?: boolean,
    args?: Record<string, unknown>,
  ): this;
  callAsync(
    exec: string | Function | Record<string, unknown>,
    child?: boolean,
    args?: Record<string, unknown>,
  ): Promise<this>;
  title(url: string): this;
  busy(busy?: boolean): this;
  is_busy(): boolean;
  ask<T = any>(props: string): Promise<T>;
  updateRichText(html: string): string;
  remove_accents(string: string): string;
  replace_dets(string?: string, rep?: string): string;
  replace_special_char(string: string, rep?: string): string;
  webconf_url(url: string): string | null;
  _shuffle<T>(array: T[]): T[];
  generateWebconfRoomName(): string;
  /** @remarks Retour `any` (au lieu de `JQuery.jqXHR`) pour ne pas dépendre de `@types/jquery`. */
  ajax(
    url: string,
    datas?: unknown,
    success?: (datas: any) => void,
    failed?: (xhr: any, ajaxOptions: any, thrownError: any) => void,
    type?: string,
  ): any;
  get(
    url: string,
    datas?: Record<string, unknown>,
    success?: (datas: any) => void,
    failed?: (xhr: any, ajaxOptions: any, thrownError: any) => void,
  ): any;
  post(
    url: string,
    datas?: unknown,
    success?: (datas: any) => void,
    failed?: (xhr: any, ajaxOptions: any, thrownError: any) => void,
  ): any;
  update: MelMetapageFunctionsUpdate;
  /** @remarks `element` est un noeud DOM ou un objet jQuery ; typé en `any` pour ne pas dépendre de `@types/jquery`. */
  handlerExist(element: any, handler: Function, type?: string): boolean;
  stockage: MelMetapageFunctionsStockage;
  searchOnMail(
    itemToSearch: string,
    fields: string[],
    openFrame?: boolean,
  ): Promise<this>;
  doActionFrame(
    frame: string,
    doAction: ((state: 0 | 1 | 2, ...args: any[]) => void) | string,
    ...functionArgs: any[]
  ): this;
  update_refresh_thing(): this;
  isNavigator(symbol: symbol): boolean;
  change_frame_nextcloud(
    _params?: string | { path: string; id: string } | null,
  ): Promise<this>;
  comment_mail(
    uid: string,
    comment: string,
    options?: { folder?: string; subject?: string | null },
  ): Promise<any>;
  calculateObjectSizeInMo(obj: unknown): number;
  colors: MelMetapageFunctionsColors;
}

/**
 * Type global du plugin `mel_metapage`, exposé sur `window.mel_metapage`.
 */
interface MelMetapageUtils {
  EventListeners: MelMetapageEventListeners;
  Storage: MelMetapageStorage;
  Symbols: MelMetapageSymbols;
  Ids: MelMetapageIds;
  PopUp: MelMetapagePopUp;
  Other: MelMetapageOther;
  RCMAIL_Start: MelMetapageRcmailStart;
  Frames: MelMetapageFrames;
  Functions: MelMetapageFunctions;
}

declare global {
  /** Plugin global `mel_metapage` (posé sur `window` par `mel_metapage.js`). */
  // eslint-disable-next-line no-var
  var mel_metapage: MelMetapageUtils;

  /** Lien du chargement des évènements d'un calendrier. */
  // eslint-disable-next-line no-var
  var ev_calendar_url: string;

  interface Window {
    mel_metapage: MelMetapageUtils;
    /** Décode une chaîne IMAP UTF-7 vers de l'UTF-16 standard. */
    decode_imap_utf7: (mstring: string) => string;
    /** Crée ou met à jour un cookie navigateur. */
    melSetCookie: (cname: string, cvalue: string, exdays: number) => void;
    /** Récupère la valeur d'un cookie via Roundcube. */
    getCookie: (name: string) => string | null;
    /** Supprime un cookie navigateur. */
    removeCookie: (name: string) => void;
  }
}

export {};
