// @ts-nocheck

/**
 * Team Discovery Pattern - 团队发现
 * 
 * Source: Claude Code utils/teamDiscovery.ts + utils/swarm/teamHelpers.ts
 * Pattern: team discovery + member lookup + team management
 */

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'online' | 'offline' | 'busy'
  lastActive: number
}

interface Team {
  id: string
  name: string
  members: string[]
  createdAt: number
}

class TeamDiscovery {
  private teams = new Map<string, Team>()
  private members = new Map<string, TeamMember>()
  private teamCounter = 0

  /**
   * Create team
   */
  createTeam(name: string, members: string[]): Team {
    const id = `team-${++this.teamCounter}-${Date.now()}`

    const team: Team = {
      id,
      name,
      members,
      createdAt: Date.now()
    }

    this.teams.set(id, team)

    return team
  }

  /**
   * Add member
   */
  addMember(id: string, name: string, email: string, role: string): TeamMember {
    const member: TeamMember = {
      id,
      name,
      email,
      role,
      status: 'online',
      lastActive: Date.now()
    }

    this.members.set(id, member)

    return member
  }

  /**
   * Get team
   */
  getTeam(id: string): Team | undefined {
    return this.teams.get(id)
  }

  /**
   * Get member
   */
  getMember(id: string): TeamMember | undefined {
    return this.members.get(id)
  }

  /**
   * Get team members
   */
  getTeamMembers(teamId: string): TeamMember[] {
    const team = this.teams.get(teamId)
    if (!team) return []

    return team.members
      .map(id => this.members.get(id))
      .filter(m => m !== undefined) as TeamMember[]
  }

  /**
   * Add member to team
   */
  addToTeam(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    if (!team.members.includes(memberId)) {
      team.members.push(memberId)
    }

    return true
  }

  /**
   * Remove from team
   */
  removeFromTeam(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId)
    if (!team) return false

    const index = team.members.indexOf(memberId)
    if (index === -1) return false

    team.members.splice(index, 1)

    return true
  }

  /**
   * Update member status
   */
  updateMemberStatus(id: string, status: TeamMember['status']): boolean {
    const member = this.members.get(id)
    if (!member) return false

    member.status = status
    member.lastActive = Date.now()

    return true
  }

  /**
   * Find member by email
   */
  findByEmail(email: string): TeamMember | undefined {
    return Array.from(this.members.values())
      .find(m => m.email === email)
  }

  /**
   * Get online members
   */
  getOnlineMembers(): TeamMember[] {
    return Array.from(this.members.values())
      .filter(m => m.status === 'online')
  }

  /**
   * Get teams by member
   */
  getTeamsByMember(memberId: string): Team[] {
    return Array.from(this.teams.values())
      .filter(t => t.members.includes(memberId))
  }

  /**
   * Get stats
   */
  getStats(): {
    teamsCount: number
    membersCount: number
    onlineMembers: number
    averageTeamSize: number
  } {
    const teams = Array.from(this.teams.values())
    const avgSize = teams.length > 0
      ? teams.reduce((sum, t) => sum + t.members.length, 0) / teams.length
      : 0

    return {
      teamsCount: teams.length,
      membersCount: this.members.size,
      onlineMembers: this.getOnlineMembers().length,
      averageTeamSize: avgSize
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.teams.clear()
    this.members.clear()
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
export const teamDiscovery = new TeamDiscovery()

export default teamDiscovery