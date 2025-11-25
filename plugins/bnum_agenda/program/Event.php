<?php
/**
 * Classe représentant un événement de calendrier.
 *
 * Cette classe permet de stocker les informations principales d'un événement,
 * telles que le titre, les dates de début et de fin, ainsi que des propriétés
 * optionnelles comme la description, la localisation, les catégories, etc.
 */
class CalendarEvent 
{
    /**
     * Titre de l'événement.
     * @var string
     */
    public string $title;

    /**
     * Date et heure de début de l'événement.
     * @var DateTime
     */
    public DateTime $start;

    /**
     * Date et heure de fin de l'événement.
     * @var DateTime
     */
    public DateTime $end;

    /**
     * Indique si l'événement dure toute la journée.
     * @var bool
     */
    public bool $allDay = false;

    /**
     * Liste des catégories associées à l'événement.
     * @var array
     */
    public array $categories = [];

    /**
     * Description de l'événement (optionnel).
     * @var string|null
     */
    public ?string $description = null;

    /**
     * Lieu de l'événement (optionnel).
     * @var string|null
     */
    public ?string $location = null;

    /**
     * Identifiant du calendrier associé (optionnel).
     * @var string|null
     */
    public ?string $calendar = null;

    /**
     * Statut de disponibilité (libre/occupé) (optionnel).
     * @var string|null
     */
    public ?string $freeBusy = null;
    
    /**
     * Récurrence de l'événement (optionnel).
     * @var array|null
     */
    private ?array $recurrence = null;

    /**
     * Constructeur de la classe CalendarEvent.
     *
     * @param string   $title  Titre de l'événement
     * @param DateTime $start  Date et heure de début
     * @param DateTime $end    Date et heure de fin
     */
    public function __construct(string $title, DateTime $start, DateTime $end)
    {
        $this->title = $title;
        $this->start = $start;
        $this->end = $end;
    }

    /**
     * Définit la récurrence de l'événement.
     *
     * @param array $recurrence Tableau décrivant la récurrence
     * @return void
     */
    public function setRecurrence(array $recurrence): void
    {
        $this->recurrence = $recurrence;
    }

    /**
     * Retourne l'événement sous forme de tableau associatif.
     *
     * @return array
     */
    public function toArray(): array
    {
        $array = [
            'title' => $this->title,
            'start' => $this->start,
            'end' => $this->end,
            'allday' => $this->allDay,
            'categories' => $this->categories,
            'description' => $this->description,
            'location' => $this->location,
            'calendar' => $this->calendar,
            'status' => $this->freeBusy,
        ];

        if ($this->recurrence !== null) {
            $array['recurrence'] = $this->recurrence;
        }

        return $array;
    }
}