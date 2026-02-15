/**
 * Centralized logging utility with configurable log levels
 * Provides structured logging with timestamps and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
    level: LogLevel
    enableTimestamps: boolean
    enableColors: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

class Logger {
    private config: LogConfig

    constructor() {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase()
        const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error']

        // Validate LOG_LEVEL and fallback to 'info' if invalid
        let logLevel: LogLevel = 'info'
        if (envLevel && validLevels.includes(envLevel as LogLevel)) {
            logLevel = envLevel as LogLevel
        } else if (envLevel) {
            console.warn(`[LOGGER] Invalid LOG_LEVEL="${envLevel}". Using default "info". Valid levels: ${validLevels.join(', ')}`)
        }

        this.config = {
            level: logLevel,
            enableTimestamps: process.env.LOG_TIMESTAMPS !== 'false',
            enableColors: process.env.LOG_COLORS !== 'false',
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
    }

    private formatMessage(level: LogLevel, context: string, message: string, data?: any): string {
        const parts: string[] = []

        if (this.config.enableTimestamps) {
            parts.push(`[${new Date().toISOString()}]`)
        }

        parts.push(`[${level.toUpperCase()}]`)
        parts.push(`[${context}]`)
        parts.push(message)

        if (data !== undefined) {
            parts.push(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data))
        }

        return parts.join(' ')
    }

    debug(context: string, message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', context, message, data))
        }
    }

    info(context: string, message: string, data?: any): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', context, message, data))
        }
    }

    warn(context: string, message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', context, message, data))
        }
    }

    error(context: string, message: string, error?: any): void {
        if (this.shouldLog('error')) {
            const errorData = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error
            console.error(this.formatMessage('error', context, message, errorData))
        }
    }

    // Convenience method for data flow logging
    flow(context: string, step: string, data?: any): void {
        this.debug(context, `FLOW: ${step}`, data)
    }
}

// Singleton instance
const logger = new Logger()

export default logger
