import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL,
    NOMINATIM_USER_AGENT,
    JSONBIN_LOGS_READ_URL,
    JSONBIN_LOGS_WRITE_URL
} from './config.js'; // Assicurati che config.js sia nel percorso corretto

document.addEventListener('DOMContentLoaded', async () => {
    console.log('edit-event.js loaded.');

    const searchEventIdInput = document.getElementById('searchEventId');
    const searchButton = document.getElementById('searchButton');
    const eventEditFormContainer = document.getElementById('eventEditFormContainer');
    const editEventForm = document.getElementById('editEventForm');
    const messageDiv = document.getElementById('message');

    // Campi del form di modifica
    const eventIdInput = document.getElementById('eventId');
    const editEventNameInput = document.getElementById('editEventName');
    const editEventLocationInput = document.getElementById('editEventLocation');
    const editLatitudeInput = document.getElementById('editLatitude');
    const editLongitudeInput = document.getElementById('editLongitude');
    const geolocationMessageDiv = document.getElementById('geolocationMessage');

    const editEventStartDateInput = document.getElementById('editEventStartDate');
    const editEventEndDateInput = document.getElementById('editEventEndDate');
    const editEventDescriptionTextarea = document.getElementById('editEventDescription');
    const editEventLinkInput = document = document.getElementById('editEventLink');
    const editContactEmailInput = document.getElementById('editContactEmail');
    const editEventCostInput = document.getElementById('editEventCost');

    // NUOVO: Bottone per eliminare l'evento
    const deleteEventButton = document.getElementById('deleteEventButton');

    // Dati per le dropdown
    const gameTypes = [
        { value: '', label: 'Select Event Type' }, // Aggiunto placeholder, come in add-event.js
        { value: 'field', label: 'Field' },
        { value: 'box', label: 'Box' },
        { value: 'sixes', label: 'Sixes' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'other', label: 'Other' }
    ];
    const genders = [
        { value: '', label: 'Select Gender' }, // Aggiunto placeholder, come in add-event.js
        { value: 'men', label: 'Men' },
        { value: 'women', label: 'Women' },
        { value: 'both', label: 'Both' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'other', label: 'Other' }
    ];
    const currencies = [
        { value: '', label: 'Select Currency' }, // Aggiunto placeholder, come in add-event.js
        { value: 'usd', label: 'USD' },
        { value: 'eur', label: 'EUR' },
        { value: 'gbp', label: 'GBP' },
        { value: 'jpy', label: 'JPY' },
        { value: 'cad', label: 'C$' },
        { value: 'aud', label: 'A$' },
        { value: 'chf', label: 'CHF' },
        { value: 'cny', label: '¥' },
        { value: 'inr', label: '₹' },
        { value: 'brl', label: 'R$' }
    ];
    const costTypes = [
        { value: '', label: 'Not Specified' }, // Corretto il valore da 'not-specified' a ''
        { value: 'per-person', label: 'Per Person' },
        { value: 'per-team', label: 'Per Team' }
    ];

    // Variabili per memorizzare i valori selezionati dalle custom dropdown
    let selectedGameType = '';
    let selectedGender = '';
    let selectedCurrency = '';
    let selectedCostType = '';

    // --- FUNZIONE PER INIZIALIZZARE LE CUSTOM DROPDOWN ---
    function initializeCustomDropdown(dropdownElementId, optionsArray, placeholderText = "Select", initialValue = null) {
        const dropdown = document.getElementById(dropdownElementId);
        if (!dropdown) {
            console.warn(`Dropdown element with ID '${dropdownElementId}' not found. Ensure HTML element exists and ID is correct.`);
            return;
        }

        const toggleButton = dropdown.querySelector('.dropdown-toggle');
        const optionsList = dropdown.querySelector('.dropdown-options');

        if (!toggleButton || !optionsList) {
            console.error(`Missing .dropdown-toggle or .dropdown-options in dropdown with ID '${dropdownElementId}'. Check HTML structure.`);
            return;
        }

        optionsList.innerHTML = ''; // Pulisci le opzioni esistenti

        const selectOption = (value) => {
            const selectedOption = optionsArray.find(opt => opt.value === value);
            toggleButton.textContent = selectedOption ? selectedOption.label : placeholderText;

            optionsList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            const selectedLi = optionsList.querySelector(`li[data-value="${value}"]`);
            if (selectedLi) {
                selectedLi.classList.add('selected');
            }

            if (dropdownElementId === 'customEventType') selectedGameType = value;
            else if (dropdownElementId === 'customGenderType') selectedGender = value;
            else if (dropdownElementId === 'customCurrencyType') selectedCurrency = value;
            else if (dropdownElementId === 'customCostType') selectedCostType = value;

            console.log(`Dropdown '${dropdownElementId}' selected: ${value}`);
        };

        optionsArray.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option.label;
            li.setAttribute('data-value', option.value);
            li.setAttribute('role', 'option');
            li.setAttribute('tabindex', '0');
            optionsList.appendChild(li);

            li.addEventListener('click', (event) => {
                selectOption(option.value);
                closeDropdown(dropdown);
                event.stopPropagation();
                toggleButton.focus();
            });

            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectOption(option.value);
                    closeDropdown(dropdown);
                    toggleButton.focus();
                    e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                    const nextLi = li.nextElementSibling;
                    if (nextLi) nextLi.focus();
                    e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    const prevLi = li.previousElementSibling;
                    if (prevLi) prevLi.focus();
                    e.preventDefault();
                } else if (e.key === 'Escape') {
                    closeDropdown(dropdown);
                    toggleButton.focus();
                    e.preventDefault();
                }
            });
        });

        if (initialValue) {
            selectOption(initialValue);
        } else {
            toggleButton.textContent = placeholderText;
        }

        toggleButton.addEventListener('click', (event) => {
            document.querySelectorAll('.custom-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('open');
                }
            });
            dropdown.classList.toggle('open');
            event.stopPropagation();
        });

        dropdown.setValue = (value) => {
            selectOption(value);
        };
    }

    function closeDropdown(specificDropdown = null) {
        if (specificDropdown) {
            specificDropdown.classList.remove('open');
        } else {
            document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.custom-dropdown')) {
            closeDropdown();
        }
    });

    // --- Imposta lo zoom minimo per la mappa ---
    async function initializeMap(latitude, longitude) {
        if (window.map) {
            window.map.remove();
        }
        const initialLat = parseFloat(latitude) || 0;
        const initialLon = parseFloat(longitude) || 0;

        window.map = L.map('map').setView([initialLat, initialLon], 5);
        window.map.options.minZoom = 0; // Imposta lo zoom minimo per la mappa

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(window.map);

        if (window.currentMarker) {
            window.map.removeLayer(window.currentMarker);
        }
        window.currentMarker = L.marker([initialLat, initialLon]).addTo(window.map)
            .bindPopup(`<b>${editEventNameInput.value}</b><br>${editEventLocationInput.value}`)
            .openPopup();
    }
    // --- Fine modifica per la mappa ---


    // Inizializzazione delle dropdown custom all'avvio
    initializeCustomDropdown('customEventType', gameTypes, 'Select Event Type');
    initializeCustomDropdown('customGenderType', genders, 'Select Gender');
    initializeCustomDropdown('customCurrencyType', currencies, 'Select Currency');
    initializeCustomDropdown('customCostType', costTypes, 'Not Specified');

    const setEventType = document.getElementById('customEventType').setValue;
    const setGenderType = document.getElementById('customGenderType').setValue;
    const setCurrencyType = document.getElementById('customCurrencyType').setValue;
    const setCostType = document.getElementById('customCostType').setValue;

    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    const hideMessage = () => {
        messageDiv.style.display = 'none';
    };

    // --- FUNZIONE PER LOGGARE LE ATTIVITÀ (MODIFICATA) ---
    async function logActivity(actionType, eventDetails) { // Rinominato 'type' in 'actionType' e 'details' in 'eventDetails' per chiarezza
        try {
            // Nota: L'indirizzo IP dell'utente non è direttamente accessibile in JavaScript lato client
            // in modo affidabile per ragioni di sicurezza.
            // In un'applicazione reale, l'IP verrebbe catturato e loggato dal server che riceve la richiesta.
            // Qui usiamo un placeholder o un esempio per il formato.
            const ipAddress = "192.168.1.100"; // Placeholder IP per l'esempio

            // 1. Recupera i log esistenti
            const readResponse = await fetch(JSONBIN_LOGS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });

            if (!readResponse.ok) {
                console.warn(`Failed to read logs: HTTP status ${readResponse.status}`);
                return; // Non blocca l'operazione principale se il log fallisce
            }

            const data = await readResponse.json();
            const currentLogs = Array.isArray(data.record) ? data.record : [];

            // 2. Aggiungi la nuova voce di log
            const newLogEntry = {
                timestamp: new Date().toISOString(),
                action: actionType, // Usa 'action' come nome della chiave
                ipAddress: ipAddress,
                event: {
                    id: eventDetails.eventId,
                    name: eventDetails.eventName || eventDetails.newName || eventDetails.oldName, // Adatta per nome corrente/nuovo/vecchio
                    location: eventDetails.location || eventDetails.newLocation || eventDetails.oldLocation // Adatta per località corrente/nuova/vecchia
                }
            };

            // Aggiungi dettagli specifici per l'evento modificato o eliminato
            if (actionType === 'EVENT_EDITED') {
                newLogEntry.event.oldName = eventDetails.oldName;
                newLogEntry.event.newName = eventDetails.newName;
                newLogEntry.event.oldLocation = eventDetails.oldLocation;
                newLogEntry.event.newLocation = eventDetails.newLocation;
                newLogEntry.updatedAt = new Date().toISOString(); // Aggiunge un timestamp della modifica
            } else if (actionType === 'DELETED_EVENT') {
                newLogEntry.deletedAt = new Date().toISOString();
            }

            currentLogs.push(newLogEntry);

            // 3. Scrivi l'array aggiornato nel bin dei log
            const writeResponse = await fetch(JSONBIN_LOGS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(currentLogs)
            });

            if (!writeResponse.ok) {
                console.warn(`Failed to write log entry: HTTP status ${writeResponse.status}`);
            } else {
                console.log(`Activity logged: ${actionType}`, newLogEntry);
            }

        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    // --- FINE FUNZIONE LOGGING ---


    searchButton.addEventListener('click', async () => {
        const eventId = searchEventIdInput.value.trim();
        if (!eventId) {
            showMessage('Please enter an Event ID.', 'error');
            return;
        }

        hideMessage();
        eventEditFormContainer.style.display = 'none';

        try {
            const response = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const events = data.record;
            const eventToEdit = events.find(event => event.id === eventId);

            if (eventToEdit) {
                eventIdInput.value = eventToEdit.id;
                editEventNameInput.value = eventToEdit.name;
                editEventLocationInput.value = eventToEdit.location;
                editLatitudeInput.value = eventToEdit.latitude || '';
                editLongitudeInput.value = eventToEdit.longitude || '';

                setEventType(eventToEdit.type || '');
                setGenderType(eventToEdit.gender || '');
                setCurrencyType(eventToEdit.currency || '');
                setCostType(eventToEdit.costType || '');

                editEventStartDateInput.value = eventToEdit.startDate;
                editEventEndDateInput.value = eventToEdit.endDate || '';
                editEventDescriptionTextarea.value = eventToEdit.description || '';
                editEventLinkInput.value = eventToEdit.link || '';
                editContactEmailInput.value = eventToEdit.contactEmail || '';
                editEventCostInput.value = eventToEdit.cost || '';

                // Inizializza la mappa con le coordinate dell'evento
                initializeMap(eventToEdit.latitude, eventToEdit.longitude);

                eventEditFormContainer.style.display = 'block';
                showMessage('Event loaded successfully!', 'success');
                console.log('Event loaded:', eventToEdit);
            } else {
                showMessage('Event not found.', 'error');
                eventEditFormContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            showMessage('Error loading event. Please try again.', 'error');
        }
    });

    editEventLocationInput.addEventListener('change', async () => {
        const location = editEventLocationInput.value.trim();
        if (location) {
            try {
                geolocationMessageDiv.textContent = 'Searching coordinates...';
                geolocationMessageDiv.style.color = '#555';

                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
                    headers: {
                        'User-Agent': NOMINATIM_USER_AGENT
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    editLatitudeInput.value = data[0].lat;
                    editLongitudeInput.value = data[0].lon;
                    geolocationMessageDiv.textContent = 'Coordinates found!';
                    geolocationMessageDiv.style.color = 'green';
                    // Aggiorna la mappa con le nuove coordinate
                    initializeMap(data[0].lat, data[0].lon);
                } else {
                    editLatitudeInput.value = '';
                    editLongitudeInput.value = '';
                    geolocationMessageDiv.textContent = 'Location not found. Please enter coordinates manually or refine location name.';
                    geolocationMessageDiv.style.color = 'orange';
                    // Rimuovi il marker o resetta la mappa se le coordinate non sono trovate
                    if (window.currentMarker) {
                        window.map.removeLayer(window.currentMarker);
                        window.currentMarker = null;
                    }
                }
            } catch (error) {
                console.error('Error fetching geolocation:', error);
                geolocationMessageDiv.textContent = 'Error fetching coordinates. Please try again or enter manually.';
                geolocationMessageDiv.style.color = 'red';
            }
        } else {
            editLatitudeInput.value = '';
            editLongitudeInput.value = '';
            geolocationMessageDiv.textContent = '';
            // Rimuovi il marker o resetta la mappa se la location è vuota
            if (window.currentMarker) {
                window.map.removeLayer(window.currentMarker);
                window.currentMarker = null;
            }
        }
    });

    // Gestione dell'invio del form di modifica
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = eventIdInput.value;
        // Recupera i dati dell'evento prima della modifica per il log
        let originalEventData = null;

        try {
            const readResponse = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });
            if (!readResponse.ok) throw new Error(`HTTP error! status: ${readResponse.status}`);
            const existingData = await readResponse.json();
            let events = existingData.record || [];

            const eventIndex = events.findIndex(event => event.id === eventId);
            if (eventIndex === -1) {
                showMessage('Error: Event not found for update.', 'error');
                return;
            }
            originalEventData = { ...events[eventIndex] }; // Copia i dati originali

            const newEventData = {
                id: eventId,
                name: editEventNameInput.value,
                location: editEventLocationInput.value,
                latitude: parseFloat(editLatitudeInput.value) || null,
                longitude: parseFloat(editLongitudeInput.value) || null,
                type: selectedGameType,
                gender: selectedGender,
                currency: selectedCurrency,
                costType: selectedCostType,
                startDate: editEventStartDateInput.value,
                endDate: editEventEndDateInput.value || null,
                description: editEventDescriptionTextarea.value || null,
                link: editEventLinkInput.value || null,
                contactEmail: editContactEmailInput.value || null,
                cost: parseFloat(editEventCostInput.value) || null,
                isFeatured: events[eventIndex].isFeatured // Mantiene lo stato originale di isFeatured
            };

            events[eventIndex] = newEventData;

            const writeResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(events)
            });

            if (!writeResponse.ok) {
                throw new Error(`HTTP error! status: ${writeResponse.status}`);
            }

            const result = await writeResponse.json();
            console.log('Event updated successfully:', result);
            showMessage('Event updated successfully!', 'success');

            // --- CHIAMATA ALLA FUNZIONE DI LOGGING PER EVENTO MODIFICATO ---
            await logActivity('EVENT_EDITED', { // Cambiato il tipo di action a "EVENT_EDITED"
                eventId: newEventData.id,
                eventName: newEventData.name, // Nome attuale dell'evento
                location: newEventData.location, // Località attuale dell'evento
                oldName: originalEventData.name,
                newName: newEventData.name,
                oldLocation: originalEventData.location,
                newLocation: newEventData.location
                // updatedAt: new Date().toISOString() // Già aggiunto nella funzione logActivity
            });
            // --- FINE CHIAMATA ALLA FUNZIONE DI LOGGING ---

        } catch (error) {
            console.error('Error updating event:', error);
            showMessage('Error updating event. Please try again.', 'error');
        }
    });

    // Gestione del pulsante Elimina Evento
    if (deleteEventButton) {
        deleteEventButton.addEventListener('click', async () => {
            const eventIdToDelete = eventIdInput.value.trim();
            if (!eventIdToDelete) {
                showMessage('No event ID to delete.', 'error');
                return;
            }

            if (!confirm(`Are you sure you want to delete event with ID: ${eventIdToDelete}?`)) {
                return;
            }

            hideMessage();

            try {
                const readResponse = await fetch(JSONBIN_EVENTS_READ_URL, {
                    headers: {
                        'X-Master-Key': JSONBIN_MASTER_KEY
                    }
                });

                if (!readResponse.ok) {
                    throw new Error(`HTTP error! status: ${readResponse.status}`);
                }

                const data = await readResponse.json();
                let events = data.record || [];

                // Trova i dettagli dell'evento prima di eliminarlo, per il log
                const eventToDeleteDetails = events.find(event => event.id === eventIdToDelete);

                const initialLength = events.length;
                events = events.filter(event => event.id !== eventIdToDelete);

                if (events.length === initialLength) {
                    showMessage('Event not found for deletion.', 'error');
                    return;
                }

                const writeResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_MASTER_KEY
                    },
                    body: JSON.stringify(events)
                });

                if (!writeResponse.ok) {
                    throw new Error(`HTTP error! status: ${writeResponse.status}`);
                }

                console.log(`Event ${eventIdToDelete} deleted successfully.`);
                showMessage('Event deleted successfully!', 'success');

                // --- CHIAMATA ALLA FUNZIONE DI LOGGING PER EVENTO ELIMINATO ---
                if (eventToDeleteDetails) { // Logga solo se l'evento è stato effettivamente trovato e "cancellato"
                    await logActivity('DELETED_EVENT', {
                        eventId: eventToDeleteDetails.id,
                        eventName: eventToDeleteDetails.name,
                        location: eventToDeleteDetails.location
                        // deletedAt: new Date().toISOString() // Già aggiunto nella funzione logActivity
                    });
                }
                // --- FINE CHIAMATA ALLA FUNZIONE DI LOGGING ---

                editEventForm.reset();
                eventEditFormContainer.style.display = 'none';

                document.getElementById('customEventType').setValue('');
                document.getElementById('customGenderType').setValue('');
                document.getElementById('customCurrencyType').setValue('');
                document.getElementById('customCostType').setValue('');

                // Rimuovi anche il marker dalla mappa se presente
                if (window.currentMarker) {
                    window.map.removeLayer(window.currentMarker);
                    window.currentMarker = null;
                }

            } catch (error) {
                console.error('Error deleting event:', error);
                showMessage('Error deleting event. Please try again.', 'error');
            }
        });
    }
});