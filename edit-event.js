import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL,
    NOMINATIM_USER_AGENT
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
    const editEventLinkInput = document.getElementById('editEventLink');
    const editContactEmailInput = document.getElementById('editContactEmail');
    const editEventCostInput = document.getElementById('editEventCost');

    // NUOVO: Bottone per eliminare l'evento
    const deleteEventButton = document.getElementById('deleteEventButton');

    // Dati per le dropdown
    const gameTypes = [
        { value: 'field', label: 'Field' },
        { value: 'box', label: 'Box' },
        { value: 'sixes', label: 'Sixes' },
        { value: 'clinic', label: 'Clinic' },
        { value: 'other', label: 'Other' }
    ];
    const genders = [
        { value: 'men', label: 'Men' },
        { value: 'women', label: 'Women' },
        { value: 'both', label: 'Both' },
        { value: 'mixed', label: 'Mixed' },
        { value: 'other', label: 'Other' }
    ];
    const currencies = [
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
        { value: 'not-specified', label: 'Not Specified' },
        { value: 'per-person', label: 'Per Person' },
        { value: 'per-team', label: 'Per Team' }
    ];

    // Variabili per memorizzare i valori selezionati dalle custom dropdown
    // Inizializzale con un valore di default o vuoto
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
                event.stopPropagation(); // Evita che il click si propaghi e chiuda altre dropdown
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
                } else if (e.key === 'Escape') { // Aggiunto per chiudere con ESC
                    closeDropdown(dropdown);
                    toggleButton.focus();
                    e.preventDefault();
                }
            });
        });

        // Inizializza il valore se fornito
        if (initialValue) {
            selectOption(initialValue);
        } else {
            toggleButton.textContent = placeholderText; // Imposta il placeholder se non c'è valore iniziale
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

        // Restituisci la funzione per impostare il valore dall'esterno
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
    // Passiamo null come initialValue per ora, verrà impostato dopo il fetch dell'evento
    initializeCustomDropdown('customEventType', gameTypes, 'Select Event Type');
    initializeCustomDropdown('customGenderType', genders, 'Select Gender');
    initializeCustomDropdown('customCurrencyType', currencies, 'Select Currency');
    initializeCustomDropdown('customCostType', costTypes, 'Select Cost Type');

    // Assegna le funzioni setValue alle variabili globali per comodità (opzionale, ma utile)
    // Queste variabili ora contengono la funzione setValue per ogni dropdown
    const setEventType = document.getElementById('customEventType').setValue;
    const setGenderType = document.getElementById('customGenderType').setValue;
    const setCurrencyType = document.getElementById('customCurrencyType').setValue;
    const setCostType = document.getElementById('customCostType').setValue;

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

    // Funzione per recuperare i dati dell'evento
    searchButton.addEventListener('click', async () => {
        const eventId = searchEventIdInput.value.trim();
        if (!eventId) {
            showMessage('Please enter an Event ID.', 'error');
            return;
        }

        hideMessage();
        eventEditFormContainer.style.display = 'none'; // Nascondi il form durante la ricerca

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
                // Popola i campi del form
                eventIdInput.value = eventToEdit.id;
                editEventNameInput.value = eventToEdit.name;
                editEventLocationInput.value = eventToEdit.location;
                editLatitudeInput.value = eventToEdit.latitude || '';
                editLongitudeInput.value = eventToEdit.longitude || '';

                // Imposta i valori delle custom dropdown usando le funzioni setValue
                setEventType(eventToEdit.type);
                setGenderType(eventToEdit.gender);
                setCurrencyType(eventToEdit.currency);
                setCostType(eventToEdit.costType);

                editEventStartDateInput.value = eventToEdit.startDate;
                editEventEndDateInput.value = eventToEdit.endDate;
                editEventDescriptionTextarea.value = eventToEdit.description;
                editEventLinkInput.value = eventToEdit.link;
                editContactEmailInput.value = eventToEdit.contactEmail;
                editEventCostInput.value = eventToEdit.cost;

                eventEditFormContainer.style.display = 'block'; // Mostra il form
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

    // Funzione per geocodificare la località
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
                } else {
                    editLatitudeInput.value = '';
                    editLongitudeInput.value = '';
                    geolocationMessageDiv.textContent = 'Location not found. Please enter coordinates manually or refine location name.';
                    geolocationMessageDiv.style.color = 'orange';
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
        }
    });

    // Gestione dell'invio del form di modifica
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = eventIdInput.value;
        const newEventData = {
            id: eventId,
            name: editEventNameInput.value,
            location: editEventLocationInput.value,
            latitude: parseFloat(editLatitudeInput.value) || null,
            longitude: parseFloat(editLongitudeInput.value) || null,
            // Usa i valori dalle variabili globali aggiornate dalle custom dropdown
            type: selectedGameType,
            gender: selectedGender,
            currency: selectedCurrency,
            costType: selectedCostType,
            startDate: editEventStartDateInput.value,
            endDate: editEventEndDateInput.value,
            description: editEventDescriptionTextarea.value,
            link: editEventLinkInput.value,
            contactEmail: editContactEmailInput.value,
            cost: parseFloat(editEventCostInput.value) || null,
            isFeatured: false // Mantiene lo stato originale o lo imposta come default se non gestito
        };

        try {
            // Recupera tutti gli eventi esistenti
            const readResponse = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });
            if (!readResponse.ok) {
                throw new Error(`HTTP error! status: ${readResponse.status}`);
            }
            const existingData = await readResponse.json();
            let events = existingData.record || [];

            // Trova e aggiorna l'evento
            const eventIndex = events.findIndex(event => event.id === eventId);
            if (eventIndex !== -1) {
                // Mantieni lo stato isFeatured esistente se non lo modifichi
                newEventData.isFeatured = events[eventIndex].isFeatured;
                events[eventIndex] = newEventData;
            } else {
                showMessage('Error: Event not found for update.', 'error');
                return;
            }

            // Invia l'intero array aggiornato a JSONBin
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
                return; // L'utente ha annullato
            }

            hideMessage();

            try {
                // 1. Recupera tutti gli eventi
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

                // 2. Filtra l'evento da eliminare
                const initialLength = events.length;
                events = events.filter(event => event.id !== eventIdToDelete);

                if (events.length === initialLength) {
                    showMessage('Event not found for deletion.', 'error');
                    return;
                }

                // 3. Invia l'array aggiornato (senza l'evento eliminato) a JSONBin
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

                // Resetta il form e nascondilo
                editEventForm.reset();
                eventEditFormContainer.style.display = 'none';

                // Resetta le dropdown custom al loro stato iniziale
                document.getElementById('customEventType').setValue('');
                document.getElementById('customGenderType').setValue('');
                document.getElementById('customCurrencyType').setValue('');
                document.getElementById('customCostType').setValue('');

            } catch (error) {
                console.error('Error deleting event:', error);
                showMessage('Error deleting event. Please try again.', 'error');
            }
        });
    }
});