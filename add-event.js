// add-event.js

import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_WRITE_URL,
    JSONBIN_LOGS_WRITE_URL,
    NOMINATIM_USER_AGENT
} from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('add-event.js loaded.');

    // --- HTML Element References ---
    const addEventForm = document.getElementById('addEventForm');
    const messageDiv = document.getElementById('message');
    const geolocationMessageDiv = document.getElementById('geolocationMessage');
    const eventLocationInput = document.getElementById('eventLocation');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const submitButton = document.getElementById('addEventButton');

    // !!! CAMBIATO: Riferimenti ai div delle dropdown personalizzate, NON più i select
    const customEventTypeDropdown = document.getElementById('customEventType'); // Nuovo ID per il div della dropdown Game Type
    const customEventGenderDropdown = document.getElementById('customEventGender'); // Nuovo ID per il div della dropdown Gender

    // --- REFERENCES FOR COST AND CURRENCY (Nuovi ID per i div delle dropdown) ---
    const eventCostInput = document.getElementById('eventCost');
    const customCostTypeDropdown = document.getElementById('customCostType'); // Nuovo ID per il div della dropdown Cost Type
    const customEventCurrencyDropdown = document.getElementById('customEventCurrency'); // Nuovo ID per il div della dropdown Currency


    // --- Data for Select Options (MUST MATCH edit-event.js and script.js) ---
    const gameTypesOptions = ['Field', 'Box', 'Sixes', 'Clinic', 'Other'];
    const gendersOptions = ['Men', 'Women', 'Both', 'Mixed', 'Other'];
    const costTypeOptions = ['Not Specified', 'Per Person', 'Per Team'];
    const currencyOptions = [
        // NOTA: Per le custom dropdown, non abbiamo bisogno del placeholder vuoto come prima opzione
        // Il testo del bottone fa da placeholder.
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
    ];


    /**
     * Inizializza una dropdown personalizzata.
     * Questa funzione deve essere inclusa in ogni JS che usa custom-dropdown.
     * @param {HTMLElement} dropdownElement Il div con classe .custom-dropdown (es. customEventTypeDropdown).
     * @param {string[]} optionsArray Un array di stringhe per le opzioni (es. gameTypesOptions).
     * @param {string} initialText Il testo iniziale da mostrare sul bottone (es. "Select Game Type").
     * @param {string} initialValue Il valore iniziale da selezionare (opzionale, utile per pre-compilare).
     */
    function setupCustomDropdown(dropdownElement, optionsArray, initialText = 'Select...', initialValue = '') {
        // Se dropdownElement è null (es. l'ID non è stato trovato nell'HTML), esci.
        if (!dropdownElement) {
            console.error('Dropdown element not found:', dropdownElement);
            return;
        }

        const toggleButton = dropdownElement.querySelector('.dropdown-toggle');
        const optionsList = dropdownElement.querySelector('.dropdown-options');

        if (!toggleButton || !optionsList) {
            console.error('Dropdown internal elements not found for:', dropdownElement);
            return;
        }

        // Pulisci le opzioni esistenti
        optionsList.innerHTML = '';

        // Imposta il testo iniziale del bottone
        toggleButton.textContent = initialText;
        toggleButton.setAttribute('data-value', ''); // Nessun valore selezionato inizialmente

        let foundInitialSelection = false;

        // Popola le opzioni
        optionsArray.forEach(optionText => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            // I valori li useremo sempre in minuscolo e senza spazi per coerenza
            const dataValue = optionText.toLowerCase().replace(/\s/g, '');
            li.setAttribute('data-value', dataValue);
            li.textContent = optionText;
            optionsList.appendChild(li);

            // Se c'è un valore iniziale, cerca di selezionare l'opzione corrispondente
            if (initialValue && dataValue === initialValue.toLowerCase().replace(/\s/g, '')) {
                toggleButton.textContent = optionText; // Aggiorna il testo del bottone
                li.classList.add('selected'); // Aggiungi classe 'selected'
                foundInitialSelection = true;
            }

            li.addEventListener('click', () => {
                // Imposta il testo del bottone con il testo dell'opzione cliccata
                toggleButton.textContent = optionText;
                toggleButton.setAttribute('data-value', dataValue); // Imposta il data-value sul bottone
                dropdownElement.classList.remove('open');
                // Rimuovi 'selected' da tutti e aggiungi all'elemento corrente
                optionsList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
                // Aggiorna l'attributo aria-expanded
                toggleButton.setAttribute('aria-expanded', 'false');

                // Dispatch un evento 'change' personalizzato per simulare il comportamento di select
                const event = new Event('change', { bubbles: true });
                dropdownElement.dispatchEvent(event);
            });
        });

        // Se nessun valore iniziale è stato trovato, ma c'è un initialText, imposta quello
        if (!foundInitialSelection && initialText !== 'Select...') {
            toggleButton.textContent = initialText;
        }

        // Toggle della dropdown al click sul bottone
        toggleButton.addEventListener('click', () => {
            const isOpen = dropdownElement.classList.toggle('open');
            toggleButton.setAttribute('aria-expanded', isOpen);
        });

        // Chiudi la dropdown se si clicca fuori
        document.addEventListener('click', (event) => {
            if (!dropdownElement.contains(event.target) && dropdownElement.classList.contains('open')) {
                dropdownElement.classList.remove('open');
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // !!! CORREZIONE: Inizializza tutte le custom dropdown
    // Rimosse le chiamate a populateDropdown che causavano l'errore
    setupCustomDropdown(customEventTypeDropdown, gameTypesOptions, "Select Game Type");
    setupCustomDropdown(customEventGenderDropdown, gendersOptions, "Select Gender");
    setupCustomDropdown(customCostTypeDropdown, costTypeOptions, "Not Specified");
    setupCustomDropdown(customEventCurrencyDropdown, currencyOptions, "Select Currency");


    // --- Utility Functions ---

    // Funzione di supporto per ottenere il valore da una custom dropdown
    // Questa funzione sarà usata al momento del submit del form
    const getCustomDropdownValue = (dropdownElement) => {
        const selectedLi = dropdownElement.querySelector('.dropdown-options li.selected');
        // Ritorna il data-value dell'elemento selezionato, altrimenti una stringa vuota
        return selectedLi ? selectedLi.dataset.value : '';
    };

    async function logActivity(action, eventDetails) {
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
            event: {
                id: eventDetails.id,
                name: eventDetails.name,
                location: eventDetails.location,
            }
        };

        try {
            const readLogResponse = await fetch(JSONBIN_LOGS_WRITE_URL + '/latest', {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });
            let existingLogs = [];
            if (readLogResponse.ok) {
                const logData = await readLogResponse.json();
                existingLogs = logData.record || [];
            } else {
                console.warn("Could not read existing logs or bin does not exist, starting fresh.");
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
            }
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Function to generate a unique ID
    function generateUniqueId() {
        return 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Function to get coordinates from location
    async function getCoordinatesFromLocation(locationName) {
        if (locationName.trim() === '') {
            latitudeInput.value = '';
            longitudeInput.value = '';
            geolocationMessageDiv.textContent = '';
            geolocationMessageDiv.className = 'message';
            return;
        }

        geolocationMessageDiv.textContent = 'Searching for coordinates for the location...';
        geolocationMessageDiv.className = 'message info';

        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;

            const response = await fetch(nominatimUrl, {
                headers: {
                    'User-Agent': NOMINATIM_USER_AGENT
                }
            });

            if (!response.ok) {
                throw new Error(`Error searching for coordinates: ${response.status} - ${await response.text()}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const firstResult = data[0];
                latitudeInput.value = parseFloat(firstResult.lat).toFixed(6);
                longitudeInput.value = parseFloat(firstResult.lon).toFixed(6);
                geolocationMessageDiv.textContent = 'Coordinates found!';
                geolocationMessageDiv.className = 'message success';
            } else {
                latitudeInput.value = '';
                longitudeInput.value = '';
                geolocationMessageDiv.textContent = 'Location not found, please enter coordinates manually.';
                geolocationMessageDiv.className = 'message warning';
            }
        } catch (error) {
            console.error('Error during geocoding:', error);
            geolocationMessageDiv.textContent = `Geocoding error: ${error.message}. Please enter coordinates manually.`;
            geolocationMessageDiv.className = 'message error';
        }
    }

    // Function to create a new bin (useful if it doesn't exist yet)
    async function createNewBin(dataToSave) {
        const createResponse = await fetch('https://api.jsonbin.io/v3/b', { // Endpoint to create a new bin
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_MASTER_KEY,
                'X-Bin-Name': 'laxmap_events_bin', // Name for the new bin
                'private': false // Set to true if you want it to be private
            },
            body: JSON.stringify(dataToSave)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create new bin: ${createResponse.status} - ${errorText}`);
        }

        const newBinData = await createResponse.json();
        console.log('New bin created with ID:', newBinData.metadata.id);
    }

    // --- Event Listeners ---

    // Listener for coordinate lookup when the user leaves the location field
    eventLocationInput.addEventListener('blur', () => {
        getCoordinatesFromLocation(eventLocationInput.value);
    });

    // Listener for form submission
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button and show loading message
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        messageDiv.textContent = 'Adding event...';
        messageDiv.className = 'message info';

        try {
            const eventId = generateUniqueId();
            const eventName = document.getElementById('eventName').value;
            const eventLocation = eventLocationInput.value;
            const eventStartDate = document.getElementById('eventStartDate').value;
            const eventEndDate = document.getElementById('eventEndDate').value;
            const eventDescription = document.getElementById('eventDescription').value;
            const eventLink = document.getElementById('eventLink').value;
            const contactEmail = document.getElementById('contactEmail').value;

            // !!! CAMBIATO: Ottieni i valori dalle custom dropdown usando getCustomDropdownValue
            const eventType = getCustomDropdownValue(customEventTypeDropdown);
            const eventGender = getCustomDropdownValue(customEventGenderDropdown);
            const costType = getCustomDropdownValue(customCostTypeDropdown);
            const eventCurrency = getCustomDropdownValue(customEventCurrencyDropdown);

            const eventCost = eventCostInput.value === '' ? null : parseFloat(eventCostInput.value);

            let latitude = parseFloat(latitudeInput.value);
            let longitude = parseFloat(longitudeInput.value);

            if (isNaN(latitude)) latitude = null;
            if (isNaN(longitude)) longitude = null;

            const newEvent = {
                id: eventId,
                name: eventName,
                startDate: eventStartDate,
                endDate: eventEndDate === '' ? null : eventEndDate,
                location: eventLocation,
                latitude: latitude,
                longitude: longitude,
                type: eventType,
                gender: eventGender,
                description: eventDescription === '' ? null : eventDescription,
                link: eventLink === '' ? null : eventLink,
                featured: false,
                contactEmail: contactEmail === '' ? null : contactEmail,
                cost: eventCost,
                costType: costType,
                currency: eventCurrency
            };

            // Basic validation for dropdowns (since they are required)
            // I valori vuoti dalle custom dropdown saranno stringhe vuote, non null
            if (eventType === '' || eventGender === '') {
                messageDiv.textContent = 'Please select a Game Type and a Gender.';
                messageDiv.className = 'message error';
                submitButton.disabled = false;
                submitButton.textContent = 'Add Event';
                return; // Stop form submission
            }
            // --- Validation for cost, cost type, and currency ---
            if (eventCost !== null) { // If a cost is entered...
                if (costType === 'not_specified' || costType === '') { // '' for default if not 'not_specified'
                    messageDiv.textContent = 'Please specify the Cost Type (e.g., Per Person, Per Team) if you enter a cost.';
                    messageDiv.className = 'message error';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Add Event';
                    return;
                }
                if (eventCurrency === '') { // ... and currency is not selected (empty string from custom dropdown)
                    messageDiv.textContent = 'Please select a Currency if you enter a cost.';
                    messageDiv.className = 'message error';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Add Event';
                    return;
                }
            } else { // If no cost is entered
                // Se costType non è 'not_specified' (o '') e non c'è costo
                if (costType !== 'not_specified' && costType !== '') {
                    messageDiv.textContent = 'You have selected a Cost Type but not entered a Cost. Please enter a cost or set Cost Type to "Not Specified".';
                    messageDiv.className = 'message error';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Add Event';
                    return;
                }
                // Se currency non è vuoto (selezionata) e non c'è costo
                if (eventCurrency !== '') {
                    messageDiv.textContent = 'You have selected a Currency but not entered a Cost. Please enter a cost or set Currency to "Select Currency".';
                    messageDiv.className = 'message error';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Add Event';
                    return;
                }
            }


            const readResponse = await fetch(JSONBIN_EVENTS_WRITE_URL + '/latest', {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });

            if (!readResponse.ok) {
                if (readResponse.status === 404) {
                    await createNewBin([newEvent]);
                    messageDiv.textContent = 'Event added successfully! (New bin created)';
                    messageDiv.className = 'message success';
                } else {
                    throw new Error(`Error reading existing events: ${readResponse.status} - ${await readResponse.text()}`);
                }
            } else {
                const existingData = await readResponse.json();
                let events = existingData.record || [];
                events.push(newEvent);

                const writeResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_MASTER_KEY,
                        'X-Bin-Meta': 'false'
                    },
                    body: JSON.stringify(events)
                });

                if (!writeResponse.ok) {
                    const errorText = await writeResponse.text();
                    throw new Error(`Error adding event: ${writeResponse.status} - ${errorText}`);
                }

                messageDiv.textContent = `Event '${eventName}' added successfully! Remember your Event ID: ${eventId} for future edits.`;
                messageDiv.className = 'message success';
            }

            addEventForm.reset();
            // !!! CORREZIONE: Dopo il reset, ri-inizializza le custom dropdown per mostrare il placeholder
            setupCustomDropdown(customEventTypeDropdown, gameTypesOptions, "Select Game Type");
            setupCustomDropdown(customEventGenderDropdown, gendersOptions, "Select Gender");
            setupCustomDropdown(customCostTypeDropdown, costTypeOptions, "Not Specified");
            setupCustomDropdown(customEventCurrencyDropdown, currencyOptions, "Select Currency");

            geolocationMessageDiv.textContent = '';
            latitudeInput.value = '';
            longitudeInput.value = '';

            logActivity('ADDED_EVENT', newEvent);

        } catch (error) {
            console.error('Error adding event:', error);
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.className = 'message error';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Event';
        }
    });
});