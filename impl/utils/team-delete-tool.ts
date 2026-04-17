// @ts-nocheck

/**
 * Team Delete Tool Pattern - 团队删除工具
 * 
 * Source: Claude Code tools/TeamDeleteTool/TeamDeleteTool.ts
 * Pattern: team deletion + cleanup + member removal + archive
 */

interface TeamDeleteResult {
  teamId: string
  deleted: boolean
  reason: string
  timestamp: number
  archived?: boolean
}

class TeamDeleteTool {
  private deleteHistory: TeamDeleteResult[] = []
  private archivedTeams = new Map<string, Team>()

  /**
   * Delete team
   */
  delete(teamId: string, archive?: boolean): TeamDeleteResult {
    const team = teamCreateTool.getTeam(teamId)

    const result: TeamDeleteResult = {
      teamId,
      deleted: false,
      reason: '',
      timestamp: Date.now(),
      archived: archive ?? false
    }

    if (!team) {
      result.reason = 'Team not found'
      this.deleteHistory.push(result)
      return result
    }

    // Archive if requested
    if (archive) {
      this.archivedTeams.set(teamId, team)
      result.archived = true
    }

    // Delete team
    const deleted = teamCreateTool.deleteTeam(teamId)
    result.deleted = deleted
    result.reason = deleted ? 'Team deleted successfully' : 'Failed to delete team'

    this.deleteHistory.push(result)

    return result
  }

  /**
   * Force delete
   */
  forceDelete(teamId: string): TeamDeleteResult {
    return this.delete(teamId, false)
  }

  /**
   * Archive team
   */
  archive(teamId: string): TeamDeleteResult {
    return this.delete(teamId, true)
  }

  /**
   * Restore archived team
   */
  restore(teamId: string): boolean {
    const archived = this.archivedTeams.get(teamId)
    if (!archived) return false

    // Would restore team
    // For demo, just remove from archive
    this.archivedTeams.delete(teamId)

    return true
  }

  /**
   * Get archived team
   */
  getArchived(teamId: string): Team | undefined {
    return this.archivedTeams.get(teamId)
  }

  /**
   * Get all archived
   */
  getAllArchived(): Team[] {
    return Array.from(this.archivedTeams.values())
  }

  /**
   * Get delete history
   */
  getHistory(): TeamDeleteResult[] {
    return [...this.deleteHistory]
  }

  /**
   * Get history for team
   */
  getHistoryForTeam(teamId: string): TeamDeleteResult[] {
    return this.deleteHistory.filter(d => d.teamId === teamId)
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.deleteHistory = []
  }

  /**
   * Clear archived
   */
  clearArchived(): void {
    this.archivedTeams.clear()
  }

  /**
   * Get stats
   */
  getStats(): {
    deletesCount: number
    successfulDeletes: number
    archivedCount: number
    restoredCount: number
  } {
    const successful = this.deleteHistory.filter(d => d.deleted)
    const archived = this.deleteHistory.filter(d => d.archived)

    return {
      deletesCount: this.deleteHistory.length,
      successfulDeletes: successful.length,
      archivedCount: archived.length,
      restoredCount: 0 // Would track restores
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
    this.clearArchived()
  }
}

// Global singleton
export const teamDeleteTool = new TeamDeleteTool()

// Import Team type
import { Team, teamCreateTool } from './team-create-tool'

// Add deleteTeam method to teamCreateTool if not exists
(teamCreateTool as any).deleteTeam = function(id: string): boolean {
  return this.teams.delete(id)
}

export default teamDeleteTool