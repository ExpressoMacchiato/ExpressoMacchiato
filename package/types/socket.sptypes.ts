import { Socket } from "socket.io";
import { SocketWrapper } from "../src";

export type ConnectedSocketClient<Metadata = any> = {
    socket: Socket;
    connectedAt: Date;
    metadata?: Metadata;
}

export type SocketConnectionNok = { ok:false, message:string }
export type SocketConnectionOk<Metadata = any> = { ok:true, newMetadata?: Metadata }


export type SocketConnectionMiddleware<Metadata extends Record<string, any> = any> = (self:SocketWrapper, client:Socket, commId?:string, metadata?:Metadata) => Promise<SocketConnectionOk<Metadata> | SocketConnectionNok>
export type SocketWrapperConstructor<Metadata extends Record<string, any> = any> =
{
    socketNamespace:string,
    clientConnectionKey?:string,
    connectionMiddleware?:SocketConnectionMiddleware<Metadata>
    afterClientConnect?: (self:SocketWrapper, client:Socket, metadata?:Metadata) => Promise<void>
    onClientDisconnect?:(...params:any[]) => Promise<void>
    listeners?:Record<string, (self:SocketWrapper, client:Socket, metadata:any, ...params:any[]) => Promise<void>>
}
