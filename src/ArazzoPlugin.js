'use strict';

const chalk = require("chalk");
const yaml = require("js-yaml");

const fs = require('fs/promises')

const ArazzoGenerator = require('./ArazzoGenerator');
const ArazzoRunner = require('./ArazzoRunner');
const Logger = require("./Logger");

const serverlessSchema = require('../resources/serverlessSchema.json')

class ArazzoPlugin {
    constructor(serverless, options, {log={}} = {}) {
        this.serverless = serverless;
        this.logOutput = log;

        this.logger = new Logger(this.serverless.version[0], this.logOutput);

        this.commands = {
            arazzo: {
                commands: {
                    generate: {
                        lifecycleEvents: ['serverless'],
                        usage: 'Generate Arazzo Specification',
                        options: {
                            output: {
                                usage: 'Arazzo file output location [default: arazzo.json]',
                                shortcut: 'o',
                                type: 'string',
                            },
                            format: {
                                usage: 'Arazzo file format (yaml|json) [default: json]',
                                shortcut: 'f',
                                type: 'string',
                            },
                            source: {
                                usage: 'The default OpenAPI Source file to use [default: openapi.json]',
                                shortcut: 's',
                                type: 'string',
                            }
                        }
                    },
                    run: {
                        lifecycleEvents: ['serverless'],
                        usage: 'Run an Arazzo Specification',
                        options: {
                            source: {
                                usage: 'The default Arazzo Specification Source file to use [default: arazzo.json]',
                                shortcut: 's',
                                type: 'string',
                            },
                            input: {
                                usage: 'The input variables to fill in things like Query Strings and Path parameters [default: input.json]',
                                shortcut: 'i',
                                type: 'string',
                            },
                        },
                    },
                },
            },
        };

        this.hooks = {
            "arazzo:generate:serverless": this.generate.bind(this),
            "arazzo:run:serverless": this.run.bind(this),
        };

        // this.serverless.configSchemaHandler.defineCustomProperties(serverlessSchema);
    }

    async generate() {
        this.logger.notice(
            chalk.bold.underline("Arazzo v1 Specification Generation")
        );

        this.generateArazzo = true;
        this.processCLIInput();

        await this.arazzoGeneration()
            .catch((err) => {
                throw new this.serverless.classes.Error(err);
            });
    }

    async run() {
        this.logger.notice(
            chalk.bold.underline("Arazzo v1 Specification Runner")
        );

        this.runArazzo = true;
        this.processCLIInput();

        const runner = new ArazzoRunner(
            `./${this.config.source}`,
            {
                logger: this.logger,
                inputFile: this.config.input
            }
        );

        await runner.runArazzoWorkflows()
            .catch((err) => {
                throw new this.serverless.classes.Error(err);
            });

        this.logger.success("Arazzo Specification Successfully Run");
    }

    async arazzoGeneration() {
        const generator = new ArazzoGenerator(
            this.serverless.service.custom.arazzo,
            {
                arazzo: this.config.arazzoVersion,
                sls: this.serverless,
                sourceFile: this.config.source
            }
        );

        this.logger.notice(`Generating Arazzo Specification`);
        generator.parse();

        this.logger.notice(`Validating generated Arazzo Specification`);

        await generator.validate().catch(err => {
            this.logger.error(
                `ERROR: An error was thrown validating the Arazzo Specification`
            );

            throw new this.serverless.classes.Error(err);
        })

        this.logger.success("Arazzo Specification Successfully Generated");

        this.arazzoSpecification = generator.arazzo;

        await this.writeArazzoFile();
    }

    async writeArazzoFile() {
        let output;

        if (this.config.format === 'yml') {
            output = yaml.dump(this.arazzoSpecification)
        } else {
            output = JSON.stringify(this.arazzoSpecification, null)
        }

        await fs.writeFile(this.config.file, output);

        this.logger.success("Arazzo Specification Successfully Written");
    }

    processCLIInput() {
        const config = {
            format: "json",
            file: "arazzo.json",
            arazzoVersion: "1.0.1",
            validationWarn: false,
            source: this.generateArazzo ? 'openapi.json' : 'arazzo.json',
            input: 'input.json',
        };

        if (this.serverless.processedInput?.options?.format?.toLowerCase() === 'yaml') {this.serverless.processedInput.options.format = 'yml';}

        config.format = this.serverless.processedInput?.options?.format?.toLowerCase() || "json";

        if (["yml", "json"].indexOf(config.format.toLowerCase()) < 0) {
            throw new this.serverless.classes.Error(
                'Invalid Output Format Specified - must be one of "yaml" or "json"'
            );
        }

        if (this.serverless.processedInput.options.output) {
            config.file = `${this.serverless.processedInput.options.output}`;
        }

        if (this.serverless.processedInput.options.source) {
            config.source = this.serverless.processedInput.options.source;
        }

        if (this.serverless.processedInput.options.input) {
            config.input = this.serverless.processedInput.options.input;
        }

        this.config = config;

        this.outputOptions()
    }

    outputOptions() {
        if (this.generateArazzo) {
            this.logger.notice(
                `
${chalk.bold.green("[OPTIONS]")}
    Arazzo Version: "${chalk.bold.green(String(this.config.arazzoVersion))}"
    Format: "${chalk.bold.green(this.config.format)}"
    Output File: "${chalk.bold.green(this.config.file)}"
    Source File: "${chalk.bold.green(this.config.source)}"
                `
            )
        } else {
            this.logger.notice(
                `
${chalk.bold.green("[OPTIONS]")}
    Source File: "${chalk.bold.green(this.config.source)}"
    Input File: "${chalk.bold.green(this.config.input)}"
                `
            )
        }
    }
}

module.exports = ArazzoPlugin;
