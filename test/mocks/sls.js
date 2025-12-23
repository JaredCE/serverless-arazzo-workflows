module.exports = {
    service: {
        service: 'Test API'
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
