"use strict";

class Rules {
  constructor() {
    this.rules = [];
  }

  setWorkflowFailures(failureActions) {
    this.workflowFailures = failureActions;
    this.rules.push(...failureActions);
  }

  setStepFailures(failureActions) {
    this.stepFailures = failureActions;
    this.rules.push(...failureActions);
  }

  buildFailureRules() {
    this.rules.reverse();
  }
}

module.exports = Rules;
