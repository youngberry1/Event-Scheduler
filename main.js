// Using strict mode
"use strict";

// Event class using ES6 class syntax
class Event {
    #id;
    #title;
    #date;
    #attendees;

    constructor(title, date, attendees = []) {
        // Validate inputs
        if (typeof title !== 'string' || title.trim() === '') {
            throw new TypeError('Event title must be a non-empty string');
        }

        if (!(date instanceof Date) || isNaN(date)) {
            throw new TypeError('Invalid date provided');
        }

        // Initialize properties
        this.#id = Symbol('eventId'); // Using Symbol for unique ID
        this.#title = title;
        this.#date = date;
        this.#attendees = new Set(attendees); // Using Set to avoid duplicates
    }

    // Getters
    get id() {
        return this.#id;
    }

    get title() {
        return this.#title;
    }

    get date() {
        return this.#date;
    }

    get attendees() {
        return Array.from(this.#attendees); // Return as array
    }

    // Setters with validation
    set title(newTitle) {
        if (typeof newTitle !== 'string' || newTitle.trim() === '') {
            throw new TypeError('Event title must be a non-empty string');
        }
        this.#title = newTitle;
    }

    set date(newDate) {
        if (!(newDate instanceof Date) || isNaN(newDate)) {
            throw new TypeError('Invalid date provided');
        }
        this.#date = newDate;
    }

    // Method to add attendee
    addAttendee(attendee) {
        if (typeof attendee !== 'string' || attendee.trim() === '') {
            throw new TypeError('Attendee must be a non-empty string');
        }
        this.#attendees.add(attendee);
    }

    // Method to check if event is happening today
    isHappeningToday() {
        const today = new Date();
        return this.#date.toDateString() === today.toDateString();
    }

    // Method to get event details as an object
    getDetails() {
        return {
            id: this.#id,
            title: this.#title,
            date: this.#date,
            attendees: this.attendees,
            isToday: this.isHappeningToday()
        };
    }
}

// EventScheduler class
class EventScheduler {
    #events; // Private field

    constructor() {
        this.#events = new Map(); // Using Map to store events by their ID
    }

    // Add event to scheduler
    addEvent(event) {
        if (!(event instanceof Event)) {
            throw new TypeError('Only Event instances can be added');
        }
        this.#events.set(event.id, event);
    }

    // Remove event by ID
    removeEvent(eventId) {
        return this.#events.delete(eventId);
    }

    // Get event by ID
    getEvent(eventId) {
        return this.#events.get(eventId);
    }

