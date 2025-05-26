import { Response as ExpressResponse, Request, RequestHandler } from "express";
import { BaseEntity } from "typeorm";
import { ExpressReturn, Methods } from "./generic.sptypes";
import { Parameter, Reference, SchemaV3, Response as SwaggerResponse } from "./swagger.sptypes";
import { SecureTokenConfig } from "./token.sptypes";

export interface RouterWrapperInterface<T extends typeof BaseEntity = typeof BaseEntity> {
    basePath:string;
    tag:string,
    swaggerNewSchemas?:{ [schema:string]: SchemaV3 },
    dbRouting?:{
        entity:T,
        primaryKey?:string,
        getParameters?:Array<Parameter>
        bodyParameters?:SchemaV3,
        avoid?:Array<Methods | 'LIST'>,
        secure?:SecureTokenConfig,
        returningProps?:string[]
    }
    apis?: Record<string, {
        'GET'?:MethodPathHandling
        'POST'?:MethodPathHandling
        'PUT'?:MethodPathHandling
        'DELETE'?:MethodPathHandling
    }>
}

export type MethodPathHandling = {
    swaggerBody?:{
        schema:string,
        required?:boolean,
        description?:string,
        comType?:'application/json' | 'multipart/form-data',
    },
    swaggerResponses?:Record<string, Reference | SwaggerResponse>,
    swaggerParameters?:Array<Parameter>
    middlewares?: RequestHandler[];
    handler: (req:Request, res:ExpressResponse) => Promise<ExpressReturn>
}
