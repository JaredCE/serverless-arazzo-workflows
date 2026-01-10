"use strict";

const { parse, test } = require("@swaggerexpert/arazzo-runtime-expression");
const jp = require("jsonpath");
const traverse = require("traverse");

const path = require("node:path");

const Document = require("./Document");
const docFactory = require("./DocFactory");
const Expression = require("./Expression");
const Rules = require("./Rules");

class MatrixParams {
  constructor(matrixString = "") {
    this.params = new Map();
    if (matrixString.startsWith(";")) {
      this._parse(matrixString);
    }
  }

  // Parse matrix string into Map
  _parse(matrixString) {
    const pairs = matrixString.split(";").filter(Boolean);
    for (const pair of pairs) {
      const [key, value = ""] = pair.split("=");
      if (key) {
        this.params.set(decodeURIComponent(key), decodeURIComponent(value));
      }
    }
  }

  // Get a parameter value
  get(key) {
    return this.params.get(key) || null;
  }

  // Set or update a parameter
  set(key, value) {
    this.params.set(String(key), String(value));
  }

  // Delete a parameter
  delete(key) {
    this.params.delete(key);
  }

  // Check if a parameter exists
  has(key) {
    return this.params.has(key);
  }

  // Convert back to matrix string
  toString() {
    return Array.from(this.params.entries())
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join(";")
      .replace(/^/, ";"); // Ensure leading semicolon
  }
}

class LabelParams {
  constructor(labelString = "") {
    this.params = new Map();
  }

  // Get a parameter value
  get(key) {
    return this.params.get(key) || null;
  }

  // Set or update a parameter
  set(key, value) {
    this.params.set(String(key), String(value));
  }

  // Delete a parameter
  delete(key) {
    this.params.delete(key);
  }

  // Check if a parameter exists
  has(key) {
    return this.params.has(key);
  }

  toString(value) {
    const encode = (v) => encodeURIComponent(v).replace(/%20/g, "%20"); // strict encoding
    if (Array.isArray(value)) {
      return "." + value.map(encode).join(".");
    }
    return "." + encode(value);
  }
}

class Arazzo extends Document {
  constructor(url, name, options) {
    super(url, name, options);

    this.type = "arazzo";
    this.outputs = {};
    this.loadedSourceDescriptions = {};
    this.expression = new Expression();
    // this.pathToArazzoSpecification = path.resolve(arazzoPath);
    this.stepRunRules = {};
    this.workflowRunRules = {};
  }

  setMainArazzo() {
    this.filePath = path.resolve(this.url);
  }

  async runWorkflows(inputFile) {
    this.inputFile = inputFile;
    await this.getSourceDescriptions();
    await this.getWorkflows();

    await this.startWorkflows();

    console.log("all workflows run");
  }

  async startWorkflows(index = 0) {
    this.abortWorkflowController = new AbortController();

    this.workflowIndex = index;
    console.log("running  workflow index", index);
    if (index <= this.workflows.length - 1) {
      await this.runWorkflow(index).catch((err) => {
        if (err.name === "AbortError") {
        } else {
          throw err;
        }
      });

      await this.startWorkflows(index + 1);
    } else {
      console.log("no more workflows");
    }
    // this.workflowIndex = index;
    // const continueRunning = await this.runWorkflow(index);

    // if (continueRunning.noMoreWorkflows === false) {
    //   await this.startWorkflows(index + 1);
    // }
  }

  async runWorkflow(index) {
    if (this.abortWorkflowController.signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const rules = new Rules(this.expression);
    const workflow = await this.JSONPickerToIndex("workflows", index);

    if (workflow) {
      this.logger.notice(`Running Workflow: ${workflow.workflowId}`);

      this.inputs = await this.inputFile.getWorkflowInputs(
        workflow.workflowId,
        workflow.inputs,
      );
      this.expression.addToContext("inputs", this.inputs);

      this.workflow = workflow;
      this.workflow.rules = rules;

      if (this.workflow.onSuccess) {
        this.workflow.rules.setWorkflowSuccess(this.workflow.onSuccess);
      }

      await this.runSteps();

      if (this.workflow.outputs) {
        const outputs = {};
        for (const key in this.workflow.outputs) {
          const value = this.expression.resolveExpression(
            this.workflow.outputs[key],
          );
          Object.assign(outputs, { [key]: value });
        }
        this.expression.addToContext("workflows", {
          [this.workflow.workflowId]: { outputs: outputs },
        });
      }

      return { noMoreWorkflows: false };
    } else {
      this.logger.notice(`All workflows have run`);

      return { noMoreWorkflows: true };
    }
  }

  async runStepByIdFromRetry(stepId) {
    const stepIndex = this.workflow.steps.findIndex(
      (step) => step.stepId === stepId,
    );

    return await this.runStep(stepIndex);
  }

  async runSteps(index = 0) {
    if (this.abortWorkflowController.signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    this.stepIndex = index;
    if (index <= this.workflow?.steps?.length - 1) {
      await this.runStep(index);
      await this.runSteps(index + 1);
    }

    // console.log("no steps to run");
    // const contineuRunning = await this.runStep(index);

    // if (contineuRunning.noMoreSteps === false) {
    //   await this.runSteps(index + 1);
    // }
  }

  async runStep(index) {
    const step = this.workflow.steps[index];

    if (step) {
      this.step = step;
      console.log(`running step: ${step.stepId}`);
      if (this.step.onSuccess) {
        this.workflow.rules.setStepSuccesses(this.step.onSuccess);
      }

      this.logger.notice(`Running Step: ${this.step.stepId}`);

      await this.loadOperationData();

      if (this.openAPISteps) {
        await this.runOpenAPIStep();
      }

      return { noMoreSteps: false };
    } else {
      this.logger.notice(`All steps in ${this.workflow.workflowId} have run`);

      return { noMoreSteps: true };
    }
  }

  async runOpenAPIStep() {
    this.operations = await this.sourceDescriptionFile.buildOperation(
      this.inputs,
      this.step,
    );

    this.mapInputs();

    await this.runOperation();
  }

  async runOperation(retry = 0, retryAfter = 0) {
    const sleep = function (ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    for (const operation of this.operations) {
      let url = operation.url;

      if (operation.queryParams.size) {
        url += `?${operation.queryParams}`;
      }

      const options = {
        method: operation.operation,
        headers: operation.headers,
      };

      if (operation.data) {
        options.body = operation.data;
      }

      this.logger.notice(
        `Making a ${operation.operation.toUpperCase()} call to ${operation.url}`,
      );

      const response = await fetch(url, options);

      this.addParamsToContext(response.headers, "headers", "response");
      this.expression.addToContext("statusCode", response.status);

      await this.dealWithResponse(response);
      // if (response.ok === false) {
      //     this.logger.error(`Call to ${operation.operation.toUpperCase()} ${operation.url} failed`);

      //     if (retry > 0) {
      //         let retryCount = retry--;
      //         this.logger.notice(`Making attempt number: ${retryCount}`);
      //         let retryAfterSeconds = retryAfter;
      //         if (response.headers.has('retry-after')) {
      //             retryAfterSeconds = response.headers['retry-after'];
      //         }

      //         if (retryAfterSeconds > 0) {
      //             await sleep(retryAfterSeconds*1000);
      //         }

      //         await this.runOperation(retryCount, retryAfterSeconds);
      //     } else {
      //         throw new Error(`Call to ${operation.operation.toUpperCase()} ${operation.url} failed with a ${response.status}`);
      //     }
      // }

      // if (this.step.successCriteria) {
      //     const hasMatchedSuccessCriteria = await this.determineSuccessCriteria(response);

      //     if (hasMatchedSuccessCriteria) {
      //         this.logger.success(`Making a ${operation.operation.toUpperCase()} call to ${operation.url} matched all the successCriteria`);
      //     }
      // }

      // if (this.step.outputs) {

      // }
    }
  }

  async dealWithResponse(response) {
    this.doNotProcessStep = false;
    this.alreadyProcessingOnFailure = false;

    if (this.step.successCriteria) {
      if (this.step.successCriteria) {
        const passedSuccessCriteria = this.hasPassedSuccessCriteria();

        if (passedSuccessCriteria) {
          await this.dealWithPassedRule(response);
        } else {
          if (this.step.onFailure) {
            await this.dealWithFailedResponse();
          } else {
            throw new Error(
              `${this.step.stepId} step of the ${this.workflow.workflowId} workflow failed the successCriteria`,
            );
          }
        }
      }
    } else {
      if (this.step?.outputs) {
        await this.dealWithStepOutputs(response);
      }
    }
  }

  hasPassedSuccessCriteria() {
    const hasPassed = [];
    for (const criteriaObject of this.step.successCriteria) {
      if (criteriaObject?.type) {
      } else {
        const hasPassedCheck = this.expression.checkSimpleExpression(
          criteriaObject.condition,
        );
        if (hasPassedCheck) hasPassed.push(true);
      }
    }

    return hasPassed.length === this.step.successCriteria.length;
  }

  async dealWithPassedRule(response) {
    if (this.step?.outputs) {
      await this.dealWithStepOutputs(response);
    }

    const whatNext = this.workflow.rules.runRules(true);
    console.log(whatNext);
    if (whatNext.endWorkflow) {
      this.workflowIndex += 1;
      // const index = this.workflowIndex + 1;

      console.log("ending workflow");
      this.abortWorkflowController.abort();
      throw new DOMException("Aborted", "AbortError");
      console.log("still here though");
      // this.abortStep = new AbortController();
      // this.abortSignal = this.abortStep.signal;

      // this.startWorkflows(index);
      // this.abortSignal.addEventListener("abort", () => {
      //   console.log("in the listener");
      // });
      // console.log(this.abortSignal.aborted);
      // console.log("back here");
    } else if (whatNext.goto) {
      console.log("goto command");
      if (whatNext.stepId) {
        const stepIndex = this.workflow.steps.findIndex(
          (step) => step.stepId === whatNext.stepId,
        );

        if (stepIndex === -1) {
          throw new Error(`goto Step does not exist within current workflow`);
        }

        await this.runSteps(stepIndex);
      } else {
        const workflowId = this.expression.resolveExpression(
          whatNext.workflowId,
        );

        const workflowIndex = this.workflows.findIndex(
          (workflow) => workflow.workflowId === workflowId,
        );

        if (workflowIndex === -1) {
          throw new Error(
            `goto Workflow does not exist within current workflows`,
          );
        }

        // console.log(
        //   "is a run time?",
        //   this.expression.isARunTimeExpression(whatNext.workflowId),
        // );
        // console.log(whatNext.workflowId);
        // if (this.expression.isARunTimeExpression(whatNext.workflowId)) {
        //   const value = this.expression.resolveExpression(whatNext.workflowId);
        //   if (value) {
        //   }
        // } else {
        //   console.log("goto workflow");
        //   const workflowIndex = this.workflows.findIndex(
        //     (workflow) => workflow.workflowId === whatNext.workflowId,
        //   );

        //   if (!workflowIndex) {
        //     throw new Error(
        //       `goto Workflow does not exist within current workflows`,
        //     );
        //   }
        // }
      }
    }
  }

  async dealWithStepOutputs(response) {
    const json = await response.json().catch((err) => {
      console.error(err);
      this.logger.error(`Error trying to resolve ${this.step.stepId} outputs`);
      throw new Error(err);
    });

    this.expression.addToContext("response.body", json);

    const outputs = {};
    for (const key in this.step.outputs) {
      const value = this.expression.resolveExpression(this.step.outputs[key]);
      Object.assign(outputs, { [key]: value });
    }
    this.expression.addToContext("steps", {
      [this.step.stepId]: { outputs: outputs },
    });
  }

  async dealWithFailedResponse() {
    this.doNotProcessStep = false;
    this.alreadyProcessingOnFailure = true;
    for (const failureAction of this.step.onFailure) {
      if (failureAction.type === "end") {
        this.doNotProcessStep = true;
        break;
      } else if (failureAction.type === "retry") {
        if (failureAction.retryLimit) {
        }

        if (failureAction.retryAfter) {
        }

        if (failureAction.stepId) {
        } else if (failureAction.workflowId) {
        } else {
        }
      }
    }
  }

  mapInputs() {
    this.mapParameters();
    this.mapRequestBody();

    for (const operation of this.operations) {
      this.addParamsToContext(operation.headers, "headers", "request");
      this.addParamsToContext(operation.queryParams, "query", "request");
    }
  }

  mapParameters() {
    const headers = new Headers();
    const queryParams = new URLSearchParams();
    const pathParams = {};

    for (const param of this.step?.parameters || []) {
      const operationDetailParam =
        this.sourceDescription.operationDetails?.parameters
          .filter((obj) => obj.name === param.name && obj.in === param.in)
          .at(0);
      console.log(operationDetailParam);
      const value = this.expression.resolveExpression(param.value);

      switch (param.in) {
        case "header":
          headers.append(param.name, value);

          break;

        case "path":
          for (const operation of this.operations) {
            operation.url = operation.url.replace(`{${param.name}}`, value);
            Object.assign(pathParams, { [param.name]: value });
          }
          break;

        case "query":
          queryParams.append(param.name, value);
          break;
      }
    }

    this.expression.addToContext("request.path", pathParams);

    for (const operation of this.operations) {
      operation.headers = headers;
      operation.queryParams = queryParams;
    }
  }

  addParamsToContext(params, paramType, contextType) {
    const parameters = {};
    for (const [key, value] of params.entries()) {
      Object.assign(parameters, { [key]: value });
    }

    this.expression.addToContext(contextType, { [paramType]: parameters });
  }

  mapRequestBody() {
    if (this.step?.requestBody) {
      const payload = this.expression.resolveExpression(
        this.step.requestBody.payload,
      );

      for (const operation of this.operations) {
        if (this.step.requestBody.contentType) {
          operation.headers.append("accept", this.step.requestBody.contentType);
        }

        operation.data = payload;
      }

      // let payload;

      // if (this.isARuntimeExpression(this.step.requestBody.payload)) {
      //     if (this.step.requestBody.payload.startsWith('$inputs')) {
      //         payload = this.getValueByPath(this.inputs, this.step.requestBody.payload.slice(8))
      //     }
      // }

      // for (const operation of this.operations) {
      //     operation.data = payload;
      // }
    }
  }

  getValueByPath(obj, path, defaultValue = undefined) {
    if (typeof path !== "string" || !path.trim()) {
      throw new Error("Path must be a non-empty string.");
    }

    // Convert array indexes to dot notation: users[0].name -> users.0.name
    const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");

    // Split into keys
    const keys = normalizedPath.split(".");

    // Traverse the object
    let result = obj;
    for (const key of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    return result;
  }

  async loadOperationData() {
    this.sourceDescription = this.getOperationIdSourceDescription();

    if (!this.loadedSourceDescriptions[this.sourceDescription.name]) {
      this.logger.notice(
        `Getting Source Description for: ${this.sourceDescription.name}`,
      );

      this.sourceDescriptionFile = await docFactory.buildDocument(
        this.sourceDescription.type,
        this.sourceDescription.url,
        this.sourceDescription.name,
        { parser: this.parser, logger: this.logger },
      );

      Object.assign(this.loadedSourceDescriptions, {
        [this.sourceDescription.name]: true,
      });
    }

    if (this.isAnOperationId) {
      // this.logger.notice(`Getting OperationId: ${this.step.operationId}`);
      let operationId = this.step.operationId;
      operationId = operationId.split(".").at(-1);
      await this.sourceDescriptionFile.getOperationById(operationId);
    }
  }

  getOperationIdSourceDescription() {
    const operationOrWorkflowPointer = this.getOperationType();

    // if there's only one, then all pointers must point to this
    if (this.sourceDescriptions.length === 1) {
      return this.sourceDescriptions[0];
    } else {
      const operationOrWorkflowPointerArr =
        operationOrWorkflowPointer.split(".");
      const joinedoperationOrWorkflowPointer = `${operationOrWorkflowPointerArr[0]}.${operationOrWorkflowPointerArr[1]}`;
      const sourceDescription = this.expression.resolveExpression(
        joinedoperationOrWorkflowPointer,
      );

      if (sourceDescription) {
        return sourceDescription;
      }
    }

    // const sourceDescriptionName = this.expression.resolveExpression(operationOrWorkflowPointer);
    // console.log(sourceDescriptionName)
    // if (sourceDescriptionName) {
    //     // return sourceDescription;
    //     const sourceDescription = this.sourceDescriptions.filter(sourceDescription => sourceDescription.name === sourceDescriptionName);
    //     console.log(sourceDescription)
    //     if (sourceDescription.length === 1) {
    //         return sourceDescription;
    //     }
    // }

    // if (this.sourceDescriptions.length === 1) {
    //     return this.sourceDescriptions[0]
    // } else {
    //     console.log('here')
    //     const abc = this.expression.resolveExpression(operationOrWorkflowPointer);
    //     // console.log(abc);
    //     // return abc
    //     // if (this.isARuntimeExpression(operationOrWorkflowPointer)) {
    //     //     if (operationOrWorkflowPointer.startsWith("$sourceDescription")) {
    //     //         const sourceDescriptionName = operationOrWorkflowPointer.split('.').at(1)
    //     //         const sourceDescriptionArr = this.sourceDescriptions.filter((sourceDescription) => {
    //     //             if (sourceDescription.name === sourceDescriptionName) {
    //     //                 return sourceDescription
    //     //             }
    //     //         });

    //     //         if (sourceDescriptionArr.length === 1) {
    //     //             return sourceDescriptionArr.at(0);
    //     //         }
    //     //     }

    //     //     // const parseResult = parse(operationOrWorkflowPointer);
    //     //     // const parts = [];
    //     //     // parseResult.ast.translate(parts);
    //     //     // console.log(parts)
    //     //     // console.log(parseResult.ast.translate)
    //     // }
    //     // if (this.matchesExpectedRunTimeExpression(operationOrWorkflowPointer, '$sourceDescriptions.')) {
    //     //     const sourceDescription = this.sourceDescriptions.filter((sourceDescription) => {
    //     //         if (sourceDescription.name === operationOrWorkflowPointer.split('.')[1]) {
    //     //             return sourceDescription;
    //     //         }
    //     //     });
    //     //     if (sourceDescription.length === 1) {
    //     //         return sourceDescription;
    //     //     }
    //     // }
    // }

    throw new Error(
      `No known matching source description for ${this.step.operationId}`,
    );
  }

  getOperationType() {
    let operationOrWorkflowPointer;

    if (this.step.operationId) {
      operationOrWorkflowPointer = this.step.operationId;
      this.isAnOperationId = true;
      this.openAPISteps = true;
    } else if (this.step.workflowId) {
      operationOrWorkflowPointer = this.step.workflowId;
      this.isAWorkflowId = true;
    } else {
      operationOrWorkflowPointer = this.step.operationPath;
      this.isAnOperationPath = true;
      this.openAPISteps = true;
    }
    return operationOrWorkflowPointer;
  }

  isARuntimeExpression(runtimeExpression) {
    return test(runtimeExpression);
  }

  matchesExpectedRunTimeExpression(string, runtimeExpression) {
    const result = this.parser.parse(string, { peg$library: true });

    if (result.peg$success) {
      if (result.peg$result[0] === runtimeExpression) {
        return true;
      }
    }

    return false;
  }

  async getSourceDescriptions() {
    const pipeline = this.JSONPicker("sourceDescriptions", this.filePath);

    let sourceDescriptions = [];
    for await (const { value } of pipeline) {
      sourceDescriptions = value.flat();
    }

    if (sourceDescriptions.length === 0) {
      throw new Error("Missing Source Descriptions");
    }

    this.sourceDescriptions = sourceDescriptions;
    for (const sourceDescription of sourceDescriptions) {
      this.expression.addToContext("sourceDescriptions", {
        [sourceDescription.name]: {
          name: sourceDescription.name,
          url: sourceDescription.url,
          type: sourceDescription.type,
        },
      });
    }
    // console.log(this.expression.context)
    // this.expression.addToContext('sourceDescriptions', sourceDescriptions)
  }

  async getWorkflows() {
    const pipeline = this.JSONPicker("workflows", this.filePath);

    let workflows = [];
    for await (const { value } of pipeline) {
      workflows = value.flat();
    }

    if (workflows.length === 0) {
      throw new Error("Missing Workflows");
    }

    this.workflows = workflows;
  }
}

module.exports = Arazzo;
