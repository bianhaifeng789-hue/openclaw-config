// @ts-nocheck
class TeamDiscovery {
    teams = new Map();
    members = new Map();
    teamCounter = 0;
    /**
     * Create team
     */
    createTeam(name, members) {
        const id = `team-${++this.teamCounter}-${Date.now()}`;
        const team = {
            id,
            name,
            members,
            createdAt: Date.now()
        };
        this.teams.set(id, team);
        return team;
    }
    /**
     * Add member
     */
    addMember(id, name, email, role) {
        const member = {
            id,
            name,
            email,
            role,
            status: 'online',
            lastActive: Date.now()
        };
        this.members.set(id, member);
        return member;
    }
    /**
     * Get team
     */
    getTeam(id) {
        return this.teams.get(id);
    }
    /**
     * Get member
     */
    getMember(id) {
        return this.members.get(id);
    }
    /**
     * Get team members
     */
    getTeamMembers(teamId) {
        const team = this.teams.get(teamId);
        if (!team)
            return [];
        return team.members
            .map(id => this.members.get(id))
            .filter(m => m !== undefined);
    }
    /**
     * Add member to team
     */
    addToTeam(teamId, memberId) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        if (!team.members.includes(memberId)) {
            team.members.push(memberId);
        }
        return true;
    }
    /**
     * Remove from team
     */
    removeFromTeam(teamId, memberId) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        const index = team.members.indexOf(memberId);
        if (index === -1)
            return false;
        team.members.splice(index, 1);
        return true;
    }
    /**
     * Update member status
     */
    updateMemberStatus(id, status) {
        const member = this.members.get(id);
        if (!member)
            return false;
        member.status = status;
        member.lastActive = Date.now();
        return true;
    }
    /**
     * Find member by email
     */
    findByEmail(email) {
        return Array.from(this.members.values())
            .find(m => m.email === email);
    }
    /**
     * Get online members
     */
    getOnlineMembers() {
        return Array.from(this.members.values())
            .filter(m => m.status === 'online');
    }
    /**
     * Get teams by member
     */
    getTeamsByMember(memberId) {
        return Array.from(this.teams.values())
            .filter(t => t.members.includes(memberId));
    }
    /**
     * Get stats
     */
    getStats() {
        const teams = Array.from(this.teams.values());
        const avgSize = teams.length > 0
            ? teams.reduce((sum, t) => sum + t.members.length, 0) / teams.length
            : 0;
        return {
            teamsCount: teams.length,
            membersCount: this.members.size,
            onlineMembers: this.getOnlineMembers().length,
            averageTeamSize: avgSize
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.teams.clear();
        this.members.clear();
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
export const teamDiscovery = new TeamDiscovery();
export default teamDiscovery;
//# sourceMappingURL=team-discovery.js.map