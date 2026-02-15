import Vapi from '@vapi-ai/server-sdk'
import { vapiConfig, validateVapiConfig } from '@/lib/vapi-config'

/**
 * VapiService
 * SDK wrapper for all Vapi.ai API operations
 * Handles assistant creation, call management, and phone number operations
 */
export class VapiService {
    private client: typeof Vapi.prototype

    constructor() {
        validateVapiConfig()
        this.client = new (Vapi as any)({ token: vapiConfig.apiKey! })
    }

    /**
     * Create or update the Momentum AI assistant
     * This configures the assistant with our custom webhook for LLM routing
     */
    async createAssistant(config?: {
        name?: string
        firstMessage?: string
        voice?: Record<string, any>
    }) {
        const assistantConfig = {
            name: config?.name || 'Momentum Sales Agent',
            firstMessage: config?.firstMessage || vapiConfig.assistantConfig.firstMessage,

            // Voice configuration
            voice: config?.voice || vapiConfig.assistantConfig.voice,

            // Model configuration (routes to our custom LLM via webhook)
            model: vapiConfig.assistantConfig.model,

            // Server URL for webhook events
            serverUrl: vapiConfig.assistantConfig.serverUrl,

            // Call behavior
            silenceTimeoutSeconds: vapiConfig.assistantConfig.silenceTimeoutSeconds,
            maxDurationSeconds: vapiConfig.assistantConfig.maxDurationSeconds,
            backgroundSound: vapiConfig.assistantConfig.backgroundSound,
            backchannelingEnabled: vapiConfig.assistantConfig.backchannelingEnabled,
            endCallPhrases: vapiConfig.assistantConfig.endCallPhrases,
        }

        try {
            const assistant = await this.client.assistants.create(assistantConfig)
            console.log('[VapiService] Assistant created:', assistant.id)
            return assistant
        } catch (error) {
            console.error('[VapiService] Failed to create assistant:', error)
            throw error
        }
    }

    /**
     * Make an outbound call
     * Useful for testing and demo purposes
     */
    async makeOutboundCall(params: {
        phoneNumber: string
        assistantId?: string
        name?: string
    }) {
        try {
            const call = await this.client.calls.create({
                phoneNumberId: vapiConfig.phoneNumberId,
                customer: {
                    number: params.phoneNumber,
                    name: params.name,
                },
                assistantId: params.assistantId,
            })

            console.log('[VapiService] Outbound call initiated:', call.id)
            return call
        } catch (error) {
            console.error('[VapiService] Failed to create outbound call:', error)
            throw error
        }
    }

    /**
     * Get call details
     */
    async getCall(callId: string) {
        try {
            return await this.client.calls.get(callId)
        } catch (error) {
            console.error('[VapiService] Failed to get call:', error)
            throw error
        }
    }

    /**
     * List recent calls
     */
    async listCalls(limit: number = 10) {
        try {
            return await this.client.calls.list({ limit })
        } catch (error) {
            console.error('[VapiService] Failed to list calls:', error)
            throw error
        }
    }

    /**
     * Get available phone numbers
     */
    async getPhoneNumbers() {
        try {
            return await this.client.phoneNumbers.list()
        } catch (error) {
            console.error('[VapiService] Failed to get phone numbers:', error)
            throw error
        }
    }

    /**
     * List all assistants
     */
    async listAssistants() {
        try {
            return await this.client.assistants.list()
        } catch (error) {
            console.error('[VapiService] Failed to list assistants:', error)
            throw error
        }
    }

    /**
     * Update an existing assistant
     */
    async updateAssistant(assistantId: string, config: Record<string, any>) {
        try {
            return await this.client.assistants.update(assistantId, config)
        } catch (error) {
            console.error('[VapiService] Failed to update assistant:', error)
            throw error
        }
    }

    /**
     * Delete an assistant
     */
    async deleteAssistant(assistantId: string) {
        try {
            return await this.client.assistants.delete(assistantId)
        } catch (error) {
            console.error('[VapiService] Failed to delete assistant:', error)
            throw error
        }
    }
}

// Singleton instance
const globalForVapi = global as unknown as { vapiService?: VapiService }

export function getVapiService(): VapiService {
    if (!globalForVapi.vapiService) {
        globalForVapi.vapiService = new VapiService()
    }
    return globalForVapi.vapiService
}
