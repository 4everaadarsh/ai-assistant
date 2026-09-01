/**
 * DentalAI OS - Enterprise Response Parser
 *
 * Converts Gemini output into a normalized, safe, structured response object.
 * Validates extracted entity formats (phone, date, time, timePreference) and guarantees contract schemas.
 */

class ResponseParser {

    parse(rawResponse, fallback = {}) {
        const defaultResponse = {
            intent: fallback.intent || 'GENERAL_QUERY',
            confidence: fallback.confidence || 0.5,
            agent: fallback.agent || 'receptionist',
            action: 'NONE',
            entities: {},
            response: '',
            followUpQuestions: []
        };

        try {
            if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) {
                return this.normalize(rawResponse, defaultResponse);
            }

            if (typeof rawResponse !== 'string' || !rawResponse.trim()) {
                return {
                    ...defaultResponse,
                    response: 'I was unable to process that request.'
                };
            }

            const cleanedResponse = this.cleanJsonString(rawResponse);

            try {
                const parsed = JSON.parse(cleanedResponse);
                return this.normalize(parsed, defaultResponse);
            } catch (jsonError) {
                // If text was returned, construct structured object
                return {
                    ...defaultResponse,
                    response: rawResponse.trim()
                };
            }

        } catch (error) {
            console.error('[Response Parser] Failed to parse AI response:', error.message);
            return {
                ...defaultResponse,
                response: 'I encountered an issue while processing the response.'
            };
        }
    }

    /**
     * Remove Markdown JSON code block wrappers.
     */
    cleanJsonString(value) {
        return String(value)
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
    }

    /**
     * Ensure the AI response matches the DentalAI OS response contract.
     */
    normalize(data, defaults) {
        const confidence = typeof data.confidence === 'number'
            ? Math.min(Math.max(data.confidence, 0), 1)
            : defaults.confidence;

        const rawEntities = data.entities && typeof data.entities === 'object' && !Array.isArray(data.entities)
            ? data.entities
            : {};

        const sanitizedEntities = this.sanitizeEntities(rawEntities);

        return {
            intent: typeof data.intent === 'string' && data.intent.trim() ? data.intent.trim() : defaults.intent,
            confidence,
            agent: typeof data.agent === 'string' && data.agent.trim() ? data.agent.trim() : defaults.agent,
            action: typeof data.action === 'string' ? data.action.toUpperCase().trim() : 'NONE',
            entities: sanitizedEntities,
            response: typeof data.response === 'string' ? data.response.trim() : '',
            followUpQuestions: Array.isArray(data.followUpQuestions)
                ? data.followUpQuestions.filter(q => typeof q === 'string')
                : []
        };
    }

    /**
     * Sanitize and format extracted entity values.
     */
    sanitizeEntities(entities) {
        const cleaned = {};

        for (const [key, value] of Object.entries(entities)) {
            if (value === null || value === undefined || value === 'null' || value === 'NONE') continue;

            const strVal = String(value).trim();
            if (!strVal) continue;

            if (key === 'phone') {
                cleaned[key] = this.formatPhoneNumber(strVal);
            } else if (key === 'preferredDate' || key === 'newDate' || key === 'date') {
                cleaned['preferredDate'] = this.formatDate(strVal);
            } else if (key === 'preferredTime' || key === 'newTime' || key === 'time') {
                // If it's a general time preference like "evening", "morning", "afternoon"
                const lower = strVal.toLowerCase();
                if (lower.includes('morning') || lower.includes('afternoon') || lower.includes('evening') || lower.includes('lunch')) {
                    cleaned['timePreference'] = this.formatTimePreference(lower);
                } else {
                    cleaned['preferredTime'] = this.formatTime(strVal);
                }
            } else if (key === 'timePreference') {
                cleaned[key] = this.formatTimePreference(strVal);
            } else if (key === 'patientName') {
                cleaned[key] = this.cleanPatientName(strVal);
            } else {
                cleaned[key] = strVal;
            }
        }

        return cleaned;
    }

    /**
     * Clean and normalize patient name.
     */
    cleanPatientName(nameStr) {
        let cleaned = String(nameStr).trim();
        // Remove conversational prefixes/suffixes if present
        cleaned = cleaned.replace(/^(my name is|i am|it's|for|this is)\s+/i, '');
        cleaned = cleaned.replace(/\s+(here|please|thanks|thank you)$/i, '');
        return cleaned.trim();
    }

    /**
     * Format general time preferences.
     */
    formatTimePreference(str) {
        const lower = String(str).toLowerCase().trim();
        if (lower.includes('morn')) return 'morning';
        if (lower.includes('afternoon') || lower.includes('lunch') || lower.includes('noon')) return 'afternoon';
        if (lower.includes('even') || lower.includes('night')) return 'evening';
        return lower;
    }

    /**
     * Format 10-digit US phone numbers as (XXX) XXX-XXXX.
     */
    formatPhoneNumber(phoneStr) {
        const digits = phoneStr.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        if (digits.length === 11 && digits.startsWith('1')) {
            return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return phoneStr;
    }

    /**
     * Ensure date is in YYYY-MM-DD format if valid. Converts relative terms (tomorrow, today, kal, aaj, day names).
     */
    formatDate(dateStr, baseDate = new Date()) {
        const str = String(dateStr).toLowerCase().trim();
        const base = new Date(baseDate);

        if (str === 'today' || str === 'aaj') {
            return base.toISOString().split('T')[0];
        }
        if (str === 'tomorrow' || str === 'tmrw' || str === 'tomorow' || str === 'kal') {
            base.setDate(base.getDate() + 1);
            return base.toISOString().split('T')[0];
        }

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < days.length; i++) {
            if (str.includes(days[i])) {
                const currentDay = base.getDay();
                let targetDay = i;
                let diff = targetDay - currentDay;
                if (diff <= 0) diff += 7; // Next occurrence
                if (str.includes('next') && diff < 7) diff += 7;
                base.setDate(base.getDate() + diff);
                return base.toISOString().split('T')[0];
            }
        }

        const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
        return dateStr;
    }

    /**
     * Ensure time is in HH:mm format if valid. Converts 12-hour AM/PM times.
     */
    formatTime(timeStr) {
        const str = String(timeStr).trim();
        const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
        if (match12) {
            let hour = parseInt(match12[1], 10);
            const min = match12[2] || '00';
            const ampm = match12[3].toLowerCase();
            if (ampm === 'pm' && hour < 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
            return `${String(hour).padStart(2, '0')}:${min}`;
        }
        const match = str.match(/\d{1,2}:\d{2}/);
        if (match) {
            const parts = match[0].split(':');
            const hh = parts[0].padStart(2, '0');
            const mm = parts[1];
            return `${hh}:${mm}`;
        }
        return timeStr;
    }
}

module.exports = new ResponseParser();