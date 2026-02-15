const clientMdByCallId = new Map<string, string>()
const clientMdBySessionId = new Map<string, string>()

export function setClientMdForCall(callId: string, content: string): void {
  clientMdByCallId.set(callId, content)
}

export function setClientMdForSession(sessionId: string, content: string): void {
  clientMdBySessionId.set(sessionId, content)
}

export function setClientMd(params: {
  callId?: string
  sessionId?: string
  content: string
}): void {
  const { callId, sessionId, content } = params
  if (callId) {
    setClientMdForCall(callId, content)
  }
  if (sessionId) {
    setClientMdForSession(sessionId, content)
  }
}

export function getClientMdByCallId(callId: string): string | undefined {
  return clientMdByCallId.get(callId)
}

export function getClientMdBySessionId(sessionId: string): string | undefined {
  return clientMdBySessionId.get(sessionId)
}

export function clearClientMdForCall(callId: string): void {
  clientMdByCallId.delete(callId)
}

export function clearClientMdForSession(sessionId: string): void {
  clientMdBySessionId.delete(sessionId)
}

export function clearAllClientMd(): void {
  clientMdByCallId.clear()
  clientMdBySessionId.clear()
}
