// delete-event.js

// Importa le costanti dal file di configurazione
import {
    JSONBIN_MASTER_KEY,
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_EVENTS_WRITE_URL,
    JSONBIN_LOGS_READ_URL,
    JSONBIN_LOGS_WRITE_URL
} from './config.js';

// Attendi che il DOM sia completamente caricato prima di eseguire lo script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('delete-event.js loaded.');

    // Riferimenti agli elementi HTML
    const eventsTableBody = document.getElementById('eventsTableBody');
    const messageDiv = document.getElementById('message');

    // --- Funzioni Utility ---

    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    const hideMessage = () => {
        messageDiv.style.display = 'none';
    };

    // --- FUNZIONE CENTRALIZZATA PER LOGGARE LE ATTIVITÀ ---
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
            event: {
                id: mainEventData.id,
                name: mainEventData.name,
                location: mainEventData.location
            }
        };

        if (action === 'DELETED_EVENT') {
            logEntry.deletedAt = new Date().toISOString();
        } else if (action === 'FEATURED_ADDED' || action === 'FEATURED_REMOVED') {
            logEntry.oldFeaturedStatus = changeDetails.oldStatus;
            logEntry.newFeaturedStatus = changeDetails.newStatus;
            logEntry.changedAt = new Date().toISOString();
        }

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

    // --- Funzione per aggiornare lo stato "featured" ---
    async function toggleFeaturedStatus(eventId, newFeaturedStatus) {
        console.log('toggleFeaturedStatus chiamata.');
        console.log('  ID Evento da trovare:', eventId);
        console.log('  Nuovo stato featured:', newFeaturedStatus);

        try {
            const response = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });

            if (!response.ok) {
                throw new Error(`Errore nella lettura degli eventi per l'aggiornamento dello stato featured: ${response.status} - ${await response.text()}`);
            }

            const data = await response.json();
            let events = Array.isArray(data.record) ? data.record : [];

            console.log('  Totale eventi caricati da JSONBin.io:', events.length);

            const eventIndex = events.findIndex(event => event.id === eventId);

            if (eventIndex === -1) {
                console.error(`  ERRORE: Evento con ID "${eventId}" non trovato nei dati caricati.`);
                throw new Error('Evento non trovato per l\'aggiornamento dello stato featured.');
            }

            const oldFeaturedStatus = events[eventIndex].isFeatured;
            events[eventIndex].isFeatured = newFeaturedStatus;

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
                throw new Error(`Errore nel salvataggio dello stato featured nel bin: ${writeResponse.status} - ${await writeResponse.text()}`);
            }

            console.log(`Stato 'featured' per l'evento ${eventId} aggiornato a ${newFeaturedStatus}.`);

            const actionType = newFeaturedStatus ? 'FEATURED_ADDED' : 'FEATURED_REMOVED';
            await logActivity(actionType, {
                id: eventId,
                name: events[eventIndex].name || 'N/A',
                location: events[eventIndex].location || 'N/A'
            }, {
                oldStatus: oldFeaturedStatus,
                newStatus: newFeaturedStatus
            });

            return true;
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dello stato featured:', error);
            showMessage(`Errore nell'aggiornamento dello stato featured: ${error.message}`, 'error');
            throw error;
        }
    }

    // --- Funzione per eliminare un evento ---
    async function handleDeleteEvent(eventId, eventName, eventLocation) {
        if (!confirm(`Sei sicuro di voler eliminare l'evento "${eventName}" (ID: ${eventId})?`)) {
            return;
        }

        hideMessage();
        showMessage(`Eliminazione di "${eventName}"...`, 'info');

        try {
            const readResponse = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });

            if (!readResponse.ok) {
                throw new Error(`Errore nella lettura degli eventi per l'eliminazione: ${readResponse.status} - ${await readResponse.text()}`);
            }

            const data = await readResponse.json();
            let events = Array.isArray(data.record) ? data.record : [];

            const initialLength = events.length;
            const eventToDelete = events.find(event => event.id === eventId);
            events = events.filter(event => event.id !== eventId);

            if (events.length === initialLength) {
                throw new Error('Evento non trovato per l\'eliminazione.');
            }

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
                throw new Error(`Errore nell'eliminazione dell'evento dal bin: ${writeResponse.status} - ${await writeResponse.text()}`);
            }

            console.log(`Evento ${eventId} eliminato con successo.`);
            showMessage(`Evento "${eventName}" eliminato con successo!`, 'success');

            if (eventToDelete) {
                await logActivity('DELETED_EVENT', {
                    id: eventToDelete.id,
                    name: eventToDelete.name || 'N/A',
                    location: eventToDelete.location || 'N/A'
                });
            } else {
                await logActivity('DELETED_EVENT', {
                    id: eventId,
                    name: eventName || 'N/A',
                    location: eventLocation || 'N/A'
                });
            }

            fetchAndDisplayEvents();

        } catch (error) {
            console.error('Errore durante l\'eliminazione dell\'evento:', error);
            showMessage(`Errore: ${error.message}`, 'error');
        }
    }

    // --- Funzione per caricare e visualizzare gli eventi nella tabella ---
    const fetchAndDisplayEvents = async () => {
        hideMessage();
        eventsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Caricamento eventi...</td></tr>';

        try {
            const response = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    showMessage('Nessun evento trovato. Il database degli eventi potrebbe essere vuoto o non ancora creato.', 'info');
                    eventsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Nessun evento disponibile.</td></tr>';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const events = Array.isArray(data.record) ? data.record : [];

            if (events.length === 0) {
                showMessage('Nessun evento disponibile per l\'eliminazione.', 'info');
                eventsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Nessun evento disponibile.</td></tr>';
                return;
            }

            events.sort((a, b) => {
                const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            eventsTableBody.innerHTML = '';
            events.forEach(event => {
                const row = eventsTableBody.insertRow();
                row.setAttribute('data-event-id', event.id);

                const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString('it-IT') : 'N/A';
                const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString('it-IT') : '';
                const dateDisplay = event.endDate ? `${startDate} - ${endDate}` : startDate;

                // Cella per l'ID dell'Evento
                row.insertCell(0).textContent = event.id || 'N/A';
                
                // Altre celle con indici aggiornati
                row.insertCell(1).textContent = event.name || 'N/A';
                row.insertCell(2).textContent = dateDisplay;
                row.insertCell(3).textContent = event.location || 'N/A';
                row.insertCell(4).textContent = event.type || 'N/A';
                row.insertCell(5).textContent = event.gender || 'N/A';

                // Cella per lo stato "Featured" (Checkbox senza testo)
                const featuredCell = row.insertCell(6);
                const featuredCheckbox = document.createElement('input');
                featuredCheckbox.type = 'checkbox';
                featuredCheckbox.className = 'feature-toggle larger-checkbox'; // Aggiunta classe per stile
                featuredCheckbox.dataset.eventId = event.id;
                featuredCheckbox.checked = event.isFeatured || false; // Pre-valorizza la spunta

                featuredCheckbox.addEventListener('change', async (e) => {
                    const eventId = e.target.dataset.eventId;
                    const newFeaturedStatus = e.target.checked;
                    console.log(`Checkbox cliccata per ID: ${eventId}, Nuovo stato: ${newFeaturedStatus}`);
                    try {
                        await toggleFeaturedStatus(eventId, newFeaturedStatus);
                        showMessage(`Stato 'featured' per '${event.name}' aggiornato a ${newFeaturedStatus ? 'true' : 'false'}!`, 'success');
                    } catch (error) {
                        e.target.checked = !newFeaturedStatus;
                    }
                });
                featuredCell.appendChild(featuredCheckbox);

                // Cella per il pulsante "Delete" (solo icona)
                const deleteCell = row.insertCell(7);
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-btn');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>'; // Solo icona
                deleteButton.title = `Elimina ${event.name}`; // Aggiungi un tooltip per accessibilità
                deleteButton.addEventListener('click', () => handleDeleteEvent(event.id, event.name, event.location));
                deleteCell.appendChild(deleteButton);
            });
        } catch (error) {
            console.error('Errore nel caricamento degli eventi:', error);
            showMessage(`Errore nel caricamento degli eventi: ${error.message}`, 'error');
            eventsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Errore nel caricamento degli eventi.</td></tr>';
        }
    };

    // Carica gli eventi all'avvio della pagina
    fetchAndDisplayEvents();
});