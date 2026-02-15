/**
 * Vapi.ai Configuration
 * Centralized configuration for Vapi telephony integration
 */

export const vapiConfig = {
    // API credentials
    apiKey: process.env.VAPI_API_KEY,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    serverUrl: process.env.VAPI_SERVER_URL,

    // Assistant configuration
    assistantConfig: {
        // Server URL for webhook events (critical for call routing)
        serverUrl: process.env.VAPI_SERVER_URL,

        // Voice settings
        voice: {
            provider: '11labs', // Vapi built-in provider
            voiceId: 'bella', // Default voice
        },

        // Model configuration (custom routing through our webhook)
        model: {
            provider: 'custom-llm',
            url: `${process.env.VAPI_SERVER_URL}/api/vapi/webhook`,
            model: 'momentum-sales-agent',
        },

        // Call behavior
        silenceTimeoutSeconds: 25,
        maxDurationSeconds: 1800, // 30 min max call
        backgroundSound: 'off',
        backchannelingEnabled: false,

        // First message
        firstMessage: "Thanks for calling. How can I help you today?",

        // End call phrases
        endCallPhrases: ['goodbye', 'bye', 'have a good day'],
    },

    // Webhook event types we handle
    webhookEvents: {
        ASSISTANT_REQUEST: 'assistant-request',
        FUNCTION_CALL: 'function-call',
        TRANSCRIPT: 'transcript',
        SPEECH_UPDATE: 'speech-update',
        END_OF_CALL_REPORT: 'end-of-call-report',
        HANG: 'hang',
        STATUS_UPDATE: 'status-update',
    },
} as const

/**
 * Validate Vapi configuration
 * @throws Error if required configuration is missing
 */
export function validateVapiConfig(): void {
    if (!vapiConfig.apiKey) {
        throw new Error('VAPI_API_KEY is required. Get it from https://dashboard.vapi.ai')
    }

    if (!vapiConfig.serverUrl) {
        console.warn(
            'VAPI_SERVER_URL not set. Webhooks will not work. Use ngrok for local dev: https://ngrok.com'
        )
    }
}

/**
 * Get webhook URL for a specific endpoint
 */
export function getWebhookUrl(endpoint: string = '/api/vapi/webhook'): string {
    if (!vapiConfig.serverUrl) {
        throw new Error('VAPI_SERVER_URL not configured')
    }
    return `${vapiConfig.serverUrl}${endpoint}`
}
