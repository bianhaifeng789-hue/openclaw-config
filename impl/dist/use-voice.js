// @ts-nocheck
class UseVoice {
    state = {
        listening: false,
        speaking: false,
        transcript: '',
        durationMs: 0
    };
    listeners = new Set();
    startTime = 0;
    commands = new Map();
    /**
     * Start listening
     */
    startListening() {
        this.state.listening = true;
        this.state.transcript = '';
        this.state.error = undefined;
        this.startTime = Date.now();
        this.notifyListeners();
        // Would use Web Speech API
        // For demo, simulate
        setTimeout(() => {
            this.state.transcript = 'Simulated voice input';
            this.state.durationMs = Date.now() - this.startTime;
            this.notifyListeners();
        }, 1000);
    }
    /**
     * Stop listening
     */
    stopListening() {
        this.state.listening = false;
        this.state.durationMs = Date.now() - this.startTime;
        // Process command
        this.processCommand(this.state.transcript);
        this.notifyListeners();
        return this.state.transcript;
    }
    /**
     * Process command
     */
    processCommand(transcript) {
        for (const [pattern, handler] of this.commands) {
            if (transcript.toLowerCase().includes(pattern.toLowerCase())) {
                handler(transcript);
                return;
            }
        }
    }
    /**
     * Register command
     */
    registerCommand(pattern, handler) {
        this.commands.set(pattern, handler);
    }
    /**
     * Unregister command
     */
    unregisterCommand(pattern) {
        return this.commands.delete(pattern);
    }
    /**
     * Set transcript
     */
    setTranscript(transcript) {
        this.state.transcript = transcript;
        this.notifyListeners();
    }
    /**
     * Speak
     */
    async speak(text) {
        this.state.speaking = true;
        this.notifyListeners();
        // Would use TTS
        // For demo, simulate delay
        await this.delay(text.length * 50);
        this.state.speaking = false;
        this.notifyListeners();
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get transcript
     */
    getTranscript() {
        return this.state.transcript;
    }
    /**
     * Clear transcript
     */
    clearTranscript() {
        this.state.transcript = '';
        this.notifyListeners();
    }
    /**
     * Is listening
     */
    isListening() {
        return this.state.listening;
    }
    /**
     * Is speaking
     */
    isSpeaking() {
        return this.state.speaking;
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            listening: this.state.listening,
            speaking: this.state.speaking,
            transcriptLength: this.state.transcript.length,
            commandsCount: this.commands.size,
            listenersCount: this.listeners.size
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.state = {
            listening: false,
            speaking: false,
            transcript: '',
            durationMs: 0
        };
        this.listeners.clear();
        this.commands.clear();
        this.startTime = 0;
    }
}
// Global singleton
export const useVoice = new UseVoice();
export default useVoice;
//# sourceMappingURL=use-voice.js.map