"use strict";

const expect = require("chai").expect;
const sinon = require("sinon");

const ArazzoGenerator = require("../../src/ArazzoGenerator.js");

const mockArazzo = require("../mocks/arazzoMock.json");
const mockArazzoEvents = require("../mocks/arazzoMockEvents.json");
const mockEvents = require("../mocks/mockEvents.json");
const sls = require("../mocks/sls.js");

describe(`Arazzo Generator`, function () {
  const options = {
    arazzo: "1.0.1",
    sourceFile: "./openapi.json",
    sls,
  };

  describe(`constructor`, function () {
    it(`generate an instance of Arazzo Generator`, function () {
      const expected = new ArazzoGenerator(mockArazzo, options);

      expect(expected).to.be.instanceOf(ArazzoGenerator);
      expect(expected).to.have.property("arazzo");
      expect(expected.arazzo).to.have.property("arazzo");
    });
  });

  describe(`parse`, function () {
    it(`generates an expected azarro specification from configuration on the custom property`, function () {
      const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property(
        "title",
        "Arazzo Pet Store",
      );
      expect(azarroGenerator.arazzo.sourceDescriptions).to.be.an("array");
      expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(1);
      expect(azarroGenerator.arazzo.workflows).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows).to.have.lengthOf(1);
      expect(azarroGenerator.arazzo.workflows[0]).to.have.property("steps");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.have.lengthOf(1);
    });

    it(`generates an expected azarro specification from configuration on the functions property`, function () {
      const azarroGenerator = new ArazzoGenerator(mockArazzoEvents, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property(
        "title",
        "Arazzo Pet Store",
      );
      expect(azarroGenerator.arazzo.sourceDescriptions).to.be.an("array");
      expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(1);
      expect(azarroGenerator.arazzo.workflows).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows).to.have.lengthOf(1);
      expect(azarroGenerator.arazzo.workflows[0]).to.have.property("steps");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.have.lengthOf(1);
    });
  });

  describe(`generateInfo`, function () {
    it(`Uses the serverless service as the title if not defined`, function () {
      const infoTestingMock = structuredClone(mockArazzo);
      delete infoTestingMock.info.title;

      const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property("title", "Test API");
    });

    it(`does not generate a description if not defined`, function () {
      const infoTestingMock = structuredClone(mockArazzo);
      delete infoTestingMock.info.description;

      const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.not.have.property("description");
    });

    it(`does not generate a sumamry if not defined`, function () {
      const infoTestingMock = structuredClone(mockArazzo);
      delete infoTestingMock.info.summary;

      const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property("summary");
    });

    it(`uses a UUID of a version is not defined`, function () {
      const infoTestingMock = structuredClone(mockArazzo);
      delete infoTestingMock.info.version;
      const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property("version");
    });

    it(`extends the info definition when extended properties are passed in`, function () {
      const infoTestingMock = structuredClone(mockArazzo);
      infoTestingMock.info["x-extended-test"] = "extended test";
      const azarroGenerator = new ArazzoGenerator(infoTestingMock, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.info).to.have.property("x-extended-test");
    });
  });

  describe(`generateSourceDescriptions`, function () {
    it(`generates a default sourceDescription`, function () {
      const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo).to.have.property("sourceDescriptions");
    });

    it(`generates a default sourceDescription with user provided ones when documented`, function () {
      const sourceDescriptionTestingMock = structuredClone(mockArazzo);
      sourceDescriptionTestingMock.sourceDescriptions = [
        {
          name: "LoginOpenAPI",
          url: "./login-openapi.json",
          type: "openapi",
        },
      ];
      const azarroGenerator = new ArazzoGenerator(
        sourceDescriptionTestingMock,
        options,
      );

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo).to.have.property("sourceDescriptions");
      expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(2);
    });

    it(`generates a default sourceDescription with user provided ones when documented with extended fields`, function () {
      const sourceDescriptionTestingMock = structuredClone(mockArazzo);
      sourceDescriptionTestingMock.sourceDescriptions = [
        {
          name: "LoginOpenAPI",
          url: "./login-openapi.json",
          type: "openapi",
          "x-extended-field": "extended test",
        },
      ];
      const azarroGenerator = new ArazzoGenerator(
        sourceDescriptionTestingMock,
        options,
      );

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo).to.have.property("sourceDescriptions");
      expect(azarroGenerator.arazzo.sourceDescriptions).to.have.lengthOf(2);

      let hasExtendedField = false;
      for (const sourceDescription of azarroGenerator.arazzo
        .sourceDescriptions) {
        if (sourceDescription.hasOwnProperty("x-extended-field")) {
          hasExtendedField = true;
        }
      }

      expect(hasExtendedField).to.be.true;
    });
  });

  describe(`generateWorkflows`, function () {
    it(`generates the expected workflows`, function () {
      const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo).to.have.property("workflows");
      expect(azarroGenerator.arazzo.workflows).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0]).to.have.property("steps");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
    });

    it(`generates the expected steps`, function () {
      const azarroGenerator = new ArazzoGenerator(mockArazzo, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.have.lengthOf(1);
      const expectedStep = azarroGenerator.arazzo.workflows[0].steps[0];
      expect(expectedStep).to.have.property("successCriteria");
      expect(expectedStep).to.have.property("outputs");
      expect(expectedStep.outputs).to.have.property("token");
    });

    it(`generates the expected steps in the correct order when using event configuration`, function () {
      const getAllFunctionsStub = sinon
        .stub(sls.service, "getAllFunctions")
        .returns(["getPet", "login"]);
      const getFunctionStub = sinon
        .stub(sls.service, "getFunction")
        .onFirstCall()
        .returns(mockEvents[0])
        .onSecondCall()
        .returns(mockEvents[1]);

      const azarroGenerator = new ArazzoGenerator(mockArazzoEvents, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.have.lengthOf(2);
      let expectedStep = azarroGenerator.arazzo.workflows[0].steps[0];
      expect(expectedStep).to.have.property("requestBody");
      expect(expectedStep).to.not.have.property("stepNumber");
      expectedStep = azarroGenerator.arazzo.workflows[0].steps[1];
      expect(expectedStep).to.have.property("parameters");
      expect(expectedStep).to.not.have.property("stepNumber");

      getAllFunctionsStub.restore();
      getFunctionStub.restore();
    });

    it(`generates the expected steps in the correct order when using event configuration and ignore unviable operations`, function () {
      const mockEventsWithUnviableOperations = structuredClone(mockEvents);
      Object.assign(mockEventsWithUnviableOperations.at(1).events.at(0), {
        sqs: { arn: "abc", enabled: true },
      });

      const getAllFunctionsStub = sinon
        .stub(sls.service, "getAllFunctions")
        .returns(["getPet", "login"]);
      const getFunctionStub = sinon
        .stub(sls.service, "getFunction")
        .onFirstCall()
        .returns(mockEvents[0])
        .onSecondCall()
        .returns(mockEvents[1]);

      const azarroGenerator = new ArazzoGenerator(mockArazzoEvents, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo.workflows[0].steps).to.be.an("array");
      expect(azarroGenerator.arazzo.workflows[0].steps).to.have.lengthOf(2);
      let expectedStep = azarroGenerator.arazzo.workflows[0].steps[0];
      expect(expectedStep).to.have.property("requestBody");
      expectedStep = azarroGenerator.arazzo.workflows[0].steps[1];
      expect(expectedStep).to.have.property("parameters");

      getAllFunctionsStub.restore();
      getFunctionStub.restore();
    });

    xit(`throws an error when an inputs schema is invalid`, function () {
      const invalidSchemaTest = structuredClone(mockArazzo);
      invalidSchemaTest.workflows[0].inputs = {
        typpes: "object",
        properties: { string: { type: "string" } },
      };

      const azarroGenerator = new ArazzoGenerator(invalidSchemaTest, options);

      azarroGenerator.parse();

      expect(azarroGenerator.arazzo).to.have.property("workflows");
    });
  });
});
