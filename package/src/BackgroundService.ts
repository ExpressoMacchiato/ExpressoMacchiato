import { BackgroundServiceConstructor } from "../types/service.sptypes";
import { fullLogNok } from "./_utils";

export class BackgroundService
{
    public readonly name:string;
    public readonly main: () => Promise<void>;

    constructor(data:BackgroundServiceConstructor)
    {
        this.name = data.name;
        this.main = async () =>
        {
            try { await data.main(); }
            catch (error) { fullLogNok('BACKGROUND-SERVICE', `${this.name.toUpperCase()}`, error) }
        };
    }
}
