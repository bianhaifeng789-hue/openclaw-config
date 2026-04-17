// @ts-nocheck
class TeamDeleteTool {
    deleteHistory = [];
    archivedTeams = new Map();
    /**
     * Delete team
     */
    delete(teamId, archive) {
        const team = teamCreateTool.getTeam(teamId);
        const result = {
            teamId,
            deleted: false,
            reason: '',
            timestamp: Date.now(),
            archived: archive ?? false
        };
        if (!team) {
            result.reason = 'Team not found';
            this.deleteHistory.push(result);
            return result;
        }
        // Archive if requested
        if (archive) {
            this.archivedTeams.set(teamId, team);
            result.archived = true;
        }
        // Delete team
        const deleted = teamCreateTool.deleteTeam(teamId);
        result.deleted = deleted;
        result.reason = deleted ? 'Team deleted successfully' : 'Failed to delete team';
        this.deleteHistory.push(result);
        return result;
    }
    /**
     * Force delete
     */
    forceDelete(teamId) {
        return this.delete(teamId, false);
    }
    /**
     * Archive team
     */
    archive(teamId) {
        return this.delete(teamId, true);
    }
    /**
     * Restore archived team
     */
    restore(teamId) {
        const archived = this.archivedTeams.get(teamId);
        if (!archived)
            return false;
        // Would restore team
        // For demo, just remove from archive
        this.archivedTeams.delete(teamId);
        return true;
    }
    /**
     * Get archived team
     */
    getArchived(teamId) {
        return this.archivedTeams.get(teamId);
    }
    /**
     * Get all archived
     */
    getAllArchived() {
        return Array.from(this.archivedTeams.values());
    }
    /**
     * Get delete history
     */
    getHistory() {
        return [...this.deleteHistory];
    }
    /**
     * Get history for team
     */
    getHistoryForTeam(teamId) {
        return this.deleteHistory.filter(d => d.teamId === teamId);
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.deleteHistory = [];
    }
    /**
     * Clear archived
     */
    clearArchived() {
        this.archivedTeams.clear();
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.deleteHistory.filter(d => d.deleted);
        const archived = this.deleteHistory.filter(d => d.archived);
        return {
            deletesCount: this.deleteHistory.length,
            successfulDeletes: successful.length,
            archivedCount: archived.length,
            restoredCount: 0 // Would track restores
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
        this.clearArchived();
    }
}
// Global singleton
export const teamDeleteTool = new TeamDeleteTool();
// Import Team type
import { teamCreateTool } from './team-create-tool';
// Add deleteTeam method to teamCreateTool if not exists
teamCreateTool.deleteTeam = function (id) {
    return this.teams.delete(id);
};
export default teamDeleteTool;
//# sourceMappingURL=team-delete-tool.js.map