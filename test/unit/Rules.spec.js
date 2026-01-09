"use strict";

const expect = require("chai").expect;

const Rules = require("../../src/Rules");

describe(`Rules`, function () {
  it(`constructor`, function () {
    const expected = new Rules();

    expect(expected).to.be.an.instanceOf(Rules);
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
    });
  });
});