    // Get all events sorted by date
    getAllEvents() {
        return Array.from(this.#events.values())
            .sort((a, b) => a.date - b.date);
    }

    // Get events happening on a specific date
    getEventsOnDate(date) {
        if (!(date instanceof Date)) {
            throw new TypeError('Invalid date provided');
        }

        return this.getAllEvents().filter(event =>
            event.date.toDateString() === date.toDateString()
        );
    }

    // Find events by title (case-insensitive)
    findEventsByTitle(searchTerm) {
        if (typeof searchTerm !== 'string') {
            throw new TypeError('Search term must be a string');
        }

        const term = searchTerm.toLowerCase();
        return this.getAllEvents().filter(event =>
            event.title.toLowerCase().includes(term)
        );
    }

    // Get total number of events
    getTotalEvents() {
        return this.#events.size;
    }

    // Get today's events
    getTodaysEvents() {
        return this.getEventsOnDate(new Date());
    }

    // Get all unique attendees across all events
    getAllAttendees() {
        const attendeesSet = new Set();
        for (const event of this.#events.values()) {
            for (const attendee of event.attendees) {
                attendeesSet.add(attendee);
            }
        }
        return Array.from(attendeesSet);
    }
}

// Utility functions
const utils = {
    // Format date to readable string
    formatDate: (date, options = {}) => {
        const defaultOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        const mergedOptions = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
    },

    // Debounce function for search
    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Main application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scheduler
    const scheduler = new EventScheduler();

    // DOM elements
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDateInput = document.getElementById('eventDate');
    const attendeeInput = document.getElementById('attendee');
    const addAttendeeBtn = document.getElementById('addAttendeeBtn');
    const createEventBtn = document.getElementById('createEventBtn');
    const searchEventInput = document.getElementById('searchEvent');
    const sortDateBtn = document.getElementById('sortDateBtn');
    const todayEventsBtn = document.getElementById('todayEventsBtn');
    const eventList = document.getElementById('eventList');
    const attendeesList = document.getElementById('attendeesList');
    const totalEventsElem = document.getElementById('totalEvents');
    const todayEventsElem = document.getElementById('todayEvents');
    const totalAttendeesElem = document.getElementById('totalAttendees');

    // Current event attendees
    let currentAttendees = [];

    // Add sample events for demonstration
    try {
        const sampleEvent1 = new Event(
            'Team Meeting',
            new Date(Date.now() + 86400000), // Tomorrow
            ['Alice', 'Bob']
        );
        scheduler.addEvent(sampleEvent1);

        const sampleEvent2 = new Event(
            'Project Review',
            new Date(Date.now() + 172800000), // Day after tomorrow
            ['Bob', 'Charlie', 'Diana']
        );
        scheduler.addEvent(sampleEvent2);

        const sampleEvent3 = new Event(
            'Client Presentation',
            new Date(),
            ['Alice', 'Eve', 'Frank']
        );
        scheduler.addEvent(sampleEvent3);

        updateEventList();
        updateStats();
    } catch (error) {
        console.error('Error creating sample events:', error);
    }

    // Add attendee to current event
    addAttendeeBtn.addEventListener('click', () => {
        const attendee = attendeeInput.value.trim();
        if (attendee) {
            currentAttendees.push(attendee);
            updateAttendeesList();
            attendeeInput.value = '';
        }
    });

    // Create new event
    createEventBtn.addEventListener('click', () => {
        try {
            const title = eventTitleInput.value.trim();
            const date = new Date(eventDateInput.value);

            if (!title || isNaN(date.getTime())) {
                alert('Please enter a valid title and date');
                return;
            }

            const newEvent = new Event(title, date, currentAttendees);
            scheduler.addEvent(newEvent);

            // Reset form
            eventTitleInput.value = '';
            eventDateInput.value = '';
            currentAttendees = [];
            updateAttendeesList();

            updateEventList();
            updateStats();

            alert('Event created successfully!');
        } catch (error) {
            alert(`Error creating event: ${error.message}`);
        }
    });

    // Search events with debouncing
    const debouncedSearch = utils.debounce(() => {
        const searchTerm = searchEventInput.value.trim();
        let events;

        if (searchTerm) {
            events = scheduler.findEventsByTitle(searchTerm);
        } else {
            events = scheduler.getAllEvents();
        }

        renderEventList(events);
    }, 300);

    searchEventInput.addEventListener('input', debouncedSearch);

    // Sort events by date
    sortDateBtn.addEventListener('click', () => {
        const events = scheduler.getAllEvents();
        renderEventList(events);
    });

    // Show today's events
    todayEventsBtn.addEventListener('click', () => {
        const events = scheduler.getTodaysEvents();
        renderEventList(events);
    });

    // Update attendees list
    function updateAttendeesList() {
        attendeesList.innerHTML = currentAttendees.length > 0
            ? currentAttendees.map(attendee =>
                `<div style="margin: 5px 0; padding: 5px; background: #f0f0f0; border-radius: 3px;">${attendee}</div>`
            ).join('')
            : '<div style="color: #999; font-style: italic;">No attendees added</div>';
    }

    // Update event list
    function updateEventList() {
        const events = scheduler.getAllEvents();
        renderEventList(events);
    }

    // Render event list
    function renderEventList(events) {
        if (events.length === 0) {
            eventList.innerHTML = '<li class="event-item">No events found</li>';
            return;
        }

        eventList.innerHTML = events.map(event => {
            const details = event.getDetails();
            return `
                        <li class="event-item">
                            <div class="event-title">${details.title}</div>
                            <div class="event-details">
                                <span class="event-date">${utils.formatDate(details.date)}</span>
                                <span class="event-attendees">${details.attendees.length} attendees</span>
                            </div>
                            ${details.isToday ? '<div style="color: green; font-weight: bold; margin-top: 5px;">Happening Today!</div>' : ''}
                        </li>
                    `;
        }).join('');
    }

    // Update statistics
    function updateStats() {
        totalEventsElem.textContent = scheduler.getTotalEvents();
        todayEventsElem.textContent = scheduler.getTodaysEvents().length;
        totalAttendeesElem.textContent = scheduler.getAllAttendees().length;
    }

    // Initialize attendees list
    updateAttendeesList();
});