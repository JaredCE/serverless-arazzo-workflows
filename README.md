# Arazzo Generator for Serverless Framework

<p>
  <a href="https://www.npmjs.com/package/serverless-arazzo-workflows">
    <img src="https://img.shields.io/npm/v/serverless-arazzo-workflows.svg?style=flat-square">
  </a>
  <a href="https://github.com/JaredCE/serverless-arazzo-workflows/actions/workflows/node.yml">
    <img src="https://github.com/JaredCE/serverless-arazzo-workflows/actions/workflows/node.yml/badge.svg">
  </a>
</p>

Document your Serverless Framework API workflows with the [OpenAPI Arazzo Workflow Spec](https://www.openapis.org/arazzo-specification).

This will generate an OpenAPI Arazzo Specification (1.0.1) for your Serverless Framework APIs.  This requires the [Serverless OpenAPI Documenter](https://github.com/JaredCE/serverless-openapi-documenter) plugin to be installed and used, as the Arazzo Specification makes use of the generated OpenAPI Document.

## Install

This plugin works for Serverless Framework (3.x and 4.x) and only supports node.js 20 and up.

To add this plugin to your package.json:

**Using npm:**

```bash
npm install --save-dev serverless-arazzo-workflows
```

Next you need to add the plugin to the `plugins` section of your `serverless.yml` file.

```yml
plugins:
  - serverless-openapi-documenter
  - serverless-arazzo-workflows
```

Note: `serverless-openapi-documenter` is required for this to work.

## Generating the Arazzo Specification file

To generate an Arazzo Specification, you can call the plugin from the CLI like:
```bash
serverless arazzo generate -f json
```

Options:

```
--format -f  Whether to output the Arazzo Specification as json or yaml. Default: json
--output -o  The name of the Arazzo Specification file. Default: arazzo.json
--source -s  The default openAPI source file. Default: openapi.json
```

### Configuration

To configure this plugin to generate a valid OpenAPI Arazzo Specification, you'll need to modify the `custom` section of your `serverless.yml` file.

The `custom` section of your `serverless.yml` can be configured as below:

```yml
custom:
  arazzo:
    info:
      title:
      summary:
      description:
      version:
    sourceDescriptions:
      - name:
        url:
        type:
    workflows:
      - workflowId:
        steps:
          - stepId:
```

#### info

Mostly everything is optional in the `info` object.  If you don't provide a `title`, it'll pull it from your service name, if you don't provide a `version`, it'll default to '1'.

#### sourceDescriptions

This section is optional.  It allows you to document any extra OpenAPI or Arazzo Specification files that your workflows and steps may require.  If you do not document this section, it will end up with a default of:

```
sourceDescriptions:
  - name: arazzo.info.title
    url: ./openapi.json
    type: openapi
```

That is, that it generates the `name` property from the `title` property of the `info` object (or the one that is generated for you if you omitted the `info` object).

The `url` will be that of a local openapi.json file, this is what the [Serverless OpenAPI Documenter](https://github.com/JaredCE/serverless-openapi-documenter) generates by default.  This can be changed by the CLI by providing a source argument with the path to a different OpenAPI file.

If you do provide this section, then any further additions will be added to that of the default `sourceDescription`.  This is useful if you need to incorporate a step or workflow that resides in a different API (perhaps a Login service).

#### workflows

Workflows describe the steps to be taken across one or more APIs to achieve an objective.

```yml
workflows:
  - workflowId:
    summary:
    description:
    inputs:
    steps:
```

Workflows comprise of one or many workflow objects, one workflow might be for logging in, another might be for resetting a password.  They comprise of steps, where one step might be to call an endpoint to login and the next step would be to call an endpoint that allows a user to change their name.

Each workflow object requires a `workflowId` and a set of `steps`.  `workflowId` should conform to the Regex `[A-Za-z0-9_\-]+` and should be unique across the Arazzo Specification.

`inputs` is a [JSON Schema](https://json-schema.org/) of the various inputs you will need for each step e.g.

```yml
- workflowId: loginUserWorkflow
  summary: Allow a user to login
  description: This workflow describes logging in a user.
  inputs:
    type: object
    properties:
      username:
        type: string
      password:
        type: string
```

The `inputs` here will be used in a login step and can be verified by this JSON Schema.

#### steps

Describes a single workflow step which MAY be a call to an API operation (OpenAPI Operation Object) or another Workflow Object.

```yml
steps:
  - stepId:
    description:
    operationId:
    parameters:
      - name:
        in:
        value:
    requestBody:
      contentType:
      payload:
    successCriteria:
      - condition:
```

Each step object requires a `stepId` which conforms to the Regex `[A-Za-z0-9_\-]+`.  The `operationId` should point to an `operationId` within an OpenAPI document that is registered within the `sourceDescriptions` array.  If you are using multiple OpenAPI files within the `sourceDescriptions` array, then you will need to reference the `operationId` via: `$sourceDescriptions.<name>.<operationId>` e.g.

```yml
sourceDescriptions:
  - name: loginOpenAPI
    url: ./openapi.json
    type: openapi
  - name: contactOpenAPI
    url: ./contactOpenAPI.json
    type: openapi
workflows:
  ...
  steps:
    - stepId: loginUser
      operationId: $sourceDescriptions.loginOpenAPI.login
      ...
    - stepId: changeUserName
      operationId: $sourceDescriptions.contactOpenAPI.updateUser
```

`parameters` map to what must be passed into the referenced operation of the OpenAPI document, they map to the inputs described in the workflow section` e.g.

```yml
- workflowId: loginUserWorkflow
  summary: Allow a user to login
  description: This workflow describes logging in a user.
  inputs:
    type: object
    properties:
      username:
        type: string
      password:
        type: string
  stepes:
    - stepId: loginUser
      parameters:
        - name: username
          in: query
          value: $inputs.username
```

`requestBody` is very similar, the contentType should map to that of the operationId that is referenced in the OpenAPI document and the value map to the `inputs` referenced in the `workflow`.

For `successCriteria`, it is probably worth reading through the [Arazzo Specification for Criterion objects](https://spec.openapis.org/arazzo/v1.0.1.html#criterion-object), but this can be as simple as

```yml
successCriteria:
  - condition: $statusCode == 200
```

Where it is checking the statusCode of the operation to match 200.

#### Extended Fields

You can also add extended fields to most of the documentation objects:

```yml
custom:
  arazzo:
    info:
      x-other-field: This is an extended field
```

These fields must have `x-` before them, otherwise they will be ignored:

```yml
custom:
  arazzo:
    info:
      other-field: This is not an extended field
```

`other-field` here will not make it to the generated Arazzo document.

## Running the Arazzo Specification

To run the generated Arazzo Specification, you can call the plugin from the CLI like:

```bash
serverless arazzo run
```

Options:

```
--source -s  The default Arazzo Specification source file. Default: arazzo.json
```
