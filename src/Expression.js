'use strict';

const { parse, test, extract } = require('@swaggerexpert/arazzo-runtime-expression');
const { evaluate } = require('@swaggerexpert/json-pointer');
const jp = require('jsonpath');

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
        ]

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
        }
    }

    resolveExpression(expression) {
        this.expression = expression;

        if (this.isARunTimeExpression()) {
            return this.mapToContext();
        } else {
            if (this.isATemplatedRunTimeExpression()) {
                return this.mapToContext();
            } else {
                return expression;
            }
        }
    }

    mapToContext() {
        const {normalised: expressionNormalised, contextName, token} = this.mapParts();

        if (contextName?.includes('#')) {
            const nameParts = contextName.split('#');
            const objName = nameParts.at(0);
            const pointer = nameParts.at(1);

            return evaluate(this.context[expressionNormalised][objName], pointer)

        } else {
            if (this.isSimple) {
                return this.context[expressionNormalised][contextName];
            } else {
                if (contextName === 'header') {
                    return this.context[expressionNormalised][contextName].get(token)
                }
            }
        }
    }

    isARunTimeExpression() {
        return test(this.expression);
    }

    isATemplatedRunTimeExpression() {
        this.expression = extract(this.expression)
        return this.isARunTimeExpression()
    }

    addToContext(type, obj) {
        if (Object.hasOwn(this.context, type)) {
            if (Array.isArray(this.context[type])) {
                this.context[type].push(...obj);
            } else  {
                Object.assign(this.context[type], ...obj);
            }
        } else {
            Object.assign(this.context, {[type]: obj});
        }
    }

    mapParts() {
        const parsedExpression = parse(this.expression);
        const parts = []
        parsedExpression.ast.translate(parts);
        console.log(parts)

        if (parts.length) {

            this.isSimple = false;
            let expressionType;
            let contextName = '';
            let token;
            for (const partType of parts) {
                if (partType.at(0) === 'expression') {
                    expressionType = partType.at(1).split('.').at(0);

                    if (this.simpleExpressions.includes(expressionType)) {
                        this.isSimple = true;
                    }
                }

                if (this.isSimple) {
                    if (partType.at(0) === 'name') {
                        contextName = partType.at(1)
                    }
                } else {
                    if (partType.at(0) === 'source') {
                        if (partType.at(1).includes('body')) {
                            // expressionType  'body';
                            contextName = partType.at(1);
                            // contextName = 'body';
                        } else {
                            contextName = partType.split('.').at(0)
                            // expressionType = partType.at(1).split('.').at(0);
                        }
                    }

                    if (partType.at(0) === 'token') {
                        token = partType.at(1);
                    }
                }
            }

            console.log(expressionType)
            console.log(contextName)
            console.log(token)

            return {normalised: this.expressionMap[expressionType], contextName, token}
        }
        // const expressionType = parts.at(0).at(1).split('.').at(0);
        // const contextName = parts.at(1).at(1)

        // const expressionNormalised = this.expressionMap[expressionType];
    }
}

module.exports = Expression;
