import { Response } from "express";
import path from "path";
import { Logger, getStringedColor } from "utils-logger-av";
import { ErrorsMapping, ExpressReturn } from "../types/generic.sptypes";
import { SocketConnectionNok, SocketConnectionOk } from "../types/socket.sptypes";

// --- Logs
class MyLogger extends Logger
{
    setFilePath = (filePath?:string) =>
    {
        this.logFilePath = filePath!;
    }

    fullLogOk = (service:string, message:string) =>
    {
        this.ok(`[${service.toUpperCase()}]: ${message}`);
        this.file(`[${service.toUpperCase()}]: ${message}`);
    }
    fullLogNok = (service:string, ...args:any[]) =>
    {
        let finalString = `[${service.toUpperCase()}]: `;
        for (let i = 0; i < args.length; i++) if (i === args.length - 1) finalString += (args[i] as Error)?.message ?? args[i];
        else finalString += args[i] + ' ';

        this.nok(`[${service.toUpperCase()}]: ${finalString}`);
        this.file(`[${service.toUpperCase()}]: ${finalString}`, 'error');
    }
}

export const log:MyLogger = new MyLogger({ primaryColor: "cyan", logFilePath: process.env.ERROR_FILE_PATH });
export const i = Logger.icons;
export const c = getStringedColor;
export const { fullLogOk, fullLogNok } = log;



// --- Apis
export const apiOk = (res:any, status:number = 200, contentType?:string):ExpressReturn => ({ result:res, status, contentType, isOk:true })
export const apiNok = (err:any, status:number = 500):ExpressReturn => ({ result:err, status, isOk:false })
export const errorCatcher = (res:Response, err:unknown, errorsList?:ErrorsMapping, errorString?:string) =>
{
    if (errorString) fullLogNok('api-dynamicdb', errorString);
    if (err instanceof Error === false) {
        res.status(500).send({ message: err });
        return;
    }

    const error = (errorsList ?? {})[err.message] ?? null;
    if (!error) res.status(500).send({ message: err.message });
    else res.status(error.status ?? 500).send({ message: error.responseMessage ?? err.message });
};


// --- Sockets
export const socketOk = <T extends Record<string, any> = any>(newMetadata?:T):SocketConnectionOk => ({ ok:true, newMetadata:newMetadata });
export const socketNok = (message:string):SocketConnectionNok => ({ ok:false, message });


// --- Generics
export const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));
export const getCompiledPath = (__filename:string, __dirname:string, pathsWithoutExtension:string[]) =>
{
    const isCompiled = __filename.endsWith('.js');
    return pathsWithoutExtension.map(p => (path.join(__dirname, p + (isCompiled ? '.js' : '.ts'))).replaceAll('\\', '/'));
}
