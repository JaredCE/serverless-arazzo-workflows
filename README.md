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

To Run: `serverless arazzo generate -f json`

Options:

```
--format                -f  Whether to output the Arazzo Specification as json or yaml. Default: json
--output                -o  The name of the Arazzo Specification file. Default: arazzo.json
--source                -s  The default openAPI source file. Default: openapi.json
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

```

#### info

Mostly everything is optional in the `info` object.  If you don't provide a `title`, it'll pull it from your service name, if you don't provide a `version`, it'll default to '1'.

#### sourceDescriptions

This section points to the OpenAPI files your workflow uses. It's how Arazzo connects to existing API definitions. Each entry has a name (for reference) and a url (where the file lives) and a type (currently the only valid values are `openapi` or `arazzo`):

This is not required and will generate a default array of `sourceDescriptions` using the default source as provided by the CLI.  This defaults to `openapi.json` and can be changed via the CLI.  You should only add other entries to this if you need more than the default OpenAPI source file.


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
