import { BaseEntity, ColumnType, EntityMetadataNotFoundError, Equal, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere, Like } from "typeorm";
import { DynamicDbRouterOptions } from "../types/db.sptypes";
import { ListOptions, Methods, SearchQuery } from "../types/generic.sptypes";
import { Parameter, ParameterType, Schema } from "../types/swagger.sptypes";
import { DefaultTokenPayload, SecureTokenConfig } from "../types/token.sptypes";
import { errorCatcher, log } from "./_utils";
import { DbConnector } from "./DbConnector";
import { Swagger } from "./Swagger";
import { Token } from "./Token";



export class DynamicDbRouter
{
    private static tokenInstance?:Token;
    public static setTokenInstance = (tokenInstance:Token) => { this.tokenInstance = tokenInstance; }
    private static listOptionsKeys: Array<string> = ['pageSize', 'page', 'orderBy', 'order'];
    private static getTypefromReflection = (typeormType:Extract<ColumnType, string>) => this.typeormToSwaggerMapper[typeormType] ?? typeormType
    private static typeormToSwaggerMapper:Partial<Record<Extract<ColumnType, string>, ParameterType>> =
    {
        "text": "string",
        "char varying": "string",
        "char": "string",
        "character varying": "string",
        "character": "string",
        "varchar": "string",
        "varying character": "string",
        "date": "date",
        "datemultirange": "date",
        "datetime": "date",
        "int": "number",
        "integer": "number",
        "smallint": "number",
        "bigint": "number",
        "float": "number",
        "real": "number",
        "long": "number",
        "double": "number",
        "bit": "boolean",
        "bool": "boolean",
        "blob": "file",
    }


    public static createDbRouter =
    <T extends typeof BaseEntity, TokenPayload extends Record<string, any> = DefaultTokenPayload>(options:DynamicDbRouterOptions<T>) =>
    {
        if (!options.primaryKey) options.primaryKey = 'id'
        const avoidList = options.avoid ?? [];

        // --- ROUTER
        if (!avoidList.includes('LIST')) options.router.get("/", async (req, res) =>
        {
            try
            {
                let payload:null | TokenPayload = null;
                if (options.secure)
                {
                    if (this.tokenInstance) payload = await (this.tokenInstance).authorize(req) as unknown as TokenPayload;
                    else throw new Error('Api secure option on but no token instance has been provided in the starter');
                }

                // --- Assign the filtering options based on the sent api query
                // --- 1. Default Dynamic Db Get Params
                const listOptions =  {} as ListOptions;
                for (const key in req.query)
                {
                    if (this.listOptionsKeys.includes(key)) listOptions[key] = req.query[key] as string | number | boolean | undefined | null;
                }
                // --- 2.  Additional get params specified by the route creations
                const searchQuery = {} as SearchQuery;
                for (const param of options.getParameters ?? [])
                {
                    const val = req.query[param.name] ?? undefined;
                    if (param.required && !val) throw new Error(`Params Error: ${param.name} required`);
                    if (val !== undefined)
                    {
                        if (param.like) searchQuery[param.name] = Like(`%${val}%`) as any;
                        else searchQuery[param.name] = Equal(val) as any;
                    }
                }
                // --- 3.  Secure Params inside the jwt
                const secureSearchQuery = this.setSecureParams("LIST", payload, options.secure) as SearchQuery;

                // --- Getting the result
                const { page, pageSize, order, orderBy } = listOptions;
                const entities = await options.entity.find({
                    where: { ...searchQuery, ...secureSearchQuery } as FindOptionsWhere<BaseEntity>,
                    take: pageSize ?? 0,
                    skip: (page ?? 0) * (pageSize ?? 0),
                    order: { [orderBy ?? options.primaryKey!]: order ?? 'ASC' } as FindOptionsOrder<BaseEntity>,
                    select: options.returningProps as FindOptionsSelect<BaseEntity>
                });


                res.send(entities);
            }
            catch(err)
            {
                errorCatcher(res, err, undefined, `[GET]\t${options.basePath}/ => ${(err as Error).message ?? err}`);
            }
        })

        if (!avoidList.includes('GET')) options.router.get("/:id", async (req, res) =>
        {
            try
            {
                let payload:null | TokenPayload = null;
                if (options.secure)
                {
                    if (this.tokenInstance) payload = await this.tokenInstance.authorize(req) as unknown as TokenPayload;
                    else throw new Error('Api secure option on but no token instance has been provided in the starter');
                }
                const secureSearchQuery = this.setSecureParams("GET", payload, options.secure) as SearchQuery;

                const id = req.params.id;
                const singleEntity = await options.entity.findOne({
                    where: { [options.primaryKey!]: Equal(id), ...secureSearchQuery } as FindOptionsWhere<BaseEntity>,
                    select: options.returningProps as FindOptionsSelect<BaseEntity>
                });
                res.send(singleEntity);
            }
            catch(err)
            {
                errorCatcher(res, err, undefined, `[GET]\t${options.basePath}/:id => ${(err as Error).message ?? err}`);
            }
        })

        if (!avoidList.includes('POST')) options.router.post("/", async (req, res) =>
        {
            try
            {
                let payload:null | TokenPayload = null;
                if (options.secure)
                {
                    if (this.tokenInstance) payload = await this.tokenInstance.authorize(req) as unknown as TokenPayload;
                    else throw new Error('Api secure option on but no token instance has been provided in the starter');
                }
                const secureSearchQuery = this.setSecureParams("POST", payload, options.secure) as T;

                const finalBody = {} as T
                const body:T = req.body;
                for (const key in body)
                {
                    if (key !== options.primaryKey && (!options.bodyParameters || options.bodyParameters.properties?.[key]))
                    {
                        finalBody[key] = body[key]
                    }
                }
                for (const key in secureSearchQuery)
                {
                    finalBody[key] = secureSearchQuery[key]
                }

                const newEntity = await options.entity.create(finalBody).save();

                const result = {} as Record<string, any>
                for (const key in newEntity)
                {
                    if (!options.returningProps || options.returningProps.includes(key)) result[key] = (newEntity as Record<string, any>)[key];
                }

                res.send(result);
            }
            catch(err)
            {
                errorCatcher(res, err, undefined, `[POST]\t${options.basePath}/ => ${(err as Error).message ?? err}`);
            }
        })

        if (!avoidList.includes('PUT')) options.router.put("/:id", async (req, res) =>
        {
            try
            {
                let payload:null | TokenPayload = null;
                if (options.secure)
                {
                    if (this.tokenInstance) payload = await this.tokenInstance.authorize(req) as unknown as TokenPayload;
                    else throw new Error('Api secure option on but no token instance has been provided in the starter');
                }
                const secureSearchQuery = this.setSecureParams("PUT", payload, options.secure) as T;

                const id = req.params.id;
                const body:T = req.body;

                const singleEntity:T | null= await options.entity.findOneBy({ [options.primaryKey!]: Equal(id) }) as T | null;
                if (singleEntity === null) throw new Error("Entity not found");

                for (const key in body)
                {
                    if (key !== options.primaryKey && key in singleEntity)
                    {
                        if (!options.bodyParameters || options.bodyParameters.properties?.[key])
                        {
                            singleEntity[key] = body[key];
                        }
                    }
                }

                for (const key in secureSearchQuery)
                {
                    singleEntity[key] = body[key];
                }

                await options.entity.save(singleEntity);

                const result = {} as T
                for (const key in singleEntity)
                {
                    if (!options.returningProps ||options.returningProps.includes(key)) result[key as keyof T] = singleEntity[key];
                }

                res.send(result);
            }
            catch(err)
            {
                errorCatcher(res, err, undefined, `[PUT]\t${options.basePath}/:id => ${(err as Error).message ?? err}`);
            }
        })

        if (!avoidList.includes('DELETE')) options.router.delete("/:id", async (req, res) =>
        {
            try
            {
                let payload:null | TokenPayload = null;
                if (options.secure)
                {
                    if (this.tokenInstance) payload = await this.tokenInstance.authorize(req) as unknown as TokenPayload;
                    else throw new Error('Api secure option on but no token instance has been provided in the starter');
                }
                const secureSearchQuery = this.setSecureParams("DELETE", payload, options.secure) as SearchQuery;

                const id = req.params.id;
                const singleEntity = await options.entity.findOneBy({ [options.primaryKey!]: Equal(id), ...secureSearchQuery });
                if (singleEntity === null) throw new Error("Entity not found");

                await options.entity.remove(singleEntity);
                const result = {} as Record<string, any>
                for (const key in singleEntity)
                {
                    if (!options.returningProps || options.returningProps.includes(key)) result[key] = (singleEntity as Record<string, any>)[key];
                }

                res.send(singleEntity);
            }
            catch(err)
            {
                errorCatcher(res, err, undefined, `[DELETE]\t${options.basePath}/:id => ${(err as Error).message ?? err}`);
            }
        })

        return options.router
    }

    public static addDbRouterSwagger = <T extends typeof BaseEntity>(options:DynamicDbRouterOptions<T>) =>
    {
        if (!options.primaryKey) options.primaryKey = 'id'
        const avoidList = options.avoid ?? [];

        try
        {
            let schemaProperties:{ [key:string]: Schema } = {}
            if (options.bodyParameters && options.bodyParameters)
            {
                const defaultOverridingSchema = options.bodyParameters;
                for (const param in defaultOverridingSchema.properties)
                {
                    const paramValue = defaultOverridingSchema.properties[param]
                    schemaProperties[param] = {
                        type: paramValue.type,
                        required: paramValue.required
                    }
                }
            }
            else
            {
                const metadata = DbConnector.getDataSource().getMetadata(options.entity);
                for (const col of metadata.columns)
                {
                    if (col.propertyName === options.primaryKey) continue;
                    schemaProperties[col.propertyName] = {
                        type: this.getTypefromReflection(col.type.toString() as Extract<string, ParameterType>) as ParameterType,
                    }
                }
            }

            if (!avoidList.includes('POST') || !avoidList.includes('PUT'))
            {
                Swagger.addSchema(options.tag, schemaProperties)
            }
        }
        catch(err)
        {
            if (err instanceof EntityMetadataNotFoundError)
                log.error(`[${options.entity.name}]\tMetadata required for db routing but not connected on the database`)
        }


        if (!avoidList.includes('LIST'))
        {
            const listOptions =  { page:0, pageSize:10, order:'ASC', orderBy: options.primaryKey } as ListOptions;

            Swagger.addSingleApiPath(options.tag, options.basePath, '/', 'GET', [
                ...Object.entries(listOptions).map(([key, val]) => ({ name:key, in:'query', default:val, required: false }) as Parameter),
                ...(options.getParameters ?? []) as Parameter[]
            ])
        }
        if (!avoidList.includes('GET'))
        {
            Swagger.addSingleApiPath(options.tag, options.basePath, `/{${options.primaryKey}}`, 'GET', [
                { name: options.primaryKey!, in: "path", required: true },
                ...(options.getParameters ?? []) as Parameter[]
            ])
        }
        if (!avoidList.includes('POST'))
        {
            Swagger.addSingleApiPath(options.tag, options.basePath, '/', 'POST', undefined, { schema: options.tag })
        }
        if (!avoidList.includes('PUT'))
        {
            Swagger.addSingleApiPath(
                options.tag, options.basePath, `/{${options.primaryKey}}`, 'PUT',
                [{ name: options.primaryKey!, in: "path", required: true }], { schema: options.tag }
            )
        }
        if (!avoidList.includes('DELETE'))
        {
            Swagger.addSingleApiPath(options.tag, options.basePath, `/{${options.primaryKey}}`, 'DELETE', [
                { name: options.primaryKey!, in: "path", required: true }
            ])
        }
    }




    private static setSecureParams = <TokenPayload extends Record<string, any>>(method:Methods | "LIST", payload: null | TokenPayload, secure?:SecureTokenConfig):Record<string, any> =>
    {
        const searchQuery = {} as Record<string, any>

        if (secure !== undefined && typeof secure === 'object' && payload !== null)
        {
            for (const secureParam in secure)
            {
                const secureParamVal = secure[secureParam]
                if (secureParamVal.methods === "*" || secureParamVal.methods.includes(method) && payload[secureParamVal.tokenKey])
                {
                    if ((["LIST", "GET", "DELETE"]).includes(method)) searchQuery[secureParam] = Equal(payload[secureParamVal.tokenKey]) as any;
                    else searchQuery[secureParam] = payload[secureParamVal.tokenKey];
                }
            }
        }

        return searchQuery;
    }
}
