'use strict';

const Ajv = require('ajv');
const {
  Config,
  lintFromString,
  stringifyYaml,
  createConfig,
} = require("@redocly/openapi-core");

const path = require('node:path');

class ArazzoGenerator {
    constructor(arazzoDocumentation, options) {
        this.arazzoDocumentation = arazzoDocumentation;

        this.arazzo = {
            arazzo: options.arazzo
        }

        this.viableArazzoKeys = ['http', 'httpApi'];

        this.sls = options?.sls
        this.sourceFile = options?.sourceFile;

        this.ajv = new Ajv();

        try {
            this.logger.verbose(
                `Trying to resolve Redocly rules from: ${path.resolve(
                "options",
                "redocly.json"
                )}`
            );
            this.REDOCLY_RULES = require(path.resolve("options", "redocly.json"));
        } catch (err) {
            this.REDOCLY_RULES = {
                "sourceDescriptions-name-unique": "error",
                "sourceDescriptions-type": "error",
                "stepId-unique": "error",
                "workflowId-unique": "error"
            };
        }
    }

    parse() {
        this.generateInfo();
        this.generateSourceDescriptions();
        this.generateWorkflows();
    }

    generateInfo() {
        const info = {
            title: this.arazzoDocumentation?.info?.title || this.sls.service.service,
            description: this.arazzoDocumentation?.info?.description || null,
            summary: this.arazzoDocumentation?.info?.summary || null,
            version: this.arazzoDocumentation?.info?.version || '1',
        }

        if (info.description === null) delete info.description;
        if (info.summary === null) delete info.summary;

        const extended = this.extendSpecification(this.arazzoDocumentation?.info)
        Object.assign(info, extended);

        this.arazzo.info = info
    }

    generateSourceDescriptions() {
        const sourceDescriptions = []

        const sourceDescription = {
            name: `${this.arazzo.info.title}-openAPI`,
            url: this.sourceFile,
            type: 'openapi'
        }

        sourceDescriptions.push(sourceDescription);

        if (this.arazzoDocumentation?.sourceDescriptions){
            for (const sourceDescription of this.arazzoDocumentation?.sourceDescriptions) {
                const extended = this.extendSpecification(sourceDescription)
                sourceDescription.type = sourceDescription.type.toLowerCase()

                Object.assign(sourceDescription, extended)

                sourceDescriptions.push(sourceDescription);
            }
        }

        this.arazzo.sourceDescriptions = sourceDescriptions;
    }

    generateWorkflows() {
        const workflows = []
        for (const workflow of this.arazzoDocumentation?.workflows || []) {
            const obj = {};
            this.currentWorkflow = workflow;

            obj.workflowId = workflow.workflowId;

            if (workflow.summary) obj.summary = workflow.summary;
            if (workflow.description) obj.description = workflow.description;
            if (workflow.inputs) obj.inputs = workflow.inputs;
            if (workflow.dependsOns) obj.dependsOns = workflow.dependsOns;

            if (workflow.successActions) {
                obj.successActions = this.generateOnSuccess(workflow.successActions);
            }

            if (workflow.failureActions) {
                obj.failureActions = this.generateOnFailure(workflow.failureActions);
            }

            if (workflow.outputs) obj.outputs = workflow.outputs;

            if (workflow.parameters) {
                obj.parameters = this.generateParameters(workflow.parameters);
            }

            if (this.isStepConfigurationInCustom()) {
                obj.steps = this.generateSteps();
            } else {
                obj.steps = this.generateStepsFromEvents();
            }

            workflows.push(obj)
        }

        this.arazzo.workflows = workflows
    }

    isStepConfigurationInCustom() {
        return this.arazzoDocumentation.workflows.some(workflowObj => {
            if (Object.hasOwn(workflowObj, 'steps')) return true;
        });
    }

    generateStepsFromEvents() {
        const steps = [];
        const viableFunctions = this.getViableFunctions();
        for (const viableFunction of viableFunctions) {
            for (const event of viableFunction.event) {
                const eventKey = Object.keys(event).at(0);
                if (event[eventKey]?.arazzo) {
                    for (const workflow of event[eventKey]?.arazzo.workflows) {
                        if (workflow.workflowName === this.currentWorkflow.workflowName) {
                            if (Object.keys(workflow).some(key => ['operationId', 'workflowId', 'operationPath'].includes(key)) === false) {
                                workflow.operationId = viableFunction.operationName;
                            }

                            const step = this.generateSteps(workflow);
                            steps.push(step.at(0));
                        }
                    }
                }
            }
        }

        return steps.sort((a, b) => a.stepNumber - b.stepNumber).map(({stepNumber, ...keepAttrs}) => keepAttrs)

    }

    generateSteps(stepObj) {
        const stepsArr = stepObj ? [stepObj] : this.currentWorkflow.steps;

        const steps = [];

        for (const step of stepsArr) {
            this.currentStep = step;
            const obj = {
                stepId: step.stepId
            };

            if (step.description) obj.description = step.description;

            if (step.operationId) {
                obj.operationId = step.operationId;
            }

            if (step.operationPath) {
                obj.operationPath = step.operationPath;
            }

            if (step.workflowId) {
                obj.workflowId = step.workflowId;
            }

            if (step.parameters) {
                obj.parameters = this.generateParameters(step.parameters);
            }

            if (step.requestBody) {
                const extended = this.extendSpecification(step.requestBody);
                Object.assign(step.requestBody, extended);
                obj.requestBody = step.requestBody
            }

            if (step.successCriteria) {
                obj.successCriteria = this.generateCriteria(step.successCriteria);
            }

            if (step.onSuccess) {
                obj.onSuccess = this.generateOnSuccess(step.onSuccess);
            }

            if (step.onFailure) {
                obj.onFailure = this.generateOnFailure(step.onFailure)
            }

            if (step.outputs) {
                obj.outputs = step.outputs;
            }

            if (step.stepNumber) {
                obj.stepNumber = step.stepNumber;
            }

            steps.push(obj)
        }

        return steps;
    }

    generateParameters(parametersArr) {
        const params = []
        for (const param of parametersArr) {
            const extended = this.extendSpecification(param);

            Object.assign(param, extended);

            params.push(param)
        }

        return params;
    }

    generateOnSuccess(successObj) {
        const obj = {
            name: successObj.name,
            type: successObj.type,
        }

        if (successObj.workflowId) {
            obj.workflowId = successObj.workflowId;
        }

        if (successObj.stepId) {
            obj.stepId = successObj.stepId;
        }

        if (successObj.criteria) {
            obj.criteria = this.generateCriteria(successObj.criteria);
        }

        return obj;
    }

    generateOnFailure(failureObj) {
        const obj = {
            name: failureObj.name,
            type: failureObj.type,
        }

        if (failureObj.workflowId) {
            obj.workflowId = failureObj.workflowId;
        }

        if (failureObj.stepId) {
            obj.stepId = failureObj.stepId;
        }

        if (failureObj.type === 'retry' && failureObj.retryAfter) {
            obj.retryAfter = failureObj.retryAfter;
        }

        if (failureObj.type === 'retry' && failureObj.retryLimit) {
            obj.retryLimit = failureObj.retryLimit;
        }

        if (failureObj.criteria) {
            obj.criteria = this.generateCriteria(successObj.criteria);
        }

        return obj;
    }

    generateCriteria(criteriasArr) {
        const criterias = []
        for (const criteria of criteriasArr) {
            const extended = this.extendSpecification(criteria);

            Object.assign(criteria, extended);

            criterias.push(criteria)
        }

        return criterias;
    }

    validateSchema(schema) {
        this.ajv.validateSchema(schema)
    }

    extendSpecification(spec) {
        if (spec) {
            const obj = {};
            for (const key of Object.keys(spec)) {
                if (/^[x\-]/i.test(key)) {
                    Object.assign(obj, { [key]: spec[key] });
                }
            }

            return obj;
        }
    }

    getViableFunctions() {
        const isViableFunction = (functionTypes) => {
            return Object.keys(functionTypes).some(functionType => this.viableArazzoKeys.includes(functionType));
        };

        const functionNames = this.sls.service.getAllFunctions();

        return functionNames
            .map((functionName) => {
                return this.sls.service.getFunction(functionName);
            })
            .filter((functionType) => {
                if (functionType?.events.some(isViableFunction)) return functionType;
            })
            .map((functionType) => {
                const event = functionType.events.filter(isViableFunction);
                const operationName = functionType.name.split("-").at(-1);

                return {
                    operationName: operationName,
                    functionInfo: functionType,
                    handler: functionType.handler,
                    name: functionType.name,
                    event,
                };
            });
    }

    async validate() {
        const config = await createConfig({
            apis: {},
            rules: this.REDOCLY_RULES,
        });

        const apiDesc = stringifyYaml(this.arazzo);

        return await lintFromString({
            source: apiDesc,
            config: config,
        }).catch((err) => {
            throw err;
        });
    }
}

module.exports = ArazzoGenerator;
