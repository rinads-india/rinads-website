/** Local preferences personalise copy; they are not evidence of business data. */
export function rinpoGreeting(authenticated: boolean, username: string): string {
  if (!authenticated || username === "Guest" || !username.trim()) {
    return "Welcome to RINADS. What would you like to do?";
  }
  return `Hello ${username.trim()}! What would you like to work on?`;
}

export function rinpoGuidance(role: string, favourites: readonly string[]): string {
  if (role === "client") {
    return "Open your client workspace to check deliverables and review requests.";
  }
  if (role === "staff") {
    return "Open your organisation workspace to check assigned work and customer follow-ups.";
  }
  if (favourites.includes("AI Automation")) {
    return "Start with one repeatable task. RINPO can help you plan the workflow and its approval steps.";
  }
  if (favourites.includes("Digital Marketing")) {
    return "Choose a campaign goal, audience and budget before planning your next marketing activity.";
  }
  return "Ask RINPO about customers, work, commerce or growth to find your next step.";
}
