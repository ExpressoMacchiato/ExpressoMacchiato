import { Request, Response } from "express"
import { Methods } from "./generic.sptypes"

export type DefaultTokenPayload = { id: string, [key:string]:any }

export type SecureTokenConfig = boolean | { [columnName:string]:{
    tokenKey:string,
    methods:"*" | Array<Methods | "LIST">
} }


export type TokenConstructor =
{
    SECRET_KEY:string,
    ExpTime:number,
    EncAlgorithm:string // https://github.com/panva/jose/issues/210#jwe-alg
    KeyLength:number
}

export type TokenApiOptions = { path?:string, callback:(req:Request, res:Response) => Promise<void> }
