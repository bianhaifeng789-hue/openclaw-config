// @ts-nocheck
class TeamHelpers {
    teams = new Map();
    teamCounter = 0;
    /**
     * Create team
     */
    createTeam(name, leaderId) {
        const id = `team-${++this.teamCounter}-${Date.now()}`;
        const team = {
            id,
            name,
            leaderId,
            members: [leaderId],
            createdAt: Date.now()
        };
        this.teams.set(id, team);
        return team;
    }
    /**
     * Add member
     */
    addMember(teamId, memberId) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        if (!team.members.includes(memberId)) {
            team.members.push(memberId);
        }
        return true;
    }
    /**
     * Remove member
     */
    removeMember(teamId, memberId) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        if (memberId === team.leaderId)
            return false;
        const index = team.members.indexOf(memberId);
        if (index === -1)
            return false;
        team.members.splice(index, 1);
        return true;
    }
    /**
     * Get team
     */
    getTeam(teamId) {
        return this.teams.get(teamId);
    }
    /**
     * Get team by leader
     */
    getByLeader(leaderId) {
        return Array.from(this.teams.values())
            .find(t => t.leaderId === leaderId) ?? null;
    }
    /**
     * Get teams by member
     */
    getByMember(memberId) {
        return Array.from(this.teams.values())
            .filter(t => t.members.includes(memberId));
    }
    /**
     * Is leader
     */
    isLeader(teamId, memberId) {
        const team = this.teams.get(teamId);
        return team?.leaderId === memberId;
    }
    /**
     * Is member
     */
    isMember(teamId, memberId) {
        const team = this.teams.get(teamId);
        return team?.members.includes(memberId) ?? false;
    }
    /**
     * Transfer leadership
     */
    transferLeadership(teamId, newLeaderId) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        if (!team.members.includes(newLeaderId))
            return false;
        team.leaderId = newLeaderId;
        return true;
    }
    /**
     * Get team size
     */
    getTeamSize(teamId) {
        const team = this.teams.get(teamId);
        return team?.members.length ?? 0;
    }
    /**
     * Get all teams
     */
    getAllTeams() {
        return Array.from(this.teams.values());
    }
    /**
     * Delete team
     */
    deleteTeam(teamId) {
        return this.teams.delete(teamId);
    }
    /**
     * Get stats
     */
    getStats() {
        const teams = Array.from(this.teams.values());
        const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
        const avgSize = teams.length > 0 ? totalMembers / teams.length : 0;
        const largest = Math.max(...teams.map(t => t.members.length), 0);
        return {
            teamsCount: teams.length,
            totalMembers,
            averageTeamSize: avgSize,
            largestTeam: largest
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.teams.clear();
        this.teamCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teamHelpers = new TeamHelpers();
export default teamHelpers;
//# sourceMappingURL=team-helpers.js.map