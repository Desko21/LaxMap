import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_WRITE_URL,
    NOMINATIM_USER_AGENT,
    JSONBIN_LOGS_READ_URL,
    JSONBIN_LOGS_WRITE_URL
} from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('add-event.js loaded.');

    const addEventForm = document.getElementById('addEventForm');
    const eventNameInput = document.getElementById('eventName');
    const eventLocationInput = document.getElementById('eventLocation');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const geolocationMessageDiv = document.getElementById('geolocationMessage');
    const messageDiv = document.getElementById('message');

    const eventStartDateInput = document.getElementById('eventStartDate');
    const eventEndDateInput = document.getElementById('eventEndDate');
    const eventDescriptionTextarea = document.getElementById('eventDescription');
    const eventLinkInput = document.getElementById('eventLink');
    const contactEmailInput = document.getElementById('contactEmail');
    const eventCostInput = document.getElementById('eventCost');

    // **NUOVA RIGA: Riferimento al bottone di invio**
    const addEventButton = document.getElementById('add-event-button'); // ASSICURATI CHE IL TUO HTML ABBIA <button type="submit" id="add-event-button">

    // Dati per le dropdown
    const gameTypes = [
        { value: '', label: 'Select Event Type' },
        { value: 'field', label: 'Field' },
        { value: 'box', label: 'Box' },
        { value: 'sixes', label: 'Sixes' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'other', label: 'Other' }
    ];
    const genders = [
        { value: '', label: 'Select Gender' },
        { value: 'men', label: 'Men' },
        { value: 'women', label: 'Women' },
        { value: 'both', label: 'Both' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'other', label: 'Other' }
    ];
    const currencies = [
        { value: '', label: 'Select Currency' },
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
        { value: '', label: 'Not Specified' },
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

        optionsList.innerHTML = '';

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

    // Inizializzazione delle dropdown custom all'avvio
    initializeCustomDropdown('customEventType', gameTypes, 'Select Event Type');
    initializeCustomDropdown('customGenderType', genders, 'Select Gender');
    initializeCustomDropdown('customCurrencyType', currencies, 'Select Currency');
    initializeCustomDropdown('customCostType', costTypes, 'Not Specified');

    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    const hideMessage = () => {
        messageDiv.style.display = 'none';
    };

    // --- FUNZIONE CENTRALIZZATA PER LOGGARE LE ATTIVITÀ (CON RECUPERO IP E STRUTTURA JSON CORRETTA) ---
    async function logActivity(action, mainEventData, changeDetails = {}) {
        const timestamp = new Date().toISOString();
        let userIp = 'N/A';

        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                userIp = ipData.ip || 'N/A';
            } else {
                console.warn("Could not retrieve IP:", await ipResponse.text());
            }
        } catch (ipError) {
            console.error("Error retrieving IP:", ipError);
        }

        const logEntry = {
            timestamp: timestamp,
            action: action,
            ipAddress: userIp,
            event: { // Questo oggetto contiene solo i dettagli dell'evento attuale
                id: mainEventData.id,
                name: mainEventData.name,
                location: mainEventData.location
            }
        };

        // Aggiungi dettagli specifici di modifica o eliminazione al livello superiore del logEntry
        if (action === 'EVENT_CREATED') {
            logEntry.createdAt = new Date().toISOString();
        }
        // Puoi aggiungere qui logica per altri tipi di azioni se necessario in futuro

        try {
            const readLogResponse = await fetch(JSONBIN_LOGS_READ_URL, {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });
            let existingLogs = [];
            if (readLogResponse.ok) {
                const logData = await readLogResponse.json();
                existingLogs = Array.isArray(logData.record) ? logData.record : [];
            } else {
                console.warn(`Could not read existing logs (status: ${readLogResponse.status}), starting fresh or bin might be empty.`);
            }

            existingLogs.push(logEntry);

            const writeLogResponse = await fetch(JSONBIN_LOGS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY,
                    'X-Bin-Meta': 'false'
                },
                body: JSON.stringify(existingLogs)
            });

            if (!writeLogResponse.ok) {
                console.error("Failed to save activity log:", await writeLogResponse.text());
            } else {
                console.log(`Activity logged: ${action}`, logEntry);
            }
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    // --- FINE FUNZIONE LOGGING CENTRALIZZATA ---

    eventLocationInput.addEventListener('change', async () => {
        const location = eventLocationInput.value.trim();
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
                    latitudeInput.value = data[0].lat;
                    longitudeInput.value = data[0].lon;
                    geolocationMessageDiv.textContent = 'Coordinates found!';
                    geolocationMessageDiv.style.color = 'green';
                } else {
                    latitudeInput.value = '';
                    longitudeInput.value = '';
                    geolocationMessageDiv.textContent = 'Location not found. Please enter coordinates manually or refine location name.';
                    geolocationMessageDiv.style.color = 'orange';
                }
            } catch (error) {
                console.error('Error fetching geolocation:', error);
                geolocationMessageDiv.textContent = 'Error fetching coordinates. Please try again or enter manually.';
                geolocationMessageDiv.style.color = 'red';
            }
        } else {
            latitudeInput.value = '';
            longitudeInput.value = '';
            geolocationMessageDiv.textContent = '';
        }
    });

    // **BLOCCO MODIFICATO: Gestione dell'invio del form e del pulsante**
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disabilita il pulsante e mostra lo stato di caricamento
        if (addEventButton) { // Controlla che il pulsante esista
            addEventButton.disabled = true;
            addEventButton.textContent = 'Adding new event...';
            // Opzionale: aggiungi una classe per styling di caricamento (es. con un'icona spinner)
            // addEventButton.classList.add('loading');
        }

        const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const newEvent = {
            id: eventId,
            name: eventNameInput.value,
            location: eventLocationInput.value,
            latitude: parseFloat(latitudeInput.value) || null,
            longitude: parseFloat(longitudeInput.value) || null,
            type: selectedGameType,
            gender: selectedGender,
            currency: selectedCurrency,
            costType: selectedCostType,
            startDate: eventStartDateInput.value,
            endDate: eventEndDateInput.value || null,
            description: eventDescriptionTextarea.value || null,
            link: eventLinkInput.value || null,
            contactEmail: contactEmailInput.value || null,
            cost: parseFloat(eventCostInput.value) || null,
            createdAt: new Date().toISOString(),
            isFeatured: false // Default to false for new events
        };

        try {
            // Read existing events
            const readResponse = await fetch(JSONBIN_EVENTS_WRITE_URL + '/latest', {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });

            let existingEvents = [];
            if (readResponse.ok) {
                const data = await readResponse.json();
                existingEvents = Array.isArray(data.record) ? data.record : [];
            } else {
                console.warn("Could not read existing events or bin does not exist, starting fresh.");
            }

            existingEvents.push(newEvent);

            const writeResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(existingEvents)
            });

            if (!writeResponse.ok) {
                throw new Error(`HTTP error! status: ${writeResponse.status}`);
            }

            const result = await writeResponse.json();
            console.log('Event added successfully:', result);
            showMessage('Event added successfully!', 'success');
            addEventForm.reset(); // Clear the form

            // Reset custom dropdowns
            document.getElementById('customEventType').setValue('');
            document.getElementById('customGenderType').setValue('');
            document.getElementById('customCurrencyType').setValue('');
            document.getElementById('customCostType').setValue('');

            // --- CHIAMATA ALLA FUNZIONE DI LOGGING PER EVENTO CREATO ---
            await logActivity('EVENT_CREATED', {
                id: newEvent.id,
                name: newEvent.name,
                location: newEvent.location
            });
            // --- FINE CHIAMATA ALLA FUNZIONE DI LOGGING ---

        } catch (error) {
            console.error('Error adding event:', error);
            showMessage('Error adding event. Please try again.', 'error');
        } finally {
            // Riabilita il pulsante e ripristina il testo, indipendentemente dal successo o dall'errore
            if (addEventButton) {
                addEventButton.disabled = false;
                addEventButton.textContent = 'Add Event'; // Ripristina il testo originale
                // addEventButton.classList.remove('loading'); // Rimuovi la classe di caricamento se l'hai aggiunta
            }
        }
    });
});