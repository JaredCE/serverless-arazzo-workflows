'use strict';

const { parse, test, extract } = require('@swaggerexpert/arazzo-runtime-expression');
const { evaluate } = require('@swaggerexpert/json-pointer');

/**
 * Handles resolution of Arazzo runtime expressions to context values.
 *
 * Supports expressions like:
 * - Simple: $inputs.user, $statusCode
 * - Complex: $response.body#/data/id, $response.header.Content-Type
 * - Templated: "User {$inputs.username} logged in"
 */
class Expression {
    constructor() {
        this.context = {};

        this.simpleExpressions = [
            '$url',
            '$method',
            '$statusCode',
            '$inputs',
            '$outputs',
            '$steps',
            '$workflows',
            '$sourceDescriptions'
        ];

        this.expressionMap = {
            $request: 'request',
            $response: 'response',
            '$response.body': 'response',
            '$response.header': 'response',
            $inputs: 'inputs',
            $outputs: 'outputs',
            $steps: 'steps',
            $workflows: 'workflows',
            $sourceDescriptions: 'sourceDescriptions',
        };
    }

    /**
     * Resolves a runtime expression to its value in the context
     * @param {string} expression - The runtime expression to resolve
     * @returns {*} The resolved value
     * @throws {Error} If expression is invalid or context path doesn't exist
     */
    resolveExpression(expression) {
        if (typeof expression !== 'string') {
            return expression;
        }

        this.expression = expression;

        if (this.isARunTimeExpression()) {
            return this.mapToContext();
        }

        // Check for templated expression (e.g., "Hello {$inputs.name}")
        const extractedExpression = extract(expression);
        if (extractedExpression !== expression && test(extractedExpression)) {
            this.expression = extractedExpression;
            return this.mapToContext();
        }

        // Not a runtime expression, return as-is
        return expression;
    }

    /**
     * Maps the parsed expression to the corresponding context value
     * @returns {*} The value from context
     * @throws {Error} If context path is missing or invalid
     */
    mapToContext() {
        const { normalised, contextName, token } = this.mapParts();

        if (!normalised) {
            throw new Error(`Unable to resolve expression: ${this.expression}`);
        }

        // Validate context exists
        if (!this.context[normalised]) {
            throw new Error(`Context '${normalised}' not found for expression: ${this.expression}`);
        }

        // Handle JSON Pointer notation (e.g., $response.body#/data/id)
        if (contextName?.includes('#')) {
            const [objName, pointer] = contextName.split('#');

            if (!this.context[normalised][objName]) {
                throw new Error(`Context path '${normalised}.${objName}' not found`);
            }

            try {
                return evaluate(this.context[normalised][objName], pointer);
            } catch (err) {
                throw new Error(`Invalid JSON pointer '${pointer}': ${err.message}`);
            }
        }

        // Handle simple expressions (e.g., $inputs.user)
        if (this.isSimple) {
            if (!contextName) {
                return this.context[normalised];
            }
            return this.context[normalised]?.[contextName];
        }

        // Handle header access (e.g., $response.header.Content-Type)
        if (contextName === 'header') {
            if (!token) {
                throw new Error('Header name (token) is required for header expressions');
            }

            const headers = this.context[normalised][contextName];
            if (!headers || typeof headers.get !== 'function') {
                throw new Error('Response headers not available or invalid');
            }

            return headers.get(token);
        }

        // Handle body access (e.g., $response.body)
        if (contextName === 'body') {
            return this.context[normalised][contextName];
        }

        throw new Error(`Unhandled expression pattern: ${this.expression}`);
    }

    /**
     * Tests if the expression is a runtime expression
     * @returns {boolean}
     */
    isARunTimeExpression() {
        try {
            return test(this.expression);
        } catch (err) {
            return false;
        }
    }

    /**
     * Adds data to the context under a specific type
     * @param {string} type - The context type (e.g., 'inputs', 'response')
     * @param {*} obj - The data to add
     */
    addToContext(type, obj) {
        if (Object.hasOwn(this.context, type)) {
            if (Array.isArray(this.context[type])) {
                // Merge arrays
                if (Array.isArray(obj)) {
                    this.context[type].push(...obj);
                } else {
                    this.context[type].push(obj);
                }
            } else if (typeof this.context[type] === 'object' && typeof obj === 'object') {
                // Merge objects
                Object.assign(this.context[type], obj);
            } else {
                // Replace primitive values
                this.context[type] = obj;
            }
        } else {
            this.context[type] = obj;
        }
    }

    /**
     * Parses the expression into its component parts
     * @returns {{normalised: string, contextName: string, token: string}}
     * @throws {Error} If parsing fails
     */
    mapParts() {
        let parsedExpression;
        try {
            parsedExpression = parse(this.expression);
        } catch (err) {
            throw new Error(`Failed to parse expression '${this.expression}': ${err.message}`);
        }

        const parts = [];
        parsedExpression.ast.translate(parts);
        console.log(parts);

        if (!parts.length) {
            throw new Error(`No parts found in expression: ${this.expression}`);
        }

        this.isSimple = false;
        let expressionType;
        let contextName = '';
        let token;

        for (const partType of parts) {
            const [type, value] = partType;

            if (type === 'expression') {
                expressionType = value.split('.')[0];
                this.isSimple = this.simpleExpressions.includes(expressionType);
            }

            if (this.isSimple) {
                if (type === 'name') {
                    contextName = value;
                }
            } else {
                if (type === 'source') {
                    // Handle body reference (e.g., $response.body#/path)
                    if (value.includes('body')) {
                        contextName = value;
                    } else {
                        // Extract the source type (e.g., 'header' from '$response.header')
                        contextName = value.split('.')[0];
                    }
                }

                if (type === 'token') {
                    token = value;
                }
            }
        }

        const normalised = this.expressionMap[expressionType];

        if (!normalised) {
            throw new Error(`Unknown expression type: ${expressionType}`);
        }

        return { normalised, contextName, token };
    }
}

module.exports = Expression;
