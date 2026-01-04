'use strict';

const Document = require('./Document');

class OpenAPI extends Document {
    constructor(url, name, options) {
        super(url, name, options);

        this.type = 'openapi';

    }

    async getOperationById(operationId) {
        const pipeline = await this.JSONPicker('paths', this.filePath);

        for await (const { value } of pipeline) {
            for (let key in value) {
                for (let operation in value[key]) {
                    if (value[key][operation]?.operationId === operationId) {
                        this.path = key;
                        this.operation = operation;
                        this.operationDetails = value[key][operation]
                    }
                }
            }
        }

        if (this.path === undefined) {
            throw new Error(`The OperationId: ${operationId} does not exist`)
        }
    }

    async buildOperation(inputs, step) {
        await this.getServers();
        // this.mapInputs(inputs, step)
        this.buildOperations();

        // console.log(this.operations)
        return this.operations;
    }

    async getServers() {
        const pipeline = await this.JSONPicker('servers', this.filePath);

        for await (const { value } of pipeline) {
            this.servers = value;
        }
    }

    // mapInputs(inputs, step) {
    //     if (step.parameters) {
    //         this.mapParamsToInputs(inputs, step);
    //     }

    //     if (step.requestBody) {
    //         this.mapRequestBodyToInputs(inputs, step);
    //     }
    // }

    // mapParamsToInputs(inputs, step) {
    //     const headers = new Headers();
    //     const queryParams = new URLSearchParams();

    //     for (const param of step.parameters) {
    //         if (this.matchesExpectedRunTimeExpression(param.value, '$inputs.')) {
    //             const inputName = param.value.split('.')[1];
    //             const inputValue = inputs[inputName];

    //             if (param.in === 'header') {
    //                 headers.append(param.name, inputValue);
    //             } else if (param.in === 'query') {
    //                 queryParams.append(param.name, inputValue);
    //             } else if (param.in === 'path') {
    //                 this.path = this.path.replace(`{${inputName}}`, inputValue)
    //             }
    //         }
    //     }

    //     this.headers = headers;
    //     this.queryParams = queryParams;
    // }

    // mapRequestBodyToInputs(inputs, step) {
    //     if (step.requestBody.contentType || Object.keys(this.operationDetails.requestBody.content) === 1) {
    //         for (const contentType in this.operationDetails.requestBody.content) {
    //             if (step.requestBody.contentType === contentType) {
    //                 if (contentType === 'application/json') {
    //                     const payload = structuredClonestep.requestBody.payload;
    //                     traverse(payload).forEach(function(value) {
    //                         if (this.matchesExpectedRunTimeExpression(value, '$inputs.')) {
    //                             const inputName = param.value.split('.')[1];
    //                             const inputValue = inputs[inputName];

    //                             this.update(inputValue);
    //                         }
    //                     });
    //                     this.payload = payload;
    //                 }
    //             }
    //         }
    //     } else {
    //         throw new Error(`Too many contentTypes on ${this.operationDetails.operationId}, please add the targeted contentType to the Arazzo Documentation`);
    //     }
    // }

    buildOperations() {
        this.operations = []

        for (const server of this.servers) {
            this.operations.push({
                url: `${server.url}${this.path}`,
                operation: this.operation,
                // headers: this.headers,
                // queryParams: this.queryParams,
                // payload: this?.payload || null
            });
        }
    }
}

module.exports = OpenAPI;
