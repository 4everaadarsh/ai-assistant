const intentDetector = require('../intent/intentDetector');
const contextBuilder = require('../context/contextBuilder');
const conversationMemory = require('../memory/conversationMemory');
const toolExecutor = require('../tools/toolExecutor');

const receptionistAgent = require('../agents/receptionistAgent');
const copilotAgent = require('../agents/copilotAgent');
const analyticsAgent = require('../agents/analyticsAgent');

/**
 * DentalAI OS - Enterprise AI Orchestrator
 *
 * Central intelligence pipeline for DentalAI OS.
 * Orchestrates intent detection, session entity memory, context synthesis,
 * specialized agent invocation, safety confirmation gates, and tool execution.
 */

class AIOrchestrator {

    async process({
        message,
        agentType = 'auto',
        sessionId = 'default-session',
        patientId = null,
        clinicId = null,
        userId = null,
        confirmed = false
    }) {

        if (!message || typeof message !== 'string' || !message.trim()) {
            throw new Error('A valid message string is required.');
        }

        const cleanMessage = message.trim();

        try {
            // 1. Normalize agent selector
            let selectedAgentType = this.normalizeAgentType(agentType);
            const detectionAgent = selectedAgentType === 'auto' ? 'receptionist' : selectedAgentType;

            // 2. Detect user intent
            const intentResult = intentDetector.detect(cleanMessage, detectionAgent);

            // 3. Auto-select agent if auto mode
            if (selectedAgentType === 'auto') {
                selectedAgentType = this.selectAgent(intentResult.intent);
            }

            const finalIntentResult = intentDetector.detect(cleanMessage, selectedAgentType);

            // 4. Build context including session entities and reference clock
            const context = await contextBuilder.build({
                agentType: selectedAgentType,
                sessionId,
                patientId,
                clinicId,
                userId
            });

            // 5. Load formatted conversation history (messages + accumulated entities)
            const conversationHistory = conversationMemory.formatForPrompt(sessionId);

            // Add user message to session memory
            conversationMemory.addMessage(sessionId, 'user', cleanMessage);

            // 6. Get specialized AI agent
            const agent = this.getAgent(selectedAgentType);

            // 7. Invoke Gemini Agent
            const aiResponse = await agent.process({
                message: cleanMessage,
                intent: finalIntentResult.intent,
                confidence: finalIntentResult.confidence,
                context,
                conversationHistory
            });

            // 8. Update accumulated session entities with newly extracted entities
            if (aiResponse && aiResponse.entities) {
                conversationMemory.updateEntities(sessionId, aiResponse.entities);
            }

            const accumulatedEntities = conversationMemory.getEntities(sessionId);

            // 9. Prepare execution context merging session entities
            const executionContext = {
                patientId: patientId || accumulatedEntities.patientId || context.currentPatient?.id,
                patientName: accumulatedEntities.patientName || context.currentPatient?.name,
                phone: accumulatedEntities.phone || context.currentPatient?.phone,
                clinicId: clinicId || context.activeLocation?.clinicId || 'bellevue',
                userId: userId || context.clinicSettings?.activeUserId || 'mercer',
                provider: context.clinicSettings?.activeUserId || 'mercer'
            };

            let action = String(aiResponse?.action || 'NONE').toUpperCase();
            let intent = aiResponse?.intent || finalIntentResult.intent;

            const pendingFlow = conversationMemory.getPendingFlow(sessionId);

            // Check if user requested cancellation / abandonment during a pending flow
            const isExplicitCancel = cleanMessage.toLowerCase().match(/\b(cancel|never mind|nah leave it|leave it|forget it|stop|nah|don't book)\b/i);
            if (pendingFlow && (intent === 'CANCEL_APPOINTMENT' || isExplicitCancel)) {
                conversationMemory.clearPendingFlow(sessionId);
                conversationMemory.clearEntities(sessionId);
                const cancelResponse = 'I have cancelled your pending appointment request. Please let me know whenever you would like to schedule with Apex Dental!';
                conversationMemory.addMessage(sessionId, 'assistant', cancelResponse);
                return {
                    success: true,
                    sessionId,
                    intent: 'CANCEL_APPOINTMENT',
                    confidence: 0.95,
                    agent: selectedAgentType,
                    action: 'NONE',
                    entities: {},
                    response: cancelResponse,
                    followUpQuestions: [],
                    toolResult: { executed: false, action: 'NONE', reason: 'User cancelled pending booking flow.' }
                };
            }

            // Handle pending booking resumption vs side questions
            if (pendingFlow && pendingFlow.action === 'CREATE_APPOINTMENT') {
                const isSideQuestion = ['INSURANCE_QUERY', 'PRICING_QUERY', 'CLINIC_HOURS', 'AVAILABILITY_QUERY', 'DENTAL_EMERGENCY'].includes(intent);
                const hasParamUpdate = Boolean(aiResponse?.entities?.phone || aiResponse?.entities?.preferredDate || aiResponse?.entities?.preferredTime || aiResponse?.entities?.patientName);

                if (!isSideQuestion || hasParamUpdate) {
                    if (action === 'NONE' || action === 'COLLECT_INFORMATION' || action === 'CREATE_APPOINTMENT') {
                        action = 'CREATE_APPOINTMENT';
                        if (intent === 'PARAM_PROVIDED' || intent === 'CORRECTION' || intent === 'GREETING' || intent === 'GENERAL_QUERY') {
                            intent = 'BOOK_APPOINTMENT';
                        }
                    }
                }
            }

            // Combine entities from AI response with accumulated session entities
            const mergedResponseForTools = {
                ...aiResponse,
                intent,
                action,
                entities: {
                    ...accumulatedEntities,
                    ...(aiResponse.entities || {})
                }
            };

            // 10. Safety Gate & Tool Execution
            let toolResult = null;

            const readOnlyActions = ['LOOKUP_PATIENT'];
            const validatedCreateActions = ['CREATE_APPOINTMENT'];
            const confirmationRequiredActions = [
                'CANCEL_APPOINTMENT',
                'RESCHEDULE_APPOINTMENT',
                'CREATE_CLINICAL_NOTE'
            ];

            if (readOnlyActions.includes(action) || validatedCreateActions.includes(action)) {
                toolResult = await toolExecutor.execute(mergedResponseForTools, executionContext);
            } else if (confirmationRequiredActions.includes(action)) {
                if (confirmed === true) {
                    toolResult = await toolExecutor.execute(mergedResponseForTools, executionContext);
                } else {
                    toolResult = {
                        executed: false,
                        action,
                        confirmationRequired: true,
                        reason: 'Explicit confirmation required before proceeding.'
                    };
                }
            } else {
                toolResult = {
                    executed: false,
                    action,
                    reason: 'No database action required.'
                };
            }

            // Update pending flow state based on tool execution result
            if (action === 'CREATE_APPOINTMENT') {
                if (toolResult?.executed === true) {
                    conversationMemory.clearPendingFlow(sessionId);
                } else if (toolResult?.missingFields?.length) {
                    conversationMemory.setPendingFlow(sessionId, { intent: 'BOOK_APPOINTMENT', action: 'CREATE_APPOINTMENT' });
                } else {
                    conversationMemory.clearPendingFlow(sessionId);
                }
            }

            // 11. Synthesize final natural language response
            let finalResponse = aiResponse?.response || 'Your request has been processed.';

            if (action === 'CREATE_APPOINTMENT' && toolResult?.executed) {
                const appointment = toolResult.data;
                finalResponse = appointment?.time
                    ? `Thank you! I have confirmed your appointment for ${appointment.time}. We look forward to seeing you at Apex Dental!`
                    : 'Your appointment has been successfully scheduled.';
            } else if (action === 'CANCEL_APPOINTMENT' && toolResult?.executed) {
                finalResponse = 'Your appointment has been successfully cancelled. Please let us know when you would like to reschedule!';
            } else if (action === 'RESCHEDULE_APPOINTMENT' && toolResult?.executed) {
                const updated = toolResult.data;
                finalResponse = updated?.time
                    ? `Your appointment has been successfully rescheduled to ${updated.time}.`
                    : 'Your appointment has been successfully rescheduled.';
            } else if (action === 'CREATE_CLINICAL_NOTE' && toolResult?.executed) {
                finalResponse = 'The clinical note has been successfully saved to the patient record.';
            } else if (toolResult?.confirmationRequired) {
                finalResponse = `${aiResponse.response || 'I have the details ready.'} Please confirm if you would like me to proceed.`;
            } else if (action === 'CREATE_APPOINTMENT' && !toolResult?.executed && toolResult?.reason && !toolResult?.missingFields?.length) {
                finalResponse = toolResult.reason;
            } else if (toolResult?.missingFields?.length && action === 'CREATE_APPOINTMENT') {
                // If AI response already asked a natural single question, prefer it; otherwise use single polite fallback question
                if (!aiResponse?.response || aiResponse.response.includes('processed') || aiResponse.response.includes('delighted')) {
                    const nextMissing = toolResult.missingFields[0];
                    if (nextMissing.includes('phone')) {
                        finalResponse = "May I please have your best 10-digit callback phone number to confirm the booking?";
                    } else if (nextMissing.includes('Date')) {
                        finalResponse = "What day would work best for your appointment?";
                    } else if (nextMissing.includes('Time')) {
                        finalResponse = "What time of day do you prefer (morning or afternoon)?";
                    } else if (nextMissing.includes('patientName')) {
                        finalResponse = "May I please have your full name?";
                    }
                } else {
                    finalResponse = aiResponse.response;
                }
            }

            // 12. Save final response to conversation history
            conversationMemory.addMessage(sessionId, 'assistant', finalResponse);

            return {
                success: true,
                sessionId,
                intent,
                confidence: aiResponse.confidence ?? finalIntentResult.confidence,
                agent: aiResponse.agent || selectedAgentType,
                action,
                entities: mergedResponseForTools.entities,
                response: finalResponse,
                followUpQuestions: aiResponse.followUpQuestions || [],
                toolResult
            };

        } catch (error) {
            console.error('[AI Orchestrator] Processing error:', error.message);
            return {
                success: false,
                sessionId,
                intent: 'ERROR',
                confidence: 0,
                agent: 'system',
                action: 'NONE',
                entities: {},
                response: 'I encountered an issue processing your request. Please try again.',
                followUpQuestions: [],
                toolResult: null
            };
        }
    }

    normalizeAgentType(agentType) {
        const allowed = ['auto', 'receptionist', 'copilot', 'analytics'];
        if (typeof agentType !== 'string' || !allowed.includes(agentType.toLowerCase())) {
            return 'auto';
        }
        return agentType.toLowerCase();
    }

    selectAgent(intent) {
        const analyticsIntents = ['ANALYTICS_QUERY'];
        const copilotIntents = ['PATIENT_LOOKUP', 'PATIENT_SUMMARY', 'CREATE_CLINICAL_NOTE'];

        if (analyticsIntents.includes(intent)) return 'analytics';
        if (copilotIntents.includes(intent)) return 'copilot';
        return 'receptionist';
    }

    getAgent(agentType) {
        switch (agentType) {
            case 'copilot': return copilotAgent;
            case 'analytics': return analyticsAgent;
            case 'receptionist':
            default: return receptionistAgent;
        }
    }
}

module.exports = new AIOrchestrator();