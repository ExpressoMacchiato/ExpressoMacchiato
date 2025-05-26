import { Response } from "express";
import { Logger } from "utils-logger-av";
import { ErrorsMapping, ExpressReturn } from "../types/generic.sptypes";

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
        this.logFile(`[${service.toUpperCase()}]: ${message}`);
    }
    fullLogNok = (service:string, error:any, ...args:any[]) =>
    {
        const errMessage:string = (error as Error)?.message ?? error
        this.nok(`[${service.toUpperCase()}]: ${errMessage}`);
        this.logFile(`[${service.toUpperCase()}]: ${errMessage}, ${args.join(',')}`, 'error');
    }
}

export const log:MyLogger = new MyLogger({ primaryColor: "cyan", logFilePath: process.env.ERROR_FILE_PATH });
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
