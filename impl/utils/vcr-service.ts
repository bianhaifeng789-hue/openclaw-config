// @ts-nocheck

/**
 * VCR Pattern - VCR录制
 * 
 * Source: Claude Code services/vcr.ts
 * Pattern: VCR + recording + playback + cassette + mock HTTP
 */

interface VCRCassette {
  name: string
  recordings: VCRRecording[]
  createdAt: number
}

interface VCRRecording {
  request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }
  response: {
    status: number
    headers?: Record<string, string>
    body: any
    durationMs: number
  }
  timestamp: number
}

class VCRService {
  private cassettes = new Map<string, VCRCassette>()
  private currentCassette: VCRCassette | null = null
  private mode: 'record' | 'playback' | 'disabled' = 'disabled'
  private recordingCounter = 0

  /**
   * Start recording
   */
  startRecording(cassetteName: string): void {
    this.mode = 'record'

    this.currentCassette = {
      name: cassetteName,
      recordings: [],
      createdAt: Date.now()
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): VCRCassette | null {
    if (!this.currentCassette) return null

    this.cassettes.set(this.currentCassette.name, this.currentCassette)
    const cassette = this.currentCassette

    this.currentCassette = null
    this.mode = 'disabled'

    return cassette
  }

  /**
   * Load cassette for playback
   */
  loadCassette(name: string): boolean {
    const cassette = this.cassettes.get(name)
    if (!cassette) return false

    this.currentCassette = cassette
    this.mode = 'playback'

    return true
  }

  /**
   * Eject cassette
   */
  eject(): void {
    this.currentCassette = null
    this.mode = 'disabled'
  }

  /**
   * Record request/response
   */
  record(request: VCRRecording['request'], response: VCRRecording['response']): void {
    if (this.mode !== 'record' || !this.currentCassette) return

    const recording: VCRRecording = {
      request,
      response,
      timestamp: Date.now()
    }

    this.currentCassette.recordings.push(recording)
    this.recordingCounter++
  }

  /**
   * Find matching recording
   */
  findRecording(request: VCRRecording['request']): VCRRecording | undefined {
    if (this.mode !== 'playback' || !this.currentCassette) return undefined

    return this.currentCassette.recordings.find(r =>
      r.request.method === request.method &&
      r.request.url === request.url
    )
  }

  /**
   * Get cassette
   */
  getCassette(name: string): VCRCassette | undefined {
    return this.cassettes.get(name)
  }

  /**
   * Get all cassettes
   */
  getAllCassettes(): VCRCassette[] {
    return Array.from(this.cassettes.values())
  }

  /**
   * Delete cassette
   */
  deleteCassette(name: string): boolean {
    return this.cassettes.delete(name)
  }

  /**
   * Get mode
   */
  getMode(): 'record' | 'playback' | 'disabled' {
    return this.mode
  }

  /**
   * Get stats
   */
  getStats(): {
    cassetteCount: number
    totalRecordings: number
    currentMode: string
    currentCassette: string | null
  } {
    const totalRecordings = Array.from(this.cassettes.values())
      .reduce((sum, c) => sum + c.recordings.length, 0)

    return {
      cassetteCount: this.cassettes.size,
      totalRecordings,
      currentMode: this.mode,
      currentCassette: this.currentCassette?.name ?? null
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.cassettes.clear()
    this.currentCassette = null
    this.mode = 'disabled'
    this.recordingCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const vcrService = new VCRService()

export default vcrService