/**
 * DentalAI OS - Enterprise Conversation Memory
 *
 * Tracks multi-turn conversation messages AND accumulated session entities.
 * Ensures the AI never asks for information already provided in earlier turns,
 * and enables seamless corrections ("No, Friday instead").
 */

class ConversationMemory {
    constructor() {
        this.sessions = new Map();
        this.sessionEntities = new Map();
        this.maxMessages = 20;
        this.sessionTTL = 45 * 60 * 1000; // 45 minutes
    }

    /**
     * Get conversation history for a session.
     */
    getHistory(sessionId) {
        if (!sessionId) return [];

        const session = this.sessions.get(sessionId);
        if (!session) return [];

        if (Date.now() - session.updatedAt > this.sessionTTL) {
            this.clearSession(sessionId);
            return [];
        }

        return [...session.messages];
    }

    /**
     * Get accumulated entities for a session.
     */
    getEntities(sessionId) {
        if (!sessionId) return {};
        const entities = this.sessionEntities.get(sessionId);
        return entities ? { ...entities } : {};
    }

    /**
     * Merge newly extracted entities into accumulated session state.
     * Handles corrections cleanly (new values overwrite old ones).
     */
    updateEntities(sessionId, newEntities = {}) {
        if (!sessionId || !newEntities || typeof newEntities !== 'object') return {};

        const current = this.getEntities(sessionId);
        const updated = { ...current };

        for (const [key, value] of Object.entries(newEntities)) {
            if (value !== null && value !== undefined && String(value).trim() !== '' && value !== 'NONE') {
                updated[key] = String(value).trim();
            }
        }

        this.sessionEntities.set(sessionId, updated);
        return { ...updated };
    }

    /**
     * Clear specific entity key or reset entities.
     */
    clearEntities(sessionId) {
        if (sessionId) {
            this.sessionEntities.delete(sessionId);
        }
    }

    /**
     * Add a message to conversation memory.
     * role: "user" | "assistant"
     */
    addMessage(sessionId, role, content) {
        if (!sessionId || !content) return;

        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        const session = this.sessions.get(sessionId);

        session.messages.push({
            role,
            content: String(content),
            timestamp: new Date().toISOString()
        });

        if (session.messages.length > this.maxMessages) {
            session.messages = session.messages.slice(-this.maxMessages);
        }

        session.updatedAt = Date.now();
    }

    /**
     * Set pending flow for a session (e.g. appointment booking with missing fields).
     */
    setPendingFlow(sessionId, flow = { intent: 'BOOK_APPOINTMENT', action: 'CREATE_APPOINTMENT' }) {
        if (!sessionId) return;
        if (!this.pendingFlows) this.pendingFlows = new Map();
        this.pendingFlows.set(sessionId, {
            ...flow,
            updatedAt: Date.now()
        });
    }

    /**
     * Get active pending flow for a session.
     */
    getPendingFlow(sessionId) {
        if (!sessionId || !this.pendingFlows) return null;
        const flow = this.pendingFlows.get(sessionId);
        if (!flow) return null;
        if (Date.now() - flow.updatedAt > this.sessionTTL) {
            this.pendingFlows.delete(sessionId);
            return null;
        }
        return flow;
    }

    /**
     * Clear pending flow for a session.
     */
    clearPendingFlow(sessionId) {
        if (sessionId && this.pendingFlows) {
            this.pendingFlows.delete(sessionId);
        }
    }

    /**
     * Clear a specific conversation session and its entities.
     */
    clearSession(sessionId) {
        if (!sessionId) return false;
        this.clearPendingFlow(sessionId);
        this.sessionEntities.delete(sessionId);
        return this.sessions.delete(sessionId);
    }

    /**
     * Remove expired sessions.
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.updatedAt > this.sessionTTL) {
                this.clearSession(sessionId);
            }
        }
    }

    /**
     * Format history and accumulated entities for inclusion in AI prompt.
     */
    formatForPrompt(sessionId) {
        const history = this.getHistory(sessionId);
        const entities = this.getEntities(sessionId);

        let entitySummary = 'None collected yet.';
        const keys = Object.keys(entities);
        if (keys.length > 0) {
            entitySummary = keys.map(k => `- ${k}: ${entities[k]}`).join('\n');
        }

        if (history.length === 0) {
            return `ACCUMULATED ENTITIES SO FAR:\n${entitySummary}\n\nCONVERSATION HISTORY:\nNo previous conversation.`;
        }

        const historyStr = history
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        return `ACCUMULATED ENTITIES SO FAR:\n${entitySummary}\n\nCONVERSATION HISTORY:\n${historyStr}`;
    }
}

module.exports = new ConversationMemory();