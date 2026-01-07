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
            '$response.body': 'response.body',
            '$response.header': 'response.header',
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
        const { normalised, contextName, pointer, token } = this.mapParts();

        if (!normalised) {
            throw new Error(`Unable to resolve expression: ${this.expression}`);
        }

        // Validate context exists
        if (!this.context[normalised]) {
            throw new Error(`Context '${normalised}' not found for expression: ${this.expression}`);
        }

        // Handle simple expressions (e.g., $inputs.user -> context.inputs.user)
        if (this.isSimple) {
            // Extract the property name (before any # pointer)
            const propName = contextName?.split('#')[0];

            if (!propName) {
                return this.context[normalised];
            }

            const value = this.context[normalised]?.[propName];

            // If there's a JSON pointer, apply it
            if (pointer) {
                try {
                    return evaluate(value, pointer);
                } catch (err) {
                    throw new Error(`Invalid JSON pointer '${pointer}': ${err.message}`);
                }
            }

            return value;
        }

        // For complex expressions like $response.body or $response.header

        // Handle response body with JSON pointer (e.g., $response.body#/data/id)
        if (pointer) {
            const data = this.context[normalised];

            if (!data) {
                throw new Error(`Context path '${normalised}' not found`);
            }

            try {
                return evaluate(data, pointer);
            } catch (err) {
                throw new Error(`Invalid JSON pointer '${pointer}': ${err.message}`);
            }
        }

        // Handle header access (e.g., $response.header.x-rate-limit)
        if (token) {
            const headers = this.context[normalised];
            if (!headers || typeof headers.get !== 'function') {
                throw new Error('Response headers not available or invalid');
            }

            return { [token]: headers.get(token) };
        }

        // Handle plain body access (e.g., $response.body with no pointer)
        return this.context[normalised];
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
     * @returns {{normalised: string, contextName: string, pointer: string, token: string}}
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
        console.log(parts)
        if (!parts.length) {
            throw new Error(`No parts found in expression: ${this.expression}`);
        }

        this.isSimple = false;
        let expressionType;
        let contextName = '';
        let pointer = null;
        let token = null;

        for (const partType of parts) {
            const [type, value] = partType;

            if (type === 'expression') {
                // Check if it's a simple expression using just the first part
                const firstPart = value.split('.')[0].split('#')[0];
                this.isSimple = this.simpleExpressions.includes(firstPart);

                // For simple expressions, use base ($inputs), for complex use full ($response.body)
                if (this.isSimple) {
                    expressionType = firstPart;
                } else {
                    // For $response.body or $response.header
                    const baseExpression = value.split('#')[0]; // Remove pointer part
                    expressionType = baseExpression;
                }
            }

            if (this.isSimple) {
                // For $inputs.user or $inputs.user#/name
                // contextName will be 'user' or 'user#/name'
                if (type === 'name') {
                    contextName = value;
                }
            } else {
                // For $response.body or $response.header.Content-Type
                if (type === 'source') {
                    contextName = value;
                }

                // Extract JSON pointer for response body
                if (type === 'json-pointer') {
                    pointer = value;
                }

                // Extract token for response header
                if (type === 'token') {
                    token = value;
                }
            }
        }

        // For simple expressions with pointers (e.g., $inputs.user#/name)
        // Extract the pointer from contextName
        if (this.isSimple && contextName?.includes('#')) {
            const [name, ptr] = contextName.split('#');
            contextName = name;
            pointer = ptr;
        }

        const normalised = this.expressionMap[expressionType];

        if (!normalised) {
            throw new Error(`Unknown expression type: ${expressionType}`);
        }

        return { normalised, contextName, pointer, token };
    }
}

module.exports = Expression;
