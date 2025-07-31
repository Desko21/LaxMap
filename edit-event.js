// edit-event.js
import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL,
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

    // Riferimenti ai div delle dropdown personalizzate, NON più i select
    const customEditEventTypeDropdown = document.getElementById('customEditEventType');
    const customEditEventGenderDropdown = document.getElementById('customEditEventGender');
    const customCurrencyTypeDropdown = document.getElementById('customCurrencyType');
    const customCostTypeDropdown = document.getElementById('customCostType');

    const editEventStartDateInput = document.getElementById('editEventStartDate');
    const editEventEndDateInput = document.getElementById('editEventEndDate');
    const editEventDescriptionTextarea = document.getElementById('editEventDescription');
    const editEventLinkInput = document.getElementById('editEventLink');
    const editContactEmailInput = document.getElementById('editContactEmail');
    const editEventCostInput = document.getElementById('editEventCost');

    const deleteEventButton = document.getElementById('deleteEventButton');

    const gameTypes = ['All', 'Field', 'Box', 'Sixes', 'Clinic', 'Other']; // 'All' per compatibilità se usato come filtro
    const genders = ['All', 'Men', 'Women', 'Both', 'Mixed', 'Other']; // 'All' per compatibilità
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    const costTypes = ['Not Specified', 'Per Person', 'Per Team'];

    /**
     * Inizializza una dropdown personalizzata.
     * @param {HTMLElement} dropdownElement Il div con classe .custom-dropdown.
     * @param {string[]} optionsArray Un array di stringhe per le opzioni.
     * @param {string} initialValue Il valore iniziale da selezionare (opzionale).
     */
    function setupCustomDropdown(dropdownElement, optionsArray, initialValue = '') {
        const toggleButton = dropdownElement.querySelector('.dropdown-toggle');
        const optionsList = dropdownElement.querySelector('.dropdown-options');

        // Pulisci le opzioni esistenti
        optionsList.innerHTML = '';

        // Popola le opzioni
        optionsArray.forEach(optionText => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.setAttribute('data-value', optionText.toLowerCase().replace(/\s/g, ''));
            li.textContent = optionText;
            optionsList.appendChild(li);

            li.addEventListener('click', () => {
                // Imposta il testo del bottone con il testo dell'opzione cliccata
                toggleButton.textContent = optionText;
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

        // Imposta il valore iniziale del bottone
        let selectedOption = optionsArray.find(opt => opt.toLowerCase().replace(/\s/g, '') === initialValue.toLowerCase().replace(/\s/g, ''));
        if (!selectedOption && optionsArray.length > 0) {
            // Se l'initialValue non corrisponde, prova a usare il primo elemento o un default appropriato
            selectedOption = optionsArray[0];
        }
        if (selectedOption) {
            toggleButton.textContent = selectedOption;
            optionsList.querySelector(`[data-value="${selectedOption.toLowerCase().replace(/\s/g, '')}"]`)?.classList.add('selected');
        } else {
             // Fallback se non ci sono opzioni o un valore iniziale sensato
            toggleButton.textContent = 'Select...';
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

    // Inizializza le dropdown all'avvio della pagina (con valori di default o vuoti)
    setupCustomDropdown(customEditEventTypeDropdown, gameTypes);
    setupCustomDropdown(customEditEventGenderDropdown, genders);
    setupCustomDropdown(customCurrencyTypeDropdown, currencies);
    setupCustomDropdown(customCostTypeDropdown, costTypes);

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

        // Resetta le custom dropdown al valore predefinito o vuoto
        setupCustomDropdown(customEditEventTypeDropdown, gameTypes);
        setupCustomDropdown(customEditEventGenderDropdown, genders);
        setupCustomDropdown(customCurrencyTypeDropdown, currencies);
        setupCustomDropdown(customCostTypeDropdown, costTypes);
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

                // AGGIORNAMENTO: Popola le dropdown personalizzate con i valori dell'evento
                setupCustomDropdown(customEditEventTypeDropdown, gameTypes, event.type);
                setupCustomDropdown(customEditEventGenderDropdown, genders, event.gender);
                setupCustomDropdown(customCurrencyTypeDropdown, currencies, event.currency);
                setupCustomDropdown(customCostTypeDropdown, costTypes, event.costType);
                
                editEventStartDateInput.value = event.startDate || '';
                editEventEndDateInput.value = event.endDate || '';
                editEventDescriptionTextarea.value = event.description || '';
                editEventLinkInput.value = event.link || '';
                editContactEmailInput.value = event.contactEmail || '';
                editEventCostInput.value = event.cost !== undefined ? event.cost : '';

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

        // FUNZIONE DI SUPPORTO: Recupera il valore selezionato da una dropdown personalizzata
        const getCustomDropdownValue = (dropdownElement) => {
            const selectedLi = dropdownElement.querySelector('.dropdown-options li.selected');
            return selectedLi ? selectedLi.dataset.value : '';
        };

        const eventId = eventIdInput.value;
        const updatedEvent = {
            id: eventId, // Assicurati che l'ID sia incluso
            name: editEventNameInput.value.trim(),
            location: editEventLocationInput.value.trim(),
            latitude: parseFloat(editLatitudeInput.value),
            longitude: parseFloat(editLongitudeInput.value),
            // AGGIORNAMENTO: Recupera i valori dalle dropdown personalizzate
            type: getCustomDropdownValue(customEditEventTypeDropdown),
            gender: getCustomDropdownValue(customEditEventGenderDropdown),
            startDate: editEventStartDateInput.value,
            endDate: editEventEndDateInput.value || null, // Se vuota, salva come null
            description: editEventDescriptionTextarea.value.trim(),
            link: editEventLinkInput.value.trim() || null,
            contactEmail: editContactEmailInput.value.trim() || null,
            cost: editEventCostInput.value ? parseFloat(editEventCostInput.value) : null,
            // AGGIORNAMENTO: Recupera i valori dalle dropdown personalizzate
            currency: getCustomDropdownValue(customCurrencyTypeDropdown),
            costType: getCustomDropdownValue(customCostTypeDropdown),
            // Aggiungi qui eventuali altri campi che potresti avere, es. featured: event.featured
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
                // Questo caso non dovrebbe accadere se l'evento è stato trovato con successo
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
            // Puoi scegliere di mantenere il form aperto o resettarlo
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
            // 1. Leggi tutti gli eventi
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

            // 2. Filtra per rimuovere l'evento desiderato
            const updatedEvents = allEvents.filter(event => event.id !== eventIdToDelete);

            if (updatedEvents.length === allEvents.length) {
                // Se la lunghezza è la stessa, significa che l'ID non è stato trovato
                throw new Error("Event not found in the database. Could not delete.");
            }

            // 3. Scrivi il bin aggiornato (senza l'evento eliminato)
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
            resetForm(); // Resetta il form e nascondi dopo l'eliminazione
            searchEventIdInput.value = ''; // Pulisci anche il campo di ricerca ID
        } catch (error) {
            console.error('Error deleting event:', error);
            showMessage(`Error deleting event: ${error.message}`, 'error');
        }
    });
});