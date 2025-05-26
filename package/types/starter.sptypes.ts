import { Express } from "express"
import http from "http"
import { EntitySchema, MixedList } from "typeorm"
import { RouterWrapper } from "../src/RouterWrapper"
import { Token } from "../src/Token"
import { ProjectConfigs } from "./generic.sptypes"
import { TokenApiOptions } from "./token.sptypes"

export type StarterOptions = {
    plugins?:Array<any>,
    routers?:Array<RouterWrapper>,
    clientPath?:string,
    swagger?:boolean,
    projectConfig:ProjectConfigs,
    beforeStartListening?:(app:Express, server?:http.Server) => void,
    socket?:boolean,
    tokenOptions?: {
        tokenInstance: Token,
        api?:TokenApiOptions
    }
    db?:{
        entities:MixedList<Function | string |EntitySchema>,
        migrations?:string[],
        sync?:boolean,
        afterDbConnection?:() => Promise<void>
    },
}



export type SocketWrapperConstructor = {
    name:string,
    beforeConnection?:() => Promise<void>
    onDisconnect?:(...params:any[]) => Promise<void>
    listeners?:Record<string, (...params:any[]) => Promise<void>>
}
