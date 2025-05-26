import { Router } from "express"
import { BaseEntity } from "typeorm"
import { Methods } from "./generic.sptypes"
import { Parameter, SchemaV3 } from "./swagger.sptypes"
import { SecureTokenConfig } from "./token.sptypes"

export type DynamicDbRouterOptions<T extends typeof BaseEntity> = {
    router:Router,
    entity:T,
    primaryKey?:string,
    tag:string
    basePath:string,
    getParameters?:Array<Parameter>
    bodyParameters?:SchemaV3
    avoid?:Array<Methods | 'LIST'>,
    secure?:SecureTokenConfig,
    returningProps?:string[]
}
