module.exports = {
    service: {
        service: 'Test API',
        getAllFunctions: () => ['login'],
        getFunction: (name) => {
            return {
                handler: 'login',
                name: 'login',
                events: [
                    {
                        http: {
                            path: '/login',
                            method: 'post',
                            arazzo: {
                                workflows: [
                                    {
                                        workflowName: 'login',
                                        stepId: 'loginStep',
                                        stepNumber: 1,
                                        requestBody: {
                                            username: '$inputs.username',
                                            password: '$inputs.password'
                                        }
                                    }

                                ]
                            }
                        }
                    }
                ]
            }
        }
    },
    version: '3.4.0',
    classes: {
        Error: class ServerlessError {
            constructor(err) {
                return new Error(err);
            }
        },
    },
    processedInput: {
        options: {
            format: "json",
        },
    },
    configSchemaHandler: {
        defineCustomProperties: () => {},
    },
}
