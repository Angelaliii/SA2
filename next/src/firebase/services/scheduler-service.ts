import { collaborationService } from './collaboration-service';

class SchedulerService {
  private deadlineCheckInterval: NodeJS.Timeout | null = null;

  // Start the collaboration deadline checker
  startDeadlineChecker() {
    if (this.deadlineCheckInterval) {
      return; // Already running
    }

    // Check deadlines every 24 hours
    this.deadlineCheckInterval = setInterval(async () => {
      try {
        await collaborationService.checkCollaborationDeadlines();
      } catch (error) {
        console.error('Failed to check collaboration deadlines:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run an initial check immediately
    collaborationService.checkCollaborationDeadlines().catch(error => {
      console.error('Failed to perform initial deadline check:', error);
    });
  }

  // Stop the deadline checker
  stopDeadlineChecker() {
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
      this.deadlineCheckInterval = null;
    }
  }
}

export const schedulerService = new SchedulerService();