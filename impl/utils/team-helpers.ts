// @ts-nocheck

/**
 * Team Helpers Pattern - 团队辅助
 * 
 * Source: Claude Code utils/swarm/teamHelpers.ts
 * Pattern: team helpers + utility functions + team operations
 */

interface TeamInfo {
  id: string
  name: string
  leaderId: string
  members: string[]
  createdAt: number
}

class TeamHelpers {
  private teams = new Map<string, TeamInfo>()
  private teamCounter = 0

  /**
   * Create team
   */
  createTeam(name: string, leaderId: string): TeamInfo {
    const id = `team-${++this.teamCounter}-${Date.now()}`

    const team: TeamInfo = {
      id,
      name,
      leaderId,
      members: [leaderId],
      createdAt: Date.now()
    }

    this.teams.set(id, team)

    return team
  }

  /**
   * Add member
   */
  addMember(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (!team.members.includes(memberId)) {
      team.members.push(memberId)
    }

    return true
  }

  /**
   * Remove member
   */
  removeMember(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (memberId === team.leaderId) return false

    const index = team.members.indexOf(memberId)
    if (index === -1) return false

    team.members.splice(index, 1)

    return true
  }

  /**
   * Get team
   */
  getTeam(teamId: string): TeamInfo | undefined {
    return this.teams.get(teamId)
  }

  /**
   * Get team by leader
   */
  getByLeader(leaderId: string): TeamInfo | null {
    return Array.from(this.teams.values())
      .find(t => t.leaderId === leaderId) ?? null
  }

  /**
   * Get teams by member
   */
  getByMember(memberId: string): TeamInfo[] {
    return Array.from(this.teams.values())
      .filter(t => t.members.includes(memberId))
  }

  /**
   * Is leader
   */
  isLeader(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    return team?.leaderId === memberId
  }

  /**
   * Is member
   */
  isMember(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    return team?.members.includes(memberId) ?? false
  }

  /**
   * Transfer leadership
   */
  transferLeadership(teamId: string, newLeaderId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (!team.members.includes(newLeaderId)) return false

    team.leaderId = newLeaderId

    return true
  }

  /**
   * Get team size
   */
  getTeamSize(teamId: string): number {
    const team = this.teams.get(teamId)
    return team?.members.length ?? 0
  }

  /**
   * Get all teams
   */
  getAllTeams(): TeamInfo[] {
    return Array.from(this.teams.values())
  }

  /**
   * Delete team
   */
  deleteTeam(teamId: string): boolean {
    return this.teams.delete(teamId)
  }

  /**
   * Get stats
   */
  getStats(): {
    teamsCount: number
    totalMembers: number
    averageTeamSize: number
    largestTeam: number
  } {
    const teams = Array.from(this.teams.values())
    const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0)
    const avgSize = teams.length > 0 ? totalMembers / teams.length : 0
    const largest = Math.max(...teams.map(t => t.members.length), 0)

    return {
      teamsCount: teams.length,
      totalMembers,
      averageTeamSize: avgSize,
      largestTeam: largest
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.teams.clear()
    this.teamCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teamHelpers = new TeamHelpers()

export default teamHelpers