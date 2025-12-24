'use strict';

const Ajv = require('ajv');
const {
  Config,
  lintFromString,
  stringifyYaml,
  createConfig,
} = require("@redocly/openapi-core");

class ArazzoGenerator {
    constructor(arazzoDocumentation, options) {
        this.arazzoDocumentation = arazzoDocumentation;

        this.arazzo = {
            arazzo: options.arazzo
        }

        this.sls = options?.sls
        this.sourceFile = options?.sourceFile;

        this.ajv = new Ajv();
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

            if (workflow.steps) {
                obj.steps = this.generateSteps()
            }

            workflows.push(obj)
        }

        this.arazzo.workflows = workflows
    }

    generateSteps() {
        const steps = [];

        for (const step of this.currentWorkflow.steps) {
            this.currentStep = step;
            const obj = {
                stepId: step.stepId
            };

            if (step.description) obj.description = step.description;

            if (step.operationId && step.operationPath) {
                obj.operationId = step.operationId;
            } else if (step.operationPath) {
                obj.operationPath = step.operationPath;
            } else {
                obj.operationId = step.operationId;
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

    async validate() {
        const config = await createConfig({
            apis: {},
            rules: {},
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
