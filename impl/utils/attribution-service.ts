// @ts-nocheck

/**
 * Attribution Pattern - 提交归属
 * 
 * Source: Claude Code utils/commitAttribution.ts + utils/attribution.ts
 * Pattern: attribution + authorship + co-authors + commit tracking
 */

interface Attribution {
  id: string
  authors: Array<{ name: string; email: string }>
  coAuthors: Array<{ name: string; email: string }>
  timestamp: number
  messageId?: string
}

interface CommitAttribution {
  commitHash: string
  attribution: Attribution
  verified: boolean
}

class AttributionService {
  private attributions = new Map<string, Attribution>()
  private commitAttributions = new Map<string, CommitAttribution>()
  private attributionCounter = 0

  /**
   * Create attribution
   */
  createAttribution(authors: Array<{ name: string; email: string }>, coAuthors?: Array<{ name: string; email: string }>, messageId?: string): Attribution {
    const id = `attr-${++this.attributionCounter}-${Date.now()}`

    const attribution: Attribution = {
      id,
      authors,
      coAuthors: coAuthors ?? [],
      timestamp: Date.now(),
      messageId
    }

    this.attributions.set(id, attribution)

    return attribution
  }

  /**
   * Add co-author
   */
  addCoAuthor(attributionId: string, name: string, email: string): boolean {
    const attribution = this.attributions.get(attributionId)
    if (!attribution) return false

    attribution.coAuthors.push({ name, email })

    return true
  }

  /**
   * Get attribution
   */
  getAttribution(id: string): Attribution | undefined {
    return this.attributions.get(id)
  }

  /**
   * Format attribution for commit
   */
  formatForCommit(attribution: Attribution): string {
    const lines: string[] = []

    // Primary author
    if (attribution.authors.length > 0) {
      const primary = attribution.authors[0]
      lines.push(`Author: ${primary.name} <${primary.email}>`)
    }

    // Co-authors
    for (const coAuthor of attribution.coAuthors) {
      lines.push(`Co-authored-by: ${coAuthor.name} <${coAuthor.email}>`)
    }

    return lines.join('\n')
  }

  /**
   * Link to commit
   */
  linkToCommit(attributionId: string, commitHash: string): CommitAttribution | null {
    const attribution = this.attributions.get(attributionId)
    if (!attribution) return null

    const commitAttribution: CommitAttribution = {
      commitHash,
      attribution,
      verified: false
    }

    this.commitAttributions.set(commitHash, commitAttribution)

    return commitAttribution
  }

  /**
   * Verify commit attribution
   */
  verifyCommit(commitHash: string): boolean {
    const commitAttribution = this.commitAttributions.get(commitHash)
    if (!commitAttribution) return false

    // Would verify against git commit
    commitAttribution.verified = true

    return true
  }

  /**
   * Get commit attribution
   */
  getCommitAttribution(commitHash: string): CommitAttribution | undefined {
    return this.commitAttributions.get(commitHash)
  }

  /**
   * Get attributions by author
   */
  getByAuthor(email: string): Attribution[] {
    return Array.from(this.attributions.values())
      .filter(a => a.authors.some(au => au.email === email) || a.coAuthors.some(ca => ca.email === email))
  }

  /**
   * Get stats
   */
  getStats(): {
    totalAttributions: number
    commitAttributions: number
    verifiedCommits: number
    totalAuthors: number
    totalCoAuthors: number
  } {
    const attributions = Array.from(this.attributions.values())

    const authors = new Set(attributions.flatMap(a => a.authors.map(au => au.email)))
    const coAuthors = new Set(attributions.flatMap(a => a.coAuthors.map(ca => ca.email)))

    const verified = Array.from(this.commitAttributions.values()).filter(ca => ca.verified).length

    return {
      totalAttributions: this.attributions.size,
      commitAttributions: this.commitAttributions.size,
      verifiedCommits: verified,
      totalAuthors: authors.size,
      totalCoAuthors: coAuthors.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.attributions.clear()
    this.commitAttributions.clear()
    this.attributionCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const attributionService = new AttributionService()

export default attributionService