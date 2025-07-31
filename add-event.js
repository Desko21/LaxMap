import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL,
    NOMINATIM_USER_AGENT
} from './config.js'; // Assicurati che config.js sia nel percorso corretto

document.addEventListener('DOMContentLoaded', async () => {
    console.log('add-event.js loaded.');

    const addEventForm = document.getElementById('addEventForm');
    const messageDiv = document.getElementById('message');
    const geolocationMessageDiv = document.getElementById('geolocationMessage');

    // Campi del form
    const eventNameInput = document.getElementById('eventName');
    const eventLocationInput = document.getElementById('eventLocation');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const eventStartDateInput = document.getElementById('eventStartDate');
    const eventEndDateInput = document.getElementById('eventEndDate');
    const eventDescriptionTextarea = document.getElementById('eventDescription');
    const eventLinkInput = document.getElementById('eventLink');
    const contactEmailInput = document.getElementById('contactEmail');
    const eventCostInput = document.getElementById('eventCost');

    // Dati per le dropdown
    const gameTypes = [
        { value: '', label: 'Select Event Type' }, // Aggiunto placeholder
        { value: 'field', label: 'Field' },
        { value: 'box', label: 'Box' },
        { value: 'sixes', label: 'Sixes' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'other', label: 'Other' }
    ];
    const genders = [
        { value: '', label: 'Select Gender' }, // Aggiunto placeholder
        { value: 'men', label: 'Men' },
        { value: 'women', label: 'Women' },
        { value: 'both', label: 'Both' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'other', label: 'Other' }
    ];
    const currencies = [
        { value: '', label: 'Select Currency' }, // Aggiunto placeholder
        { value: 'usd', label: 'USD' },
        { value: 'eur', label: 'EUR' },
        { value: 'gbp', label: 'GBP' },
        { value: 'jpy', label: 'JPY' },
        { value: 'cad', label: 'CAD' },
        { value: 'aud', label: 'AUD' },
        { value: 'chf', label: 'CHF' },
        { value: 'cny', label: 'CNY' },
        { value: 'inr', label: 'INR' },
        { value: 'brl', label: 'BRL' }
    ];
    const costTypes = [
        { value: '', label: 'Not Specified' }, // Aggiunto placeholder
        { value: 'per-person', label: 'Per Person' },
        { value: 'per-team', label: 'Per Team' }
    ];

    // Variabili per memorizzare i valori selezionati dalle custom dropdown
    let selectedGameType = '';
    let selectedGender = '';
    let selectedCurrency = '';
    let selectedCostType = '';

    // --- FUNZIONE PER INIZIALIZZARE LE CUSTOM DROPDOWN (copiata da edit-event.js) ---
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

        // Funzione interna per selezionare un'opzione
        const selectOption = (value) => {
            // Aggiorna il testo del pulsante
            const selectedOption = optionsArray.find(opt => opt.value === value);
            toggleButton.textContent = selectedOption ? selectedOption.label : placeholderText;

            // Rimuovi la classe 'selected' da tutte le opzioni e aggiungila a quella corrente
            optionsList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            const selectedLi = optionsList.querySelector(`li[data-value="${value}"]`);
            if (selectedLi) {
                selectedLi.classList.add('selected');
            }

            // Imposta il valore nella variabile esterna corrispondente
            if (dropdownElementId === 'customEventType') selectedGameType = value;
            else if (dropdownElementId === 'customGenderType') selectedGender = value;
            else if (dropdownElementId === 'customCurrencyType') selectedCurrency = value;
            else if (dropdownElementId === 'customCostType') selectedCostType = value;

            console.log(`Dropdown '${dropdownElementId}' selected: ${value}`);
        };

        // Popola la lista delle opzioni
        optionsArray.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option.label;
            li.setAttribute('data-value', option.value);
            li.setAttribute('role', 'option');
            li.setAttribute('tabindex', '0'); // Rendi l'elemento focusabile per l'accessibilità
            optionsList.appendChild(li);

            li.addEventListener('click', (event) => {
                selectOption(option.value);
                closeDropdown(dropdown); // Chiudi solo QUESTA dropdown
                event.stopPropagation(); // Evita che il click si propaghi
                toggleButton.focus(); // Riporta il focus sul pulsante dopo la selezione
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

        // Inizializza il valore se fornito
        if (initialValue !== null) { // Controlla anche per stringa vuota
            selectOption(initialValue);
        } else {
            selectOption(optionsArray[0].value); // Seleziona il primo elemento (placeholder)
        }

        // Event listener per il pulsante toggle
        toggleButton.addEventListener('click', (event) => {
            // Chiudi tutte le altre dropdown aperte
            document.querySelectorAll('.custom-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('open');
                }
            });
            dropdown.classList.toggle('open');
            event.stopPropagation(); // Impedisce la propagazione per evitare la chiusura immediata da document click
        });

        // Aggiungiamo un metodo setValue al div della dropdown per impostare il valore dall'esterno
        dropdown.setValue = (value) => {
            selectOption(value);
        };
    }

    // --- Funzione per chiudere una specifica dropdown o tutte ---
    function closeDropdown(specificDropdown = null) {
        if (specificDropdown) {
            specificDropdown.classList.remove('open');
        } else {
            document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    }

    // --- Listener globale per chiudere le dropdown cliccando fuori ---
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.custom-dropdown')) {
            closeDropdown(); // Chiude tutte le dropdown se il click non è su una dropdown
        }
    });

    // --- Inizializzazione delle dropdown custom all'avvio ---
    initializeCustomDropdown('customEventType', gameTypes, 'Select Event Type');
    initializeCustomDropdown('customGenderType', genders, 'Select Gender');
    initializeCustomDropdown('customCurrencyType', currencies, 'Select Currency');
    initializeCustomDropdown('customCostType', costTypes, 'Not Specified'); // Placeholder specifico

    // Funzione per mostrare messaggi
    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    // Funzione per nascondere messaggi
    const hideMessage = () => {
        messageDiv.style.display = 'none';
    };

    // Funzione per generare un ID unico
    const generateUniqueId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Geocodifica della località
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

    // Gestione dell'invio del form
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impedisce il comportamento predefinito di submit del form

        hideMessage();

        // Validazione minima
        if (!eventNameInput.value || !eventLocationInput.value || !eventStartDateInput.value ||
            !selectedGameType || !selectedGender) {
            showMessage('Please fill in all required fields (Event Name, Location, Start Date, Game Type, Gender).', 'error');
            return;
        }

        const newEvent = {
            id: generateUniqueId(),
            name: eventNameInput.value,
            location: eventLocationInput.value,
            latitude: parseFloat(latitudeInput.value) || null,
            longitude: parseFloat(longitudeInput.value) || null,
            type: selectedGameType, // Usa il valore della custom dropdown
            gender: selectedGender, // Usa il valore della custom dropdown
            startDate: eventStartDateInput.value,
            endDate: eventEndDateInput.value || null,
            description: eventDescriptionTextarea.value || null,
            link: eventLinkInput.value || null,
            contactEmail: contactEmailInput.value || null,
            cost: parseFloat(eventCostInput.value) || null,
            currency: selectedCurrency || null, // Usa il valore della custom dropdown
            costType: selectedCostType || null, // Usa il valore della custom dropdown
            isFeatured: false, // Default a false per i nuovi eventi
            createdAt: new Date().toISOString() // Timestamp di creazione
        };

        try {
            // 1. Recupera tutti gli eventi esistenti
            const readResponse = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });

            if (!readResponse.ok) {
                throw new Error(`HTTP error! status: ${readResponse.status}`);
            }

            const data = await readResponse.json();
            const events = data.record || [];

            // 2. Aggiungi il nuovo evento all'array
            events.push(newEvent);

            // 3. Invia l'intero array aggiornato a JSONBin
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
            console.log('Event added successfully:', result);
            showMessage('Event added successfully! ID: ' + newEvent.id, 'success');

            // Resetta il form
            addEventForm.reset();
            // Resetta i valori delle custom dropdown ai placeholder iniziali
            document.getElementById('customEventType').setValue('');
            document.getElementById('customGenderType').setValue('');
            document.getElementById('customCurrencyType').setValue('');
            document.getElementById('customCostType').setValue('');

        } catch (error) {
            console.error('Error adding event:', error);
            showMessage('Error adding event. Please try again.', 'error');
        }
    });
});