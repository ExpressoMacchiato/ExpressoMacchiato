import express, { Express } from "express";
import http from 'http';
import path from "path";
import swaggerUi from "swagger-ui-express";
import { EntitySchema, MixedList } from "typeorm";
import { ProjectConfigs } from "../types/generic.sptypes";
import { StarterOptions } from "../types/starter.sptypes";
import { DbConnector } from "./DbConnector";
import { DynamicDbRouter } from "./DynamicDbRouter";
import { Swagger } from "./Swagger";
import { log } from "./_utils";

export class Starter
{
	constructor(options:StarterOptions)
	{
		try
		{
			log.setFilePath(options.projectConfig.ERROR_FILE_PATH);
			this.init(options);
		}
		catch (err)
		{
			log.logError(err);
		}
	}


	private init:(options:StarterOptions) => void = async (options) =>
	{
		const app:Express = express();


		// --- DB
		if (options.db)
		{
			await this.initDb(options.projectConfig, options.db.entities, options.db.migrations, options.db.sync);
			if (options.db.afterDbConnection) await options.db.afterDbConnection();
		}

		// --- Plugins
		for (const plugin of options.plugins ?? []) app.use(plugin);

		// --- Routers
		for (const router of options.routers ?? []) app.use(router.basePath, router.createExpressRouter())

		// --- Swagger
		if (options.swagger === undefined || options.swagger) {
			Swagger.addServer({ url: `http://127.0.0.1:${options.projectConfig.SERVER_PORT}` })

			app.get('/swagger', (_, res) => {
				const openAPIDocument = Swagger.generateOpenAPIDocument();
				res.json(openAPIDocument);
			});
			app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(undefined, {
				swaggerOptions: {
					url: "/swagger"
				}
			}));
		}

		// --- Client
		if (options.tokenOptions) DynamicDbRouter.setTokenInstance(options.tokenOptions.tokenInstance)
		if (options.clientPath)
		{
			const clientPath =  path.resolve(process.cwd(), "client");
			app.use(express.static(clientPath));

			app.get("/apiUrl", (_, res) => res.send(options.projectConfig.API_URL))
			if (options.tokenOptions?.api)
			{
				app.get(options.tokenOptions.api.path ?? '/api/auth', options.tokenOptions.api.callback);
			}
			app.get("*", (_, res) => {
				res.sendFile(path.join(clientPath as string, "index.html"));
			});
		}


		// --- Listen App
		if (options.socket === undefined || options.socket === false)
		{
			// --- Before App Listening
        	if (options.beforeStartListening) options.beforeStartListening(app);
			app.listen(options.projectConfig.SERVER_PORT, () => log.base("Server started.", `Listening on port ${options.projectConfig.SERVER_PORT}`));
		}
		else if (options.socket === true)
		{
			const server = http.createServer(app)
			if (options.beforeStartListening) options.beforeStartListening(app, server);
			server.listen(options.projectConfig.SERVER_PORT, () => log.base("Server started.", `Listening on port ${options.projectConfig.SERVER_PORT}`))
		}
	};

	private initDb = async (projectConfig:ProjectConfigs, entities:MixedList<Function | string |EntitySchema>, migrations?:string[], sync?:boolean) =>
	{
		const connector = new DbConnector(projectConfig)
		await connector.connect(entities, migrations, sync)
	}
}
