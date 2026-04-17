// @ts-nocheck

/**
 * Team Create Tool Pattern - 团队创建工具
 * 
 * Source: Claude Code tools/TeamCreateTool/TeamCreateTool.ts
 * Pattern: team creation + group formation + team setup + member assignment
 */

interface Team {
  id: string
  name: string
  description: string
  leaderId: string
  members: string[]
  createdAt: number
  updatedAt: number
}

class TeamCreateTool {
  private teams = new Map<string, Team>()
  private teamCounter = 0

  /**
   * Create team
   */
  create(name: string, leaderId: string, description?: string): Team {
    const id = `team-${++this.teamCounter}-${Date.now()}`

    const team: Team = {
      id,
      name,
      description: description ?? '',
      leaderId,
      members: [leaderId],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.teams.set(id, team)

    return team
  }

  /**
   * Get team
   */
  getTeam(id: string): Team | undefined {
    return this.teams.get(id)
  }

  /**
   * Add member
   */
  addMember(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (!team.members.includes(memberId)) {
      team.members.push(memberId)
      team.updatedAt = Date.now()
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
    team.updatedAt = Date.now()

    return true
  }

  /**
   * Update leader
   */
  updateLeader(teamId: string, newLeaderId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (!team.members.includes(newLeaderId)) return false

    team.leaderId = newLeaderId
    team.updatedAt = Date.now()

    return true
  }

  /**
   * Update name
   */
  updateName(teamId: string, name: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    team.name = name
    team.updatedAt = Date.now()

    return true
  }

  /**
   * Update description
   */
  updateDescription(teamId: string, description: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    team.description = description
    team.updatedAt = Date.now()

    return true
  }

  /**
   * Get all teams
   */
  getAllTeams(): Team[] {
    return Array.from(this.teams.values())
  }

  /**
   * Get teams by member
   */
  getByMember(memberId: string): Team[] {
    return Array.from(this.teams.values())
      .filter(t => t.members.includes(memberId))
  }

  /**
   * Get teams by leader
   */
  getByLeader(leaderId: string): Team[] {
    return Array.from(this.teams.values())
      .filter(t => t.leaderId === leaderId)
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
export const teamCreateTool = new TeamCreateTool()

export default teamCreateTool