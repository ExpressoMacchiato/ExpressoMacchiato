import { Namespace, Server, Socket } from "socket.io";
import { ConnectedSocketClient, SocketWrapperConstructor } from "../types/socket.sptypes";
import { fullLogNok, log } from "./_utils";

export class SocketWrapper<Metadata extends Record<string, any> = any>
{
    protected connectedClients: Map<string, ConnectedSocketClient> = new Map();

    public readonly socketNamespace: string;
    protected readonly data: SocketWrapperConstructor<Metadata>;
    protected namespace?: Namespace;

    constructor(data: SocketWrapperConstructor<Metadata>)
    {
        this.socketNamespace = data.socketNamespace;
        this.data = data;

        Object.keys(data.listeners ?? {}).forEach(key => {
            (this as any)[key] = data.listeners?.[key].bind(this);
        });
    }

    public setupConnection = (io: Server) =>
    {
        try
        {
            if (!this.data.listeners) throw new Error('No listeners provided');

            this.namespace = io.of(`/${this.socketNamespace}`);

            // Before Connection Middleware
            if (this.data.connectionMiddleware)
            {
                io.use(async (client, next) =>
                {
                    const commId = client.handshake.query.commId as string | undefined;
                    const metadata = client.handshake.query.metadata as Metadata | undefined;

                    const beforeResult = await this.data.connectionMiddleware!(this, client, commId, metadata);
                    if (!beforeResult.ok)
                    {
                        const err = new Error(beforeResult.message);
                        return next(err);
                    }

                    if (beforeResult.newMetadata) client.handshake.query.metadata = beforeResult.newMetadata as any;
                    next();
                });
            }

            // Connection Event
            io.on('connection', (client) =>
            {
                try
                {
                    if (!this.namespace) throw new Error('Socket.IO not initialized');

                    const metadata = client.handshake.query.metadata as Metadata | undefined;
                    const finalClientId = this.data.clientConnectionKey ? (metadata?.[this.data.clientConnectionKey] ?? client.id) : client.id;
                    this.connectedClients.set(finalClientId, { socket: client, connectedAt: new Date(), metadata });
                    log.cyan(`[SOCKETWRAPPER] [${this.socketNamespace.toUpperCase()}] Client ${client.id} connected`);
                    if (this.data.afterClientConnect) this.data.afterClientConnect(this, client, metadata);

                    for (const eventName in this.data.listeners) client.on(eventName, (...params:any[]) => this.data.listeners?.[eventName](this, client, metadata, ...params));
                    client.on('disconnect', () => this.handleDisconnection(client));
                }
                catch (err)
                {
                    fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
                }
            });
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }


    protected handleDisconnection = (client: Socket) =>
    {
        try
        {
            if (!this.namespace) throw new Error('Socket.IO not initialized');

            this.connectedClients.delete(client.id);
            log.cyan(`[SOCKETWRAPPER] [${this.socketNamespace.toUpperCase()}] Client ${client.id} disconnected`);

            if (this.data.onClientDisconnect) this.data.onClientDisconnect(client);
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }

    // --- SEND METHODS
    public broadcast = (eventName: string, data: any) =>
    {
        try
        {
            if (!this.namespace) throw new Error('Socket.IO not initialized');
            this.namespace.emit(eventName, data);
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }

    public broadcastExceptClient = (clientId:string, eventName: string, data: any) =>
    {
        try
        {
            for (const [id, client] of this.connectedClients.entries())
            {
                if (id !== clientId) client.socket.emit(eventName, data);
            }
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }

    public sendToClient = (clientId: string, eventName: string, data: any) =>
    {
        try
        {
            const connectedClient = this.connectedClients.get(clientId);
            if (!connectedClient) throw new Error(`Client ${clientId} not found`);
            connectedClient.socket.emit(eventName, data);
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }

    public sendToRoom = (room: string, eventName: string, data: any) =>
    {
        try
        {
            if (!this.namespace) throw new Error('Socket.IO not initialized');
            this.namespace.to(room).emit(eventName, data);
        }
        catch (err)
        {
            fullLogNok(`SOCKETWRAPPER`, `[${this.socketNamespace.toUpperCase()}]`, err);
        }
    }

    // --- GETTERS
    public getConnectedSockets = () => Array.from(this.connectedClients.values());

    public getClientById = (clientId: string) => this.connectedClients.get(clientId);

    public getClientByMetadataKey = (key: keyof Metadata, value: any) =>
    {
        for (const client of this.connectedClients.values())
        {
            if (client.metadata && client.metadata[key] === value) return client;
        }

        return undefined;
    }
}
