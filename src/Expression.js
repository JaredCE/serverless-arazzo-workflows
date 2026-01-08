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
     * Runs a check on a runtime expression from a simple Criterion Object
     * @public
     * @param {string} expression - The runtime expression to resolve
     */
    checkSimpleExpression(expression) {
        try {
            const normalisedExpression = this.normalisedExpression(expression);
            const normalisedContext = this.normaliseContext()

            const evaluate = new Function(
                ...Object.keys(normalisedContext),
                `return ${normalisedExpression};`
            );

            // Evaluate the modified expression
            return evaluate(...Object.values(normalisedContext));
        } catch (e) {
            console.error('Error evaluating expression:', expression, e);
            return false;
        }
    }

    /**
     * Runs a check on a runtime expression from a regex Criterion Object
     * @public
     * @param {string} expression - The runtime expression to resolve
     */
    checkRegexExpression(expression) {

    }

    /**
     * Runs a check on a runtime expression from a JSON Path Criterion Object
     * @public
     * @param {string} expression - The runtime expression to resolve
     */
    checkJSONPathExpression(expression) {

    }

    /**
     * Resolves a runtime expression to its value in the context
     * @public
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
     * Adds data to the context under a specific type
     * @public
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
     * @private
     * @param {string} expression - The Criteria Condition expression
     * @returns {string}
     */
    normalisedExpression(expression) {
        const normalisedSymbolsExpression = this.normaliseSymbolsExpression(expression);
        const cleanedJsExpression = normalisedSymbolsExpression.replace(/{(.*?)}/g, '$1');
        const expressionWithBrackets = this.convertNumericIndices(cleanedJsExpression);
        const headerParameterNameRegex = /\.header\.([a-zA-Z0-9._-]+)/g;
        const normalisedExpression = expressionWithBrackets.replace(
            headerParameterNameRegex,
            (_match, p1) => {
            return `.header.${p1.toLowerCase()}`;
            }
        );

        return normalisedExpression;
    }

    /**
     * Alters the expression by replacing hyphens with underscores and converting to lowercase
     * @private
     * @param {string} expression - The Criteria Condition expression
     * @returns {string}
     */
    normaliseSymbolsExpression(expression) {
        return expression.replace(/\$([a-zA-Z0-9._-]+)/g, (_match, variable) => {
            // Normalise variable by replacing hyphens with underscores and converting to lowercase
            const normalisedKey = variable.replace(/-/g, '_'); // Replace hyphens with underscores

            return `$${normalisedKey}`; // Return the normalised variable for evaluation
        });
    }

    /**
     * Alters the expression to match a dot followed by a number (.1) and change to [1]
     * @private
     * @param {string} expression - The Criteria Condition expression
     * @returns {string}
     */
    convertNumericIndices(expression) {
        return expression.replace(/\.(\d+)/g, (match, num, offset, str) => {
            // Look at the character right before the dot
            const charBeforeDot = str[offset - 1];
            // If the character before the dot is a digit, it's a float
            const isFloat = /\d/.test(charBeforeDot);
            return isFloat ? match : `[${num}]`;
        });
    }

    normaliseContext() {
        const normalised = {};

        for (const [key, value] of Object.entries(this.context)) {
            // Normalise variable names to lowercase and replace hyphens with underscores
            const normalisedKey = `$${key.replace(/-/g, '_')}`;

            normalised[normalisedKey] = this.normaliseValue(value);
        }

        return normalised;
    }

    // Normalise values recursively, handling objects and primitives
    normaliseValue(value) {
        if (Array.isArray(value)) {
            // If the value is an array, return it as-is without modifying
            return value;
        } else if (typeof value === 'object' && value !== null) {
            return this.normaliseObject(value);
        }
        return value;
    }

    // Normalise an object by replacing hyphens with underscores in keys
    normaliseObject(obj) {
        return Object.keys(obj).reduce((acc, key) => {
            const normalisedKey = key.replace(/-/g, '_'); // Convert hyphens to underscores
            acc[normalisedKey] = this.normaliseValue(obj[key]);
            return acc;
        }, {});
    }

    /**
     * Maps the parsed expression to the corresponding context value
     * @private
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
            // if (!headers || typeof headers.get !== 'function') {
            //     throw new Error('Response headers not available or invalid');
            // }

            return { [token]: headers[token] };
        }

        // Handle plain body access (e.g., $response.body with no pointer)
        return this.context[normalised];
    }

    /**
     * Tests if the expression is a runtime expression
     * @private
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
     * Parses the expression into its component parts
     * @private
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
                    // For $response.body or $response.header.x-rate-limit
                    // Need to extract just $response.body or $response.header (without the token)
                    const baseExpression = value.split('#')[0]; // Remove pointer part

                    // Check if this is a header reference (has 3 parts: $response.header.token)
                    const parts = baseExpression.split('.');
                    if (parts.length === 3 && parts[1] === 'header') {
                        // Strip the token, keep just $response.header
                        expressionType = parts.slice(0, 2).join('.');
                    } else {
                        expressionType = baseExpression;
                    }
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
