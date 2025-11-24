<?php
class CalendarEvent 
{
    // Propriétés obligatoires (accessibles mais définies dans le constructeur)
    public string $title;
    public DateTime $start;
    public DateTime $end;

    // Propriétés optionnelles (avec valeurs par défaut)
    public bool $allDay = false;
    public array $categories = [];
    public ?string $description = null;
    public ?string $location = null;
    public ?string $calendar = null;
    public ?string $freeBusy = null;
    
    private ?array $recurrence = null;

    public function __construct(string $title, DateTime $start, DateTime $end)
    {
        $this->title = $title;
        $this->start = $start;
        $this->end = $end;
    }

    public function setRecurrence(array $recurrence): void
    {
        $this->recurrence = $recurrence;
    }

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