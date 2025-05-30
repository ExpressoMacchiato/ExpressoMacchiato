import { Express } from "express"
import http from "http"
import { Server, ServerOptions } from "socket.io"
import { EntitySchema, MixedList } from "typeorm"
import { RouterWrapper } from "../src/RouterWrapper"
import { SocketWrapper } from "../src/SocketWrapper"
import { Token } from "../src/Token"
import { ProjectConfigs } from "./generic.sptypes"
import { TokenApiOptions } from "./token.sptypes"

export type StarterOptions = {
    plugins?:Array<any>,
    routers?:Array<RouterWrapper>,
    clientPath?:string,
    swagger?:boolean,
    projectConfig:ProjectConfigs,
    beforeStartListening?:(app:Express, httpServer?:http.Server, socketIoServerInstance?:Server) => void,
    sockets?: {
        wrappers:Array<SocketWrapper>,
        options?:ServerOptions
    },
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
