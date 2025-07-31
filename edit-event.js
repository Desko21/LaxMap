// edit-event.js
import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL, // Assicurati di avere questa costante in config.js
    NOMINATIM_USER_AGENT
} from './config.js';

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
    // Rimuovi i riferimenti ai vecchi select element
    // const editEventTypeSelect = document.getElementById('editEventType');
    // const editEventGenderSelect = document.getElementById('editEventGender');
    // const currencyTypeSelect = document.getElementById('currencyType');
    // const costTypeSelect = document.getElementById('costType');

    const editEventStartDateInput = document.getElementById('editEventStartDate');
    const editEventEndDateInput = document.getElementById('editEventEndDate');
    const editEventDescriptionTextarea = document.getElementById('editEventDescription');
    const editEventLinkInput = document.getElementById('editEventLink');
    const editContactEmailInput = document.getElementById('editContactEmail');
    const editEventCostInput = document.getElementById('editEventCost'); // Questo è un input normale

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
    let selectedGameType = '';
    let selectedGender = '';
    let selectedCurrency = '';
    let selectedCostType = '';

    // Funzione per inizializzare una dropdown personalizzata (DA INSERIRE QUI)
    function initializeCustomDropdown(dropdownElementId, optionsArray, placeholderText = "Select", selectCallback, initialValue = null) {
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

        toggleButton.textContent = placeholderText;
        optionsList.innerHTML = ''; // Pulisci le opzioni esistenti

        optionsArray.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option.label;
            li.setAttribute('data-value', option.value);
            li.setAttribute('role', 'option');
            li.setAttribute('tabindex', '0');
            optionsList.appendChild(li);

            li.addEventListener('click', (event) => {
                selectOption(option.value, option.label);
                closeDropdown();
                event.stopPropagation();
                toggleButton.focus();
            });

            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectOption(option.value, option.label);
                    closeDropdown();
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
                }
            });
        });

        const selectOption = (value, label) => {
            toggleButton.textContent = label;
            optionsList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            const selectedLi = optionsList.querySelector(`li[data-value="${value}"]`);
            if (selectedLi) selectedLi.classList.add('selected');

            selectCallback(value); // Chiama la callback con il valore selezionato
        };

        const toggleDropdown = (event) => {
            dropdown.classList.toggle('open');
            toggleButton.setAttribute('aria-expanded', dropdown.classList.contains('open'));
            if (dropdown.classList.contains('open')) {
                const firstOption = optionsList.querySelector('li[role="option"]');
                if (firstOption) firstOption.focus();
            } else {
                toggleButton.focus();
            }
            // event.preventDefault(); // IMPORTANTE: impedisce il default del click che potrebbe causare lo scroll
            // event.stopPropagation();
        };

        const closeDropdown = () => {
            dropdown.classList.remove('open');
            toggleButton.setAttribute('aria-expanded', 'false');
        };

        toggleButton.addEventListener('click', toggleDropdown);

        toggleButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                toggleDropdown(e);
            } else if (e.key === 'ArrowDown' && !dropdown.classList.contains('open')) {
                toggleDropdown(e);
            } else if (e.key === 'ArrowUp' && dropdown.classList.contains('open')) {
                e.preventDefault();
            }
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                closeDropdown();
            }
        });

        // Imposta il valore iniziale se fornito
        if (initialValue) {
            const normalizedInitialValue = initialValue.toLowerCase().replace(/\s/g, '');
            const initialOption = optionsArray.find(opt => opt.value === normalizedInitialValue);
            if (initialOption) {
                selectOption(initialOption.value, initialOption.label);
            } else {
                // Se il valore iniziale non corrisponde a nessuna opzione,
                // imposta il placeholder e resetta la variabile selezionata
                selectCallback(''); // O un valore predefinito per indicare "nessuna selezione"
                toggleButton.textContent = placeholderText;
            }
        }
    }

    // NON USARE PIÙ QUESTA FUNZIONE O LE SUE CHIAMATE ALL'INIZIO DEL DOC
    // function populateDropdown(selectElement, options, selectedValue = '') {
    //     selectElement.innerHTML = '';
    //     const normalizedSelectedValue = (selectedValue || '').toLowerCase().replace(/\s/g, '');
    //     options.forEach(optionText => {
    //         const option = document.createElement('option');
    //         option.value = optionText.toLowerCase().replace(/\s/g, '');
    //         option.textContent = optionText;
    //         if (option.value === normalizedSelectedValue) {
    //             option.selected = true;
    //         }
    //         selectElement.appendChild(option);
    //     });
    // }

    // Rimuovi queste chiamate iniziali a populateDropdown (sono state la causa dell'errore)
    // populateDropdown(editEventTypeSelect, gameTypes);
    // populateDropdown(editEventGenderSelect, genders);
    // populateDropdown(currencyTypeSelect, currencies);
    // populateDropdown(costTypeSelect, costTypes);


    // Funzione per mostrare messaggi
    function showMessage(msg, type = 'info') {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        // setTimeout(() => messageDiv.textContent = '', 5000); // Rimuove il messaggio dopo 5 secondi
    }

    // Funzione per resettare il form e nascondere la sezione di modifica
    function resetForm() {
        editEventForm.reset();
        eventEditFormContainer.style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.className = 'message';
        geolocationMessageDiv.textContent = '';
        geolocationMessageDiv.className = 'message';

        // Resetta i valori delle custom dropdown al placeholder
        initializeCustomDropdown('customEventType', gameTypes, 'Select Game Type', value => selectedGameType = value);
        initializeCustomDropdown('customEventGender', genders, 'Select Gender', value => selectedGender = value);
        initializeCustomDropdown('customEventCurrency', currencies, 'Select Currency', value => selectedCurrency = value);
        initializeCustomDropdown('customCostType', costTypes, 'Not Specified', value => selectedCostType = value);
    }


    searchButton.addEventListener('click', async () => {
        const eventId = searchEventIdInput.value.trim();
        if (!eventId) {
            showMessage('Please enter an Event ID.', 'error');
            return;
        }

        showMessage('Searching for event...', 'info');
        eventEditFormContainer.style.display = 'none'; // Nasconde il form mentre cerchiamo

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
            const events = Array.isArray(data.record) ? data.record : [];
            const event = events.find(e => e.id === eventId);

            if (event) {
                // Popola il form con i dati dell'evento
                eventIdInput.value = event.id;
                editEventNameInput.value = event.name || '';
                editEventLocationInput.value = event.location || '';
                editLatitudeInput.value = event.latitude || '';
                editLongitudeInput.value = event.longitude || '';

                // Utilizza initializeCustomDropdown per popolare e impostare il valore
                // Il valore iniziale viene passato come ultimo parametro
                initializeCustomDropdown('customEventType', gameTypes, 'Select Game Type', value => selectedGameType = value, event.type);
                initializeCustomDropdown('customEventGender', genders, 'Select Gender', value => selectedGender = value, event.gender);
                initializeCustomDropdown('customEventCurrency', currencies, 'Select Currency', value => selectedCurrency = value, event.cost?.currency);
                initializeCustomDropdown('customCostType', costTypes, 'Not Specified', value => selectedCostType = value, event.cost?.type);


                editEventStartDateInput.value = event.startDate || '';
                editEventEndDateInput.value = event.endDate || '';
                editEventDescriptionTextarea.value = event.description || '';
                editEventLinkInput.value = event.link || '';
                editContactEmailInput.value = event.contactEmail || '';
                editEventCostInput.value = event.cost !== undefined && event.cost !== null ? event.cost : '';


                eventEditFormContainer.style.display = 'block';
                showMessage('Event found. You can now edit its details.', 'success');
            } else {
                showMessage('Event not found. Please check the ID.', 'error');
                resetForm();
            }

        } catch (error) {
            console.error('Error fetching event:', error);
            showMessage('Error searching for event. Please try again later.', 'error');
            resetForm();
        }
    });

    editEventLocationInput.addEventListener('blur', async () => {
        const location = editEventLocationInput.value.trim();
        if (!location) {
            editLatitudeInput.value = '';
            editLongitudeInput.value = '';
            geolocationMessageDiv.textContent = 'Location field is empty.';
            geolocationMessageDiv.className = 'message info';
            return;
        }

        geolocationMessageDiv.textContent = 'Searching for coordinates...';
        geolocationMessageDiv.className = 'message info';

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
                headers: {
                    'User-Agent': NOMINATIM_USER_AGENT
                }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                editLatitudeInput.value = parseFloat(data[0].lat).toFixed(6);
                editLongitudeInput.value = parseFloat(data[0].lon).toFixed(6);
                geolocationMessageDiv.textContent = 'Coordinates found.';
                geolocationMessageDiv.className = 'message success';
            } else {
                editLatitudeInput.value = '';
                editLongitudeInput.value = '';
                geolocationMessageDiv.textContent = 'Location not found. Please enter manually or try a different search term.';
                geolocationMessageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Error fetching geolocation:', error);
            geolocationMessageDiv.textContent = 'Error fetching coordinates.';
            geolocationMessageDiv.className = 'message error';
        }
    });

    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        showMessage('Saving changes...', 'info');

        const eventId = eventIdInput.value;
        const updatedEvent = {
            id: eventId, // Assicurati che l'ID sia incluso
            name: editEventNameInput.value.trim(),
            location: editEventLocationInput.value.trim(),
            latitude: parseFloat(editLatitudeInput.value),
            longitude: parseFloat(editLongitudeInput.value),
            // Usa le variabili globali aggiornate dalle custom dropdown
            type: selectedGameType,
            gender: selectedGender,
            startDate: editEventStartDateInput.value,
            endDate: editEventEndDateInput.value || null,
            description: editEventDescriptionTextarea.value.trim(),
            link: editEventLinkInput.value.trim() || null,
            contactEmail: editContactEmailInput.value.trim() || null,
            cost: editEventCostInput.value ? parseFloat(editEventCostInput.value) : null,
            // Usa le variabili globali aggiornate dalle custom dropdown
            currency: selectedCurrency,
            costType: selectedCostType,
        };

        // Recupera tutti gli eventi, aggiorna quello specifico e riscrivi l'intero bin
        try {
            const response = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });
            const data = await response.json();
            let allEvents = Array.isArray(data.record) ? data.record : [];

            const eventIndex = allEvents.findIndex(e => e.id === eventId);
            if (eventIndex !== -1) {
                // Mantieni eventuali proprietà esistenti non modificate dal form (es. featured)
                allEvents[eventIndex] = { ...allEvents[eventIndex], ...updatedEvent };
            } else {
                throw new Error("Event not found in current bin data during update.");
            }

            const updateResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(allEvents)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`HTTP error! status: ${updateResponse.status}, message: ${errorText}`);
            }

            showMessage('Event updated successfully!', 'success');
            // resetForm(); // Se preferisci resettare dopo il salvataggio
        } catch (error) {
            console.error('Error updating event:', error);
            showMessage(`Error updating event: ${error.message}`, 'error');
        }
    });

    // NUOVO: Listener per il bottone di eliminazione
    deleteEventButton.addEventListener('click', async () => {
        const eventIdToDelete = eventIdInput.value.trim();

        if (!eventIdToDelete) {
            showMessage('No event ID found to delete.', 'error');
            return;
        }

        const confirmDelete = confirm(`Are you sure you want to delete event with ID: ${eventIdToDelete}? This action cannot be undone.`);

        if (!confirmDelete) {
            showMessage('Event deletion cancelled.', 'info');
            return;
        }

        showMessage('Deleting event...', 'info');

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
            let allEvents = Array.isArray(data.record) ? data.record : [];

            const updatedEvents = allEvents.filter(event => event.id !== eventIdToDelete);

            if (updatedEvents.length === allEvents.length) {
                throw new Error("Event not found in the database. Could not delete.");
            }

            const updateResponse = await fetch(JSONBIN_EVENTS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(updatedEvents)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`HTTP error! status: ${updateResponse.status}, message: ${errorText}`);
            }

            showMessage('Event deleted successfully!', 'success');
            resetForm();
            searchEventIdInput.value = '';
        } catch (error) {
            console.error('Error deleting event:', error);
            showMessage(`Error deleting event: ${error.message}`, 'error');
        }
    });

    // Inizializza le custom dropdown all'avvio (con placeholder)
    // Non le popoliamo con valori da eventData qui perché eventData è disponibile solo dopo la ricerca
    // Le inizializziamo con i loro placeholder iniziali.
    initializeCustomDropdown('customEventType', gameTypes, 'Select Game Type', value => selectedGameType = value);
    initializeCustomDropdown('customEventGender', genders, 'Select Gender', value => selectedGender = value);
    initializeCustomDropdown('customEventCurrency', currencies, 'Select Currency', value => selectedCurrency = value);
    initializeCustomDropdown('customCostType', costTypes, 'Not Specified', value => selectedCostType = value);

}); // Fine DOMContentLoaded