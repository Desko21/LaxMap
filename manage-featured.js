// manage-featured.js

import {
    JSONBIN_MASTER_KEY,
    // Note: JSONBIN_READ_URL and JSONBIN_UPDATE_URL are defined locally
    // If you prefer, you can also import them from config.js
    JSONBIN_EVENTS_READ_URL,
    JSONBIN_LOGS_WRITE_URL // Make sure this is imported from config.js
} from './config.js'; // Ensure JSONBIN_LOGS_WRITE_URL is in config.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('manage-featured.js loaded.');

    // CONFIGURAZIONE PAYPAL
    const PAYPAL_BUSINESS_EMAIL_OR_ID = 'jakkolo@gmail.com'; 
    const PAYPAL_ITEM_NAME = 'Promozione Evento Featured LaxMap';
    const PAYPAL_AMOUNT = '1.00'; 
    const PAYPAL_CURRENCY_CODE = 'EUR'; 
    const PAYPAL_RETURN_URL = 'https://laxmap.app/thank-you.html'; 
    const PAYPAL_CANCEL_URL = 'https://laxmap.app/donate.html'; 

    const eventListDiv = document.getElementById('event-list-for-featured-management');
    const messageDiv = document.getElementById('message');

    let allEvents = []; 

    // --- Log Activity Function ---
    async function logActivity(action, eventDetails) {
        const timestamp = new Date().toISOString();
        let userIp = 'N/A';

        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                userIp = ipData.ip || 'N/A';
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
                existingLogs = Array.isArray(logData.record) ? logData.record : [];
            }

            existingLogs.push(logEntry);

            await fetch(JSONBIN_LOGS_WRITE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_MASTER_KEY,
                    'X-Bin-Meta': 'false'
                },
                body: JSON.stringify(existingLogs)
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    async function loadEventsForFeaturedManagement() {
        try {
            const response = await fetch(JSONBIN_EVENTS_READ_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY
                }
            });

            if (!response.ok) {
                eventListDiv.innerHTML = '<p class="error">Error loading events.</p>';
                return;
            }

            const data = await response.json();
            const fetchedEvents = data.record || [];

            // --- FILTRO DINAMICO DATA CORRENTE ---
            // Prende la data di questo istante
            const now = new Date();
            // Opzionale: azzeriamo l'ora per includere gli eventi che scadono oggi
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            allEvents = fetchedEvents.filter(event => {
                // Se l'evento non ha startDate, lo escludiamo per sicurezza
                if (!event.startDate) return false;

                // Usiamo endDate se disponibile, altrimenti startDate
                const eventDateToCheck = new Date(event.endDate || event.startDate);
                
                // Ritorna vero solo se la data dell'evento è oggi o nel futuro
                return eventDateToCheck >= todayStart;
            });
            // --- FINE FILTRO ---

            console.log('Filtered events (upcoming only):', allEvents);
            displayEventsForFeaturedManagement(allEvents);

        } catch (error) {
            console.error('An unexpected error occurred:', error);
            eventListDiv.innerHTML = '<p class="error">An unexpected error occurred. Please try again.</p>';
        }
    }

    function displayEventsForFeaturedManagement(events) {
        eventListDiv.innerHTML = ''; 

        if (events.length === 0) {
            eventListDiv.innerHTML = '<p>No upcoming events available for promotion.</p>';
            return;
        }

        // Sort: i più recenti creati in alto
        events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'tournament-item';

            let actionButtonHtml = '';
            let sixesIconHtml = (event.format && event.format.toLowerCase() === 'sixes') 
                ? '<span class="sixes-icon">6</span>' 
                : '';

            if (!event.isFeatured) {
                actionButtonHtml = `
                    <button class="feature-button" data-id="${event.createdAt}" data-event-name="${event.name}" data-event-location="${event.location}">
                        Make Featured (1€) <span class="star-icon">★</span>
                    </button>
                `;
            } else {
                actionButtonHtml = `<p style="color: green; font-weight: bold; margin-top: 10px;">This event is already Featured.</p>`;
            }

            eventItem.innerHTML = `
                <h3>${event.name}</h3>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                <p>${event.description ? event.description.substring(0, 100) + '...' : ''}</p>
                <div class="event-actions">
                    ${actionButtonHtml}
                    ${sixesIconHtml}
                </div>
            `;
            eventListDiv.appendChild(eventItem);
        });

        document.querySelectorAll('.feature-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const eventId = btn.dataset.id;
                const eventName = btn.dataset.eventName;
                initiatePayPalPayment(eventId, eventName);
            });
        });
    }

    function initiatePayPalPayment(eventId, eventName) {
        const selectedEvent = allEvents.find(event => event.createdAt === eventId);
        if (selectedEvent) {
            logActivity('INITIATE_PAYPAL_PAYMENT', {
                id: selectedEvent.id,
                name: selectedEvent.name,
                location: selectedEvent.location
            });
        }

        const confirmation = confirm(`You are about to pay ${PAYPAL_AMOUNT} ${PAYPAL_CURRENCY_CODE} to make "${eventName}" a featured event. Continue to PayPal?`);
        if (!confirmation) {
            showMessage('PayPal payment cancelled by user.', 'warning');
            return;
        }

        const form = document.createElement('form');
        form.action = 'https://www.paypal.com/cgi-bin/webscr';
        form.method = 'post';
        form.target = '_top';

        const fields = {
            cmd: '_xclick',
            business: PAYPAL_BUSINESS_EMAIL_OR_ID,
            item_name: `${PAYPAL_ITEM_NAME} - ${eventName}`,
            amount: PAYPAL_AMOUNT,
            currency_code: PAYPAL_CURRENCY_CODE,
            no_shipping: '1',
            return: PAYPAL_RETURN_URL,
            cancel_return: PAYPAL_CANCEL_URL,
            custom: eventId
        };

        for (const key in fields) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }

    loadEventsForFeaturedManagement();
});
