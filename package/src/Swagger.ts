import { ListOptions } from "../types/generic.sptypes";
import { DynamicSwaggerOperation, DynamicSwaggerOperationBody, DynamicSwaggerPath, Parameter, ParameterType, Path, Reference, Response, Schema, SchemaV3, Spec } from "../types/swagger.sptypes";



export class Swagger
{
    // --- PRIVATE
    private static fromExpressParamsToSwagger = (str:string):string => str.replace(/:(\w+)(?=\/|$)/g, "{$1}")
    private static readonly restMethodToSwaggerKeyMapping:Record<'GET'|'POST'|'PUT'|'DELETE', 'get'|'post'|'put'|'delete'> = {
        "GET": 'get',
        "POST": 'post',
        "PUT": 'put',
        "DELETE": 'delete',
    }


    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
    // ----------------------- GENERIC ----------------------- //
    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
	public static addServer = (server:{ url:string }) => this.apiDocument.servers.push(server); // Call at init to add current server
    public static generateOpenAPIDocument = () => JSON.parse(JSON.stringify(this.apiDocument, null, 2)); // Generates json to be served in api
    public static apiDocument:Spec = // static document to be populated
    {
        openapi: "3.0.4",
        servers: [],
        info: { title: "Dynamically Generated API", version: "1.0.0" },
        paths: {},
		components: {
            schemas: {},
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            { 'bearerAuth': [] }
        ]
    }


    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
    // ----------------------- METHODS ----------------------- //
    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
    /**
     * @Description
     * - ❌ ROUTER-WRAPPER.
     * - 🛠️ ADD-API-PATH
     * - This method is not directly to insert inside the structur of addApiPath but is useful to create Schemas while not using the routerWrapper
     */
    public static addSchema = (schema:string, properties?:{ [propName: string]: Schema }) =>
    {
        if (!this.apiDocument.components || !this.apiDocument.components.schemas) this.apiDocument.components = { schemas: {} }
        if (!this.apiDocument.components.schemas![schema]) this.apiDocument.components.schemas![schema] = {
            type: 'object',
            properties
        };
    }

    /**
     * @Description
     * - ❌ ROUTER-WRAPPER.
     * - 🛠️ ADD-API-PATH
     * - This method is thought to reduce the code in the addApiPath method
     * - You can create a schema while declaring it and associating to the path calling this method
     */
    public static getBasicPost = (schema:string, required:boolean, parameters?:Parameter[], properties?:{ [propName: string]: Schema }, description?:string): DynamicSwaggerOperationBody => ({
		responses:{ },
        parameters,
		requestBody: {
			required,
			description,
			schemaName:schema,
			schema: {
				[schema]: {
					type: "object",
					properties
				}
			}
		}
    })

    /**
     * @Description
     * - ❌ **ROUTER-WRAPPER.**
     * - 🛠️ **ADD-API-PATH**
     * - This method is thought to reduce the code in the addApiPath method
     */
    public static getBasicGet = (parameters?:Array<Parameter>): DynamicSwaggerOperation => ({
		responses:{ },
		parameters
    })


    /**
     * @Description
     * - ❌ ROUTER-WRAPPER.
     * - This method is useful if you don't want to  use the router wrapper but add your swagger schema anyway.
     * - **It is thought to be used inside the library**, iterating through the paths of the router wrapper.
     * - **Devs can't use inside the parameters of a RouterWrapper constructor**
     * - You can create the structure of a specified path and method, with a schema name that should be created elsewhere
     */
    public static addSingleApiPath = (
        tag:string, basePath:string, _path:string, method:'GET'|'POST'|'PUT'|'DELETE',
        parameters?:Array<Parameter>, bodyObj?:{ schema:string, required?:boolean, description?:string, comType?:'application/json' | 'multipart/form-data' },
        responses:Record<string, Reference | Response> = {}) =>
    {
        const path = `${this.fromExpressParamsToSwagger(basePath)}${this.fromExpressParamsToSwagger(_path)}`
        const transcribedMethod = this.restMethodToSwaggerKeyMapping[method]
        if (!this.apiDocument.paths[path]) this.apiDocument.paths[path] = {};
        if (this.apiDocument.paths[path][transcribedMethod]) return;


        this.apiDocument.paths[path][transcribedMethod] = {
            responses: responses,
            parameters,
            tags: [tag]
        }

        if (bodyObj) this.apiDocument.paths[path][transcribedMethod].requestBody = {
            required: bodyObj.required ?? false,
            description: bodyObj.description,
            content: {
                [bodyObj.comType ?? "application/json"]: {
                    schema: { "$ref": "#/components/schemas/"+bodyObj.schema }
                }
            } as {"application/json":{schema:{$ref:string}}} | {"multipart/form-data":{schema:{$ref:string}}}
        }
    }

    /**
     * @Description
     * - ❌ ROUTER-WRAPPER.
     * - 🛠️ ADD-API-PATH
     * - **This method is useful if you don't want to  use the router wrapper but add your swagger schema anyway**.
     * - You can use other other methods of this class to ease the writing
     * - It is thought to create a full section of apis (hypotetically under one single tag) **while you create the schema in the meanwhile**
     */
    public static _addApiPath = (tag:string, basePath:string, options:{ [key:string]: DynamicSwaggerPath }) =>
    {
        const finalPaths:{ [key:string]: Path } = {}
        const finalSchemas:{ [schemaName: string]: SchemaV3 } = {}
        for (const _path in options)
        {
			const path = `${basePath}${_path}`
            if (options[_path].get?.tags) options[_path].get.tags = [tag];
            finalPaths[path] = {
                get: options[_path].get,
                $ref: options[_path].$ref,
                head: options[_path].head,
                parameters: options[_path].parameters,
            }


            if (options[_path].get) options[_path].get.tags = [tag];
            if (options[_path].post && options[_path].post.requestBody)
            {
                finalPaths[path].post = {
                    responses: {},
                    parameters:options[_path].post.parameters,
                    tags: [tag],
                    summary:options[_path].post.summary,
                    requestBody: {
                        required: options[_path].post.requestBody.required,
                        description: options[_path].post.requestBody.description,
                        content: {
                          "application/json": { schema: { "$ref": "#/components/schemas/"+options[_path].post.requestBody.schemaName } }
                        }
                    }
                }

                for (const key in options[_path].post.requestBody.schema)
                {
                  if (!finalSchemas[key]) finalSchemas[key] = options[_path].post.requestBody.schema[key];
                }
            }

            if (options[_path].put && options[_path].put.requestBody)
            {
                finalPaths[path].put = {
                    responses: {},
                    tags: [tag],
                    parameters:options[_path].put.parameters,
                    summary:options[_path].put.summary,
                    requestBody: {
                        required: options[_path].put.requestBody.required,
                        description: options[_path].put.requestBody.description,
                        content: {
                          "application/json": { schema: { "$ref": "#/components/schemas/"+options[_path].put.requestBody.schemaName } }
                        }
                    }
                }

                for (const key in options[_path].put.requestBody.schema)
                {
                  if (!finalSchemas[key]) finalSchemas[key] = options[_path].put.requestBody.schema[key];
                }
            }

            if (options[_path].delete)
            {
                finalPaths[path].delete = {
                    responses: {},
                    tags: [tag],
                    parameters:options[_path].delete.parameters,
                    summary:options[_path].delete.summary,
                }

                if (options[_path].delete.requestBody)
                {
                    const finalComType = options[_path].delete.requestBody.comType ?? 'application/json' as 'application/json' | 'multipart/form-data';
                    finalPaths[path].delete.requestBody = {
                        required: options[_path].delete.requestBody.required,
                        description: options[_path].delete.requestBody.description,
                        content: {
                            [finalComType]: {
                                schema: { "$ref": "#/components/schemas/"+options[_path].delete.requestBody.schemaName }
                            }
                        }  as {"application/json":{schema:{$ref:string}}} | {"multipart/form-data":{schema:{$ref:string}}}
                    }

                    for (const key in options[_path].delete.requestBody.schema)
                    {
                        if (!finalSchemas[key]) finalSchemas[key] = options[_path].delete.requestBody.schema[key];
                    }
                }
            }
        }

		for (const path in finalPaths)
		{
			for (const method in finalPaths[path])
            {
                const methodKey = method as 'get' | 'post' | 'put' | 'delete';
                if (!this.apiDocument.paths[path]) this.apiDocument.paths[path] = {};
                if (!this.apiDocument.paths[path][methodKey]) this.apiDocument.paths[path][methodKey] = finalPaths[path][methodKey];
            }
		}

		for (const schema in finalSchemas)
		{
			if (!this.apiDocument.components || !this.apiDocument.components.schemas) this.apiDocument.components = { schemas: {} }
			if (!this.apiDocument.components.schemas![schema]) this.apiDocument.components.schemas![schema] = finalSchemas[schema];
		}
    }



    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
    // ------------------------ MICRO ------------------------ //
    // ------------------------------------------------------- //
    // ------------------------------------------------------- //
    /**
     * @Description
     * - ✅ ROUTER-WRAPPER
     * - Returns the tipical /:id parameter
     */
    public static getIdParam = (pkLabel:string = 'id'):Parameter => ({ name: pkLabel, in: "path", required: true })

    /**
     * @Description
     * - ✅ ROUTER-WRAPPER
     * - Returns the tipical list pagination parameters
     */
    public static getPaginationParams = (options?:ListOptions):Parameter[] =>
    {
        const listOptions =  {
            page:options?.page ?? 0,
            pageSize:options?.pageSize ?? 10,
            order:options?.order ?? 'ASC',
            orderBy: options?.orderBy
        } as ListOptions;

        return Object.entries(listOptions).map(([key, val]) => ({ name:key, in:'query', default:val, required: false }) as Parameter)
    }

    /**
     * @Description
     * - ✅ ROUTER-WRAPPER
     * - Creates the swagger schema expected by your api
     */
    public static createMultipartSchema = (name:string = 'file', props?:{[prop:string]:Schema}):SchemaV3 => ({
        type: 'object',
        properties: {
            [name]: { type:'string', format:'binary' },
            ...props ?? {}
        }
    })

    /**
     * @Description
     * - ✅ ROUTER-WRAPPER
     * - Creates the swagger schema expected by your api
     */
    public static createSchema = (props:{[prop:string]:Schema | ParameterType}, required?:boolean):SchemaV3 =>
    {
        const finalSchemaObject:SchemaV3 = { type: 'object', properties: {}, required }

        for (const prop in props)
        {
            if (typeof props[prop] === 'string') finalSchemaObject.properties![prop] = { type: props[prop] } as Schema
            else finalSchemaObject.properties![prop] = props[prop];
        }

        return finalSchemaObject;
    }
}
