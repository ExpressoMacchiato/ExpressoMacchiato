export interface Info {
    title: string;
    version: string;
    description?: string | undefined;
    termsOfService?: string | undefined;
    contact?: Contact | undefined;
    license?: License | undefined;
}

export interface Contact {
    name?: string | undefined;
    email?: string | undefined;
    url?: string | undefined;
}

export interface License {
    name: string;
    url?: string | undefined;
}

export interface ExternalDocs {
    url: string;
    description?: string | undefined;
}

export interface Tag {
    name: string;
    description?: string | undefined;
    externalDocs?: ExternalDocs | undefined;
}

export interface Header extends BaseSchema {
    type: ParameterType;
}

// ----------------------------- Parameter -----------------------------------

export type ParameterType = "string" | "number" | "integer" | "boolean" | "array" | "object" | "file" | "date";

export type BaseParameter = {
    name: string;
    in: "body" | "query" | "path" | "header" | "formData";
    required?: boolean | undefined;
    description?: string | undefined;
};

export type BodyParameter = BaseParameter & {
    in: "body";
    schema?: Schema | undefined;
};

export type GenericFormat = {
    type?: ParameterType | undefined;
    format?: string | undefined;
};

export type IntegerFormat = {
    type: "integer";
    format?: "int32" | "int64" | undefined;
};

export type NumberFormat = {
    type: "number";
    format?: "float" | "double" | undefined;
};

export type StringFormat = {
    type: "string";
    format?: "" | "byte" | "binary" | "date" | "date-time" | "password" | undefined;
};

export type SchemaFormatConstraints = GenericFormat | IntegerFormat | NumberFormat | StringFormat;
export type BaseFormatContrainedParameter = BaseParameter & SchemaFormatConstraints;
export type ParameterCollectionFormat = "csv" | "ssv" | "tsv" | "pipes" | "multi";

export type QueryParameter =
    & BaseFormatContrainedParameter
    & BaseSchema
    & {
        in: "query";
        allowEmptyValue?: boolean | undefined;
        collectionFormat?: ParameterCollectionFormat | undefined;
    };

export type PathParameter =
    & BaseFormatContrainedParameter
    & BaseSchema
    & {
        in: "path";
        required: boolean;
    };

export type HeaderParameter =
    & BaseFormatContrainedParameter
    & BaseSchema
    & {
        in: "header";
    };

export type FormDataParameter =
    & BaseFormatContrainedParameter
    & BaseSchema
    & {
        in: "formData";
        type: ParameterType | "file";
        allowEmptyValue?: boolean | undefined;
        collectionFormat?: ParameterCollectionFormat | undefined;
    };

export type Parameter = { like?:boolean} & (BodyParameter | FormDataParameter | QueryParameter | PathParameter | HeaderParameter);

// ------------------------------- Path --------------------------------------
export interface Path {
    $ref?: string | undefined;
    get?: Operation | undefined;
    put?: Operation | undefined;
    post?: Operation | undefined;
    delete?: Operation | undefined;
    options?: Operation | undefined;
    head?: Operation | undefined;
    patch?: Operation | undefined;
    parameters?: Array<Parameter | Reference> | undefined;
}



export interface DynamicSwaggerPath {
    $ref?: string | undefined;
    get?: DynamicSwaggerOperation | undefined;
    put?: DynamicSwaggerOperationBody | undefined;
    post?: DynamicSwaggerOperationBody | undefined;
    delete?: DynamicSwaggerOperationBody | undefined;
    options?: DynamicSwaggerOperation | undefined;
    head?: DynamicSwaggerOperation | undefined;
    patch?: DynamicSwaggerOperation | undefined;
    parameters?: Array<Parameter | Reference> | undefined;
}



// ----------------------------- Components -----------------------------------
export interface Components {
    schemas?: { [schemaName: string]: SchemaV3 };
    parameters?: { [parameterName: string]: Parameter };
    securitySchemes?:Record<string, {
        type: 'http',
        scheme: 'bearer',
        bearerFormat?: 'JWT'
    }>
}



// ----------------------------- Operation -----------------------------------
export interface Operation {
    responses: { [responseName: string]: Response | Reference };
    summary?: string | undefined;
    description?: string | undefined;
    externalDocs?: ExternalDocs | undefined;
    operationId?: string | undefined;
    produces?: string[] | undefined;
    consumes?: string[] | undefined;
    parameters?: Array<Parameter | Reference> | undefined;
    schemes?: string[] | undefined;
    deprecated?: boolean | undefined;
    security?: Array<{ [securityDefinitionName: string]: string[] }> | undefined;
    tags?: string[] | undefined;
    requestBody?:RequestBodyOperation
}

export interface DynamicSwaggerOperation {
    responses: { [responseName: string]: Response | Reference };
    summary?: string | undefined;
    description?: string | undefined;
    operationId?: string | undefined;
    parameters?: Array<Parameter | Reference> | undefined;
    deprecated?: boolean | undefined;
    security?: Array<{ [securityDefinitionName: string]: string[] }> | undefined;
    tags?: string[] | undefined;
}
export interface DynamicSwaggerOperationBody {
    responses: { [responseName: string]: Response | Reference };
    summary?: string | undefined;
    description?: string | undefined;
    operationId?: string | undefined;
    parameters?: Array<Parameter | Reference> | undefined;
    deprecated?: boolean | undefined;
    security?: Array<{ [securityDefinitionName: string]: string[] }> | undefined;
    tags?: string[] | undefined;
    requestBody?:{
        required:boolean,
        description?:string,
        schemaName:string,
        schema?:{ [key:string]: SchemaV3 },
        comType?:'multipart/form-data' | 'application/json' | undefined;
    }
}




export type RequestBodyOperation = {
    description?: string;
    required:boolean;
    content: {
        "application/json": {
          schema: { $ref: string }
        }
      }
    | {
        "multipart/form-data": {
          schema: { $ref: string }
        }
    };
}
export type DynamicSwaggerRequestBodyOperation = {
    description?: string;
    required:boolean;
    content: {
        "application/json": {
            schema: { $ref: string }
        }
    }
}
// ----------------------------- Reference -----------------------------------
export interface Reference {
    $ref: string;
}

// ----------------------------- Response ------------------------------------
export interface Response {
    description: string;
    schema?: Schema | undefined;
    headers?: { [headerName: string]: Header } | undefined;
    examples?: { [exampleName: string]: {} } | undefined;
}

// ------------------------------ Schema -------------------------------------
export type BaseSchema = {
    type?: ParameterType | undefined;
    format?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    default?: any;
    multipleOf?: number | undefined;
    maximum?: number | undefined;
    exclusiveMaximum?: boolean | undefined;
    minimum?: number | undefined;
    exclusiveMinimum?: boolean | undefined;
    maxLength?: number | undefined;
    minLength?: number | undefined;
    pattern?: string | undefined;
    maxItems?: number | undefined;
    minItems?: number | undefined;
    uniqueItems?: boolean | undefined;
    maxProperties?: number | undefined;
    minProperties?: number | undefined;
    enum?: any[] | undefined;
    items?: Schema | Schema[] | undefined;
};

export interface Schema extends BaseSchema {
    $ref?: string | undefined;
    allOf?: Schema[] | undefined;
    additionalProperties?: Schema | boolean | undefined;
    properties?: { [propertyName: string]: Schema } | undefined;
    discriminator?: string | undefined;
    readOnly?: boolean | undefined;
    xml?: XML | undefined;
    externalDocs?: ExternalDocs | undefined;
    example?: any;
    required?:boolean;
}

export interface SchemaV3 extends BaseSchema {
    type:"object"
    properties?: { [propertyName: string]: Schema } | undefined;
    required?:boolean;
}

export interface XML {
    name?: string | undefined;
    namespace?: string | undefined;
    prefix?: string | undefined;
    attribute?: boolean | undefined;
    wrapped?: boolean | undefined;
}

// ----------------------------- Security ------------------------------------
export interface BaseSecurity {
    type: "basic" | "apiKey" | "oauth2";
    description?: string | undefined;
}

export interface BasicAuthenticationSecurity extends BaseSecurity {
    type: "basic";
}

export interface ApiKeySecurity extends BaseSecurity {
    type: "apiKey";
    name: string;
    in: "query" | "header";
}

export interface BaseOAuthSecurity extends BaseSecurity {
    type: "oauth2";
    flow: "accessCode" | "application" | "implicit" | "password";
    scopes?: OAuthScope | undefined;
}

export interface OAuth2ImplicitSecurity extends BaseOAuthSecurity {
    type: "oauth2";
    flow: "implicit";
    authorizationUrl: string;
}

export interface OAuth2PasswordSecurity extends BaseOAuthSecurity {
    type: "oauth2";
    flow: "password";
    tokenUrl: string;
}

export interface OAuth2ApplicationSecurity extends BaseOAuthSecurity {
    type: "oauth2";
    flow: "application";
    tokenUrl: string;
}

export interface OAuth2AccessCodeSecurity extends BaseOAuthSecurity {
    type: "oauth2";
    flow: "accessCode";
    tokenUrl: string;
    authorizationUrl: string;
}

export interface OAuthScope {
    [scopeName: string]: string;
}

export type Security =
    | BasicAuthenticationSecurity
    | OAuth2AccessCodeSecurity
    | OAuth2ApplicationSecurity
    | OAuth2ImplicitSecurity
    | OAuth2PasswordSecurity
    | ApiKeySecurity;

// --------------------------------- Spec ------------------------------------
export type Server = {
    url:string;
    description?:string;
}


export interface Spec {
    openapi:"3.0.4";
    info: Info;
    servers: Server[];
    paths: { [pathName: string]: Path };
    tags?: Tag[];
    components?:Components;

    externalDocs?: ExternalDocs | undefined;
    host?: string | undefined;
    basePath?: string | undefined;
    schemes?: string[] | undefined;
    consumes?: string[] | undefined;
    produces?: string[] | undefined;
    definitions?: { [definitionsName: string]: Schema } | undefined;
    parameters?: { [parameterName: string]: BodyParameter | QueryParameter } | undefined;
    responses?: { [responseName: string]: Response } | undefined;
    security?: Array<{ [securityDefinitionName: string]: string[] }> | undefined;
    securityDefinitions?: { [securityDefinitionName: string]: Security } | undefined;

}
