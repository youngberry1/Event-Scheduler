"use strict";

/* =============================
   1. CLASSES
============================= */

class Event {
    #id;
    #title;
    #date;
    #attendees;

    constructor(title, date, attendees = []) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new TypeError("Event title must be a non-empty string");
        }
        if (!(date instanceof Date) || isNaN(date)) {
            throw new TypeError("Invalid date provided");
        }

        this.#id = Symbol("eventId");
        this.#title = title;
        this.#date = date;
        this.#attendees = new Set(attendees);
    }

    // Getters
    get id() { return this.#id; }
    get title() { return this.#title; }
    get date() { return this.#date; }
    get attendees() { return Array.from(this.#attendees); }

    // Setters
    set title(newTitle) {
        if (typeof newTitle !== "string" || newTitle.trim() === "") {
            throw new TypeError("Event title must be a non-empty string");
        }
        this.#title = newTitle;
    }
    set date(newDate) {
        if (!(newDate instanceof Date) || isNaN(newDate)) {
            throw new TypeError("Invalid date provided");
        }
        this.#date = newDate;
    }

    // Methods
    addAttendee(attendee) {
        if (typeof attendee !== "string" || attendee.trim() === "") {
            throw new TypeError("Attendee must be a non-empty string");
        }
        this.#attendees.add(attendee);
    }

    isHappeningToday() {
        const today = new Date();
        return this.#date.toDateString() === today.toDateString();
    }

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

class EventScheduler {
    #events;

    constructor() {
        this.#events = new Map();
    }

    addEvent(event) {
        if (!(event instanceof Event)) {
            throw new TypeError("Only Event instances can be added");
        }
        this.#events.set(event.id, event);
    }

    removeEvent(eventId) { return this.#events.delete(eventId); }
    getEvent(eventId) { return this.#events.get(eventId); }

    getAllEvents() {
        return Array.from(this.#events.values())
            .sort((a, b) => a.date - b.date);
    }

    getEventsOnDate(date) {
        if (!(date instanceof Date)) throw new TypeError("Invalid date provided");
        return this.getAllEvents().filter(ev => ev.date.toDateString() === date.toDateString());
    }

    findEventsByTitle(term) {
        if (typeof term !== "string") throw new TypeError("Search term must be a string");
        const lower = term.toLowerCase();
        return this.getAllEvents().filter(ev => ev.title.toLowerCase().includes(lower));
    }

    getTotalEvents() { return this.#events.size; }
    getTodaysEvents() { return this.getEventsOnDate(new Date()); }

    getAllAttendees() {
        const set = new Set();
        for (const ev of this.#events.values()) {
            ev.attendees.forEach(a => set.add(a));
        }
        return Array.from(set);
    }
}

/* =============================
   2. UTILITIES
============================= */

const utils = {
    formatDate: (date, options = {}) => {
        const defaultOptions = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        };
        const merged = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat("en-US", merged).format(date);
    },

    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

/* =============================
   3. DOM + STATE
============================= */

document.addEventListener("DOMContentLoaded", () => {
    const scheduler = new EventScheduler();
    let currentAttendees = [];

    // DOM Elements
    const eventTitleInput = document.getElementById("eventTitle");
    const eventDateInput = document.getElementById("eventDate");
    const attendeeInput = document.getElementById("attendee");
    const addAttendeeBtn = document.getElementById("addAttendeeBtn");
    const createEventBtn = document.getElementById("createEventBtn");
    const searchEventInput = document.getElementById("searchEvent");
    const sortDateBtn = document.getElementById("sortDateBtn");
    const todayEventsBtn = document.getElementById("todayEventsBtn");

    const eventList = document.getElementById("eventList");
    const attendeesList = document.getElementById("attendeesList");
    const totalEventsElem = document.getElementById("totalEvents");
    const todayEventsElem = document.getElementById("todayEvents");
    const totalAttendeesElem = document.getElementById("totalAttendees");

    /* =============================
       4. RENDERING FUNCTIONS
    ============================= */

    function renderAttendees() {
        attendeesList.innerHTML = currentAttendees.length > 0
            ? currentAttendees.map(a => `
                <div style="margin:5px 0; padding:5px; background:#f0f0f0; border-radius:3px;">${a}</div>
            `).join("")
            : `<div style="color:#999; font-style:italic;">No attendees added</div>`;
    }

    function renderEvents(events) {
        if (events.length === 0) {
            eventList.innerHTML = `<li class="event-item">No events found</li>`;
            return;
        }
        eventList.innerHTML = events.map(ev => {
            const d = ev.getDetails();
            return `
                <li class="event-item">
                    <div class="event-title">${d.title}</div>
                    <div class="event-details">
                        <span class="event-date">${utils.formatDate(d.date)}</span>
                        <span class="event-attendees">${d.attendees.length} attendees</span>
                    </div>
                    ${d.isToday ? `<div style="color:green;font-weight:bold;margin-top:5px;">Happening Today!</div>` : ""}
                </li>
            `;
        }).join("");
    }

    function updateEventList() {
        renderEvents(scheduler.getAllEvents());
    }

    function updateStats() {
        totalEventsElem.textContent = scheduler.getTotalEvents();
        todayEventsElem.textContent = scheduler.getTodaysEvents().length;
        totalAttendeesElem.textContent = scheduler.getAllAttendees().length;
    }

    /* =============================
       5. EVENT HANDLERS
    ============================= */

    addAttendeeBtn.addEventListener("click", () => {
        const name = attendeeInput.value.trim();
        if (name) {
            currentAttendees.push(name);
            renderAttendees();
            attendeeInput.value = "";
        }
    });

    createEventBtn.addEventListener("click", () => {
        try {
            const title = eventTitleInput.value.trim();
            const date = new Date(eventDateInput.value);
            if (!title || isNaN(date.getTime())) {
                alert("Please enter a valid title and date");
                return;
            }
            const ev = new Event(title, date, currentAttendees);
            scheduler.addEvent(ev);

            eventTitleInput.value = "";
            eventDateInput.value = "";
            currentAttendees = [];
            renderAttendees();

            updateEventList();
            updateStats();
            alert("Event created successfully!");
        } catch (err) {
            alert(`Error creating event: ${err.message}`);
        }
    });

    const debouncedSearch = utils.debounce(() => {
        const term = searchEventInput.value.trim();
        const events = term ? scheduler.findEventsByTitle(term) : scheduler.getAllEvents();
        renderEvents(events);
    }, 300);
    searchEventInput.addEventListener("input", debouncedSearch);

    sortDateBtn.addEventListener("click", () => renderEvents(scheduler.getAllEvents()));
    todayEventsBtn.addEventListener("click", () => renderEvents(scheduler.getTodaysEvents()));

    /* =============================
       6. INITIALIZATION
    ============================= */

    try {
        scheduler.addEvent(new Event("Team Meeting", new Date(Date.now() + 86400000), ["Alice", "Bob"]));
        scheduler.addEvent(new Event("Project Review", new Date(Date.now() + 172800000), ["Bob", "Charlie", "Diana"]));
        scheduler.addEvent(new Event("Client Presentation", new Date(), ["Alice", "Eve", "Frank"]));
    } catch (err) {
        console.error("Error creating sample events:", err);
    }

    renderAttendees();
    updateEventList();
    updateStats();
});
