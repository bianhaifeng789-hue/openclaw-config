// @ts-nocheck

/**
 * Use Voice Pattern - 语音Hook
 * 
 * Source: Claude Code hooks/useVoice.ts + utils/voiceInput.ts
 * Pattern: voice input + speech recognition + audio + voice commands
 */

interface VoiceState {
  listening: boolean
  speaking: boolean
  transcript: string
  error?: string
  durationMs: number
}

class UseVoice {
  private state: VoiceState = {
    listening: false,
    speaking: false,
    transcript: '',
    durationMs: 0
  }
  private listeners = new Set<(state: VoiceState) => void>()
  private startTime = 0
  private commands = new Map<string, (transcript: string) => void>()

  /**
   * Start listening
   */
  startListening(): void {
    this.state.listening = true
    this.state.transcript = ''
    this.state.error = undefined
    this.startTime = Date.now()

    this.notifyListeners()

    // Would use Web Speech API
    // For demo, simulate
    setTimeout(() => {
      this.state.transcript = 'Simulated voice input'
      this.state.durationMs = Date.now() - this.startTime
      this.notifyListeners()
    }, 1000)
  }

  /**
   * Stop listening
   */
  stopListening(): string {
    this.state.listening = false
    this.state.durationMs = Date.now() - this.startTime

    // Process command
    this.processCommand(this.state.transcript)

    this.notifyListeners()

    return this.state.transcript
  }

  /**
   * Process command
   */
  private processCommand(transcript: string): void {
    for (const [pattern, handler] of this.commands) {
      if (transcript.toLowerCase().includes(pattern.toLowerCase())) {
        handler(transcript)
        return
      }
    }
  }

  /**
   * Register command
   */
  registerCommand(pattern: string, handler: (transcript: string) => void): void {
    this.commands.set(pattern, handler)
  }

  /**
   * Unregister command
   */
  unregisterCommand(pattern: string): boolean {
    return this.commands.delete(pattern)
  }

  /**
   * Set transcript
   */
  setTranscript(transcript: string): void {
    this.state.transcript = transcript
    this.notifyListeners()
  }

  /**
   * Speak
   */
  async speak(text: string): Promise<void> {
    this.state.speaking = true
    this.notifyListeners()

    // Would use TTS
    // For demo, simulate delay
    await this.delay(text.length * 50)

    this.state.speaking = false
    this.notifyListeners()
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get state
   */
  getState(): VoiceState {
    return { ...this.state }
  }

  /**
   * Get transcript
   */
  getTranscript(): string {
    return this.state.transcript
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.state.transcript = ''
    this.notifyListeners()
  }

  /**
   * Is listening
   */
  isListening(): boolean {
    return this.state.listening
  }

  /**
   * Is speaking
   */
  isSpeaking(): boolean {
    return this.state.speaking
  }

  /**
   * Subscribe
   */
  subscribe(listener: (state: VoiceState) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getState())
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    listening: boolean
    speaking: boolean
    transcriptLength: number
    commandsCount: number
    listenersCount: number
  } {
    return {
      listening: this.state.listening,
      speaking: this.state.speaking,
      transcriptLength: this.state.transcript.length,
      commandsCount: this.commands.size,
      listenersCount: this.listeners.size
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.state = {
      listening: false,
      speaking: false,
      transcript: '',
      durationMs: 0
    }
    this.listeners.clear()
    this.commands.clear()
    this.startTime = 0
  }
}

// Global singleton
export const useVoice = new UseVoice()

export default useVoice