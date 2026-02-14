import type { ToolDefinition } from '../types';

export interface ScheduleMeetingInput {
  customerEmail: string;
  preferredTimes: string[];
  meetingType: 'demo' | 'follow-up' | 'closing';
}

export interface ScheduledMeeting {
  meetingLink?: string;
  scheduledTime?: string;
}

export const scheduleMeetingTool: ToolDefinition<ScheduleMeetingInput, ScheduledMeeting> = {
  id: 'schedule-meeting',
  description: 'Schedule a follow-up meeting on calendar',
  execute: async (input) => {
    // TODO: Integrate Google Calendar/Microsoft Graph to schedule meeting.
    void input;
    return {};
  },
};
