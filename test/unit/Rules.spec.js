"use strict";

const expect = require("chai").expect;

const Rules = require("../../src/Rules");

describe(`Rules`, function () {
  it(`constructor`, function () {
    const expected = new Rules();

    expect(expected).to.be.an.instanceOf(Rules);
    expect(rules.rules).to.be.an("array");
    expect(rules.rules).to.have.lengthOf(0);
  });

  describe(`setWorkflowFailures`, function () {
    it(`should take a list of Workflow Failure Actions`, function () {
      const rules = new Rules();

      const onFailures = [
        {
          name: "404Failure",
          type: "end",
          criteria: [{ condition: "$statusCode == 404" }],
        },
      ];

      rules.setWorkflowFailures(onFailures);

      expect(rules).to.have.property("workflowFailures");
      expect(rules.workflowFailures).to.be.an("array");
      expect(rules.workflowFailures).to.have.lengthOf(1);
      expect(rules.rules).to.be.an("array");
      expect(rules.rules).to.have.lengthOf(1);
    });
  });

  describe(`setStepFailureActions`, function () {
    it(`should take a list of Step Failure Actions and combine with Workflow Failure Actions`, function () {
      const rules = new Rules();

      const workflowOnFailures = [
        {
          name: "404Failure",
          type: "end",
          criteria: [{ condition: "$statusCode == 404" }],
        },
      ];

      rules.setWorkflowFailures(workflowOnFailures);

      const stepOnFailures = [
        {
          name: "404Failure",
          type: "end",
          criteria: [{ condition: "$statusCode == 404" }],
        },
      ];

      rules.setStepFailures(workflowOnFailures);

      expect(rules).to.have.property("workflowFailures");
      expect(rules).to.have.property("stepFailures");
      expect(rules.workflowFailures).to.be.an("array");
      expect(rules.workflowFailures).to.have.lengthOf(1);
      expect(rules.stepFailures).to.be.an("array");
      expect(rules.stepFailures).to.have.lengthOf(1);
      expect(rules.rules).to.be.an("array");
      expect(rules.rules).to.have.lengthOf(2);
    });
  });
});
