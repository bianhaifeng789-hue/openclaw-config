// @ts-nocheck
class VoiceModeService {
    sessions = [];
    sessionCounter = 0;
    isListening = false;
    isSpeaking = false;
    config = {
        ttsEnabled: true,
        sttEnabled: true,
        voiceId: 'default',
        language: 'zh-CN',
        holdToTalk: true,
        autoSpeak: false
    };
    /**
     * Start listening (STT)
     */
    startListening() {
        if (this.isListening) {
            throw new Error('Already listening');
        }
        this.isListening = true;
        const sessionId = `voice-${++this.sessionCounter}-${Date.now()}`;
        const session = {
            sessionId,
            startTime: Date.now(),
            durationMs: 0,
            success: false
        };
        this.sessions.push(session);
        return sessionId;
    }
    /**
     * Stop listening and get transcript
     */
    async stopListening(sessionId) {
        this.isListening = false;
        const session = this.sessions.find(s => s.sessionId === sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        // Would get actual transcript from STT
        // For demo, return placeholder
        session.inputText = 'User voice input transcript';
        session.durationMs = Date.now() - session.startTime;
        return session.inputText;
    }
    /**
     * Speak (TTS)
     */
    async speak(text) {
        if (!this.config.ttsEnabled) {
            return;
        }
        if (this.isSpeaking) {
            throw new Error('Already speaking');
        }
        this.isSpeaking = true;
        // Would use actual TTS service
        // For demo, simulate duration
        const durationMs = text.length * 50; // ~50ms per character
        await this.delay(durationMs);
        this.isSpeaking = false;
    }
    /**
     * Auto speak response
     */
    async autoSpeakResponse(text) {
        if (this.config.autoSpeak) {
            await this.speak(text);
        }
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Check if voice mode active
     */
    isActive() {
        return this.isListening || this.isSpeaking;
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get sessions
     */
    getSessions() {
        return [...this.sessions];
    }
    /**
     * Get stats
     */
    getStats() {
        const totalSessions = this.sessions.length;
        const averageDuration = totalSessions > 0
            ? this.sessions.reduce((sum, s) => sum + s.durationMs, 0) / totalSessions
            : 0;
        const successCount = this.sessions.filter(s => s.success).length;
        const successRate = totalSessions > 0 ? successCount / totalSessions : 0;
        return {
            totalSessions,
            averageDuration,
            successRate,
            ttsEnabled: this.config.ttsEnabled,
            sttEnabled: this.config.sttEnabled
        };
    }
    /**
     * Clear sessions
     */
    clearSessions() {
        this.sessions = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.sessions = [];
        this.sessionCounter = 0;
        this.isListening = false;
        this.isSpeaking = false;
        this.config = {
            ttsEnabled: true,
            sttEnabled: true,
            voiceId: 'default',
            language: 'zh-CN',
            holdToTalk: true,
            autoSpeak: false
        };
    }
}
// Global singleton
export const voiceModeService = new VoiceModeService();
export default voiceModeService;
//# sourceMappingURL=voice-mode-service.js.map