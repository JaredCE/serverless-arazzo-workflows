'use strict';

const { parse, test } = require('@swaggerexpert/arazzo-runtime-expression');
const traverse = require('traverse');

const path = require('node:path')

const Document = require('./Document');
const docFactory = require('./DocFactory');

class Arazzo extends Document {
    constructor(url, name, options) {
        super(url, name, options);

        this.type = 'arazzo';
        this.outputs = {};
        // this.pathToArazzoSpecification = path.resolve(arazzoPath);

    }

    setMainArazzo() {
        this.filePath = path.resolve(this.url);
    }

    async runWorkflows(inputFile) {
        this.inputFile = inputFile;
        await this.getSourceDescriptions();
        await this.getWorkflows();

        await this.startWorkflows();
    }

    async startWorkflows(index = 0) {
        const continueRunning = await this.runWorkflow(index);
        if (continueRunning.noMoreWorkflows === false) {
            await this.startWorkflows(index+1);
        }
    }

    async runWorkflow(index) {
        const workflow = await this.JSONPickerToIndex('workflows', index);

        if (workflow) {
            this.logger.notice(`Running Workflow: ${workflow.workflowId}`);
            this.inputs = await this.inputFile.getWorkflowInputs(workflow.workflowId, workflow.inputs);
            this.workflow = workflow;
            await this.runSteps();
            return {noMoreWorkflows: false};
        }  else {
            this.logger.notice(`All workflows have run`);
            return {noMoreWorkflows: true};
        }
    }

    async runSteps(index = 0) {
        const contineuRunning = await this.runStep(index);

        if (contineuRunning.noMoreSteps === false) {
            await this.runSteps(index+1);
        }

    }

    async runStep(index) {
        const step = this.workflow.steps[index];
        if (step) {
            this.step = step;
            this.logger.notice(`Running Step: ${this.step.stepId}`);

            await this.loadOperationData();

            if (this.openAPISteps) {
                await this.runOpenAPIStep();
            }

            return {noMoreSteps: false};
        } else {
            this.logger.notice(`All steps in ${this.workflow.workflowId} have run`);
            return {noMoreSteps: true};
        }
    }

    async runOpenAPIStep() {
        this.operations = await this.sourceDescriptionFile.buildOperation(this.inputs, this.step);

        this.mapInputs();

        await this.runOperation();
    }

    async runOperation(retry = 0, retryAfter = 0) {
        const sleep  = function (ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        for (const operation of this.operations) {
            let url = operation.url;

            if (operation.queryParams.size) {
                url += `?${operation.queryParams}`
            }

            const options = {
                method: operation.operation,
                headers: operation.headers,
            }

            if (operation.data) {
                options.body = data;
            }

            this.logger.notice(`Making a ${operation.operation.toUpperCase()} call to ${operation.url}`);

            const response = await fetch(url, options);

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
        if (response.ok === false) {
            await this.dealWithFailedResponse(response);
        } else {
            // const passed = await this.dealWithSuccessfulResponse(response);

            // if (!passed) {
            //     await this.dealWithFailedResponse(response);
            // }

            await this.dealWithOutputs(response)
        }
    }

    async dealWithOutputs(response) {
        const json = await response.json();
        if (this.step?.outputs) {
            const outputs = {}
            for (const key in this.step.outputs) {
                // console.log(key)

                const isARuntimeValue = this.matchesExpectedRunTimeExpression(this.step.outputs[key], '$response.');

                if (isARuntimeValue) {
                    const parseResult = parse(this.step.outputs[key]);
                    const parts = [];

                    parseResult.ast.translate(parts);
                    for (const result of parts) {
                        if (result.at(0) === 'source') {
                            if (result.at(1) === 'body') {
                                outputs[key] = json;
                            }

                            // if (result.at(1).startsWith('header')) {
                            //     const headerName = parts[3][1]
                            //     console.log(response.headers)
                            //     console.log(response.headers.'Content-Type');
                            //     outputs[key] = response.headers[headerName];
                            // }
                        }
                        // console.log(result)
                        // if (result.at(1).at(0) === 'body' && !result?.at(3)) {
                        //     outputs[key] = json;
                        // }

                        // if (result[1].startsWith('header')) {
                        //     outputs[key] = response.headers[result[3][1]];
                        // }
                    }
                }
            }

            Object.assign(this.outputs, {[this.step.stepId]: outputs})
        }

        console.log(this.outputs);
    }

    async dealWithFailedResponse(response) {
        if (this.workflow.failureActions) {

        }

        if (this.step.failureActions) {

        }
    }

    async dealWithSuccessfulResponse(response) {
        let successCriteriaPassed = false;

        if (this.step.successCriteria) {
            successCriteriaPassed = this.dealWithCriteria(response, this.step.successCriteria);
        }

        return successCriteriaPassed;
    }

    safeEval(expression, context) {
        try {
            const func = new Function('data', `return ${expression}`);
            return func(context);
        } catch (e) {
            console.error('Error evaluating expression:', expression, e);
            return false;
        }
    }

    dealWithCriteria(response, criteriaArr) {
        let hasPassed = false;
        const passes = [];
        const failures = [];
        for (const successCriteria of criteriaArr) {
            if (Object.hasOwn(successCriteria, 'type') === false || successCriteria?.type === 'simple') {
                let condition = successCriteria.condition;
                for (const key in response) {
                    const passed = this.safeEval(condition, response);
                    if (passed) passes.push(true);
                }
            } else {
                if (successCriteria?.type === 'regex') {

                } else {

                }
            }
        }

        if (passes === this.step.successCriteria.length) {
            hasPassed = true;
        }

        return hasPassed;
    }

    async determineSuccessCriteria(response) {
        let matchesAllSuccessCriteria = false;
        const successCriteriaMatches = []
        for (const criterionObject of this.step.successCriteria) {
            if (Object.entries(criterionObject).length === 1) {
                if (test(criterionObject.condition)) {
                    const parseResult = parse(criterionObject.condition);
                    parseResult.ast.translate(parts);

                    console.log(parseResult)
                } else {
                    if (criterionObject.condition.startsWith('$statusCode')) {
                        if (response.status == 200) {
                            successCriteriaMatches.push(true)
                        }
                    }
                }
            }
        }

        if (successCriteriaMatches.every(value => value === true)) {
            matchesAllSuccessCriteria = true;
        }

        return matchesAllSuccessCriteria;
    }

    mapInputs() {
        this.mapParameters();
        this.mapRequestBody();
    }

    mapParameters() {
        const headers = new Headers();
        const queryParams = new URLSearchParams();

        for (const param of this.step?.parameters) {
            const value = this.parseRunTimeExpression(param.value);

            switch(param.in) {
                case 'header':
                    headers.append(param.name, value);
                break;

                case 'path':
                    for (const operation of this.operations) {
                        operation.url = operation.url.replace(`{${param.name}}`, value)
                    }
                break;

                case 'query':
                    queryParams.append(param.name, value);
                break;
            }
        }

        for (const operation of this.operations) {
            operation.headers = headers;
            operation.queryParams = queryParams;
        }
    }

    mapRequestBody() {
        if (this.step?.requestBody) {
            const payload = structuredClone(this.step.requestBody.payload);
            traverse(payload).forEach((requestValue) => {
                const value = this.parseRunTimeExpression(requestValue);
                this.update(value);
            });

            for (const operation of this.operations) {
                operation.data = payload;
            }
        }
    }

    parseRunTimeExpression(expression) {
        let value = expression;
        if (test(value)) {
            const parts = []
            const parseResult = parse(value);
            parseResult.ast.translate(parts);

            for (const part of parts) {
                if (part[0] === 'name') {
                    value = this.inputs[part[1]];
                }
            }
        }

        return value;
    }

    async loadOperationData() {
        this.sourceDescription = this.getOperationIdSourceDescription();
        this.logger.notice(`Getting Source Description for: ${this.sourceDescription.name}`);
        this.sourceDescriptionFile = await docFactory.buildDocument(
            this.sourceDescription.type,
            this.sourceDescription.url,
            this.sourceDescription.name,
            {parser: this.parser, logger: this.logger}
        );

        if (this.isAnOperationId) {
            // this.logger.notice(`Getting OperationId: ${this.step.operationId}`);
            await this.sourceDescriptionFile.getOperationById(this.step.operationId);
        }
    }

    getOperationIdSourceDescription() {
        const operationOrWorkflowPointer = this.getOperationType();

        if (this.sourceDescriptions.length === 1) {
            return this.sourceDescriptions[0]
        } else {
            if (this.matchesExpectedRunTimeExpression(operationOrWorkflowPointer, '$sourceDescriptions.')) {
                const sourceDescription = this.sourceDescriptions.filter((sourceDescription) => {
                    if (sourceDescription.name === operationOrWorkflowPointer.split('.')[1]) {
                        return sourceDescription;
                    }
                });
                if (sourceDescription.length === 1) {
                    return sourceDescription;
                }
            }
        }

        throw new Error(`No known matching source description for ${this.step.operationId}`);
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
        const pipeline = this.JSONPicker('sourceDescriptions', this.filePath);

        let sourceDescriptions = [];
        for await (const { value } of pipeline) {
            sourceDescriptions = value.flat();
        }

        if (sourceDescriptions.length === 0) {
            throw new Error('Missing Source Descriptions');
        }

        this.sourceDescriptions = sourceDescriptions;
    }

    async getWorkflows() {
        const pipeline = this.JSONPicker('workflows', this.filePath);

        let workflows = [];
        for await (const { value } of pipeline) {
            workflows = value.flat();
        }

        if (workflows.length === 0) {
            throw new Error('Missing Workflows');
        }

        this.workflows = workflows;
    }
}

module.exports = Arazzo;
