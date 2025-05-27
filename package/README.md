<p align="center">
  <img src="https://raw.githubusercontent.com/ExpressoMacchiato/ExpressoMacchiato/refs/heads/master/_github_assets/expresso-macchiato.svg" style="height: 220px;" />
</p>

<p align="center">
  <!-- ⭐ GitHub Stars -->
  <a href="https://github.com/ExpressoMacchiato/ExpressoMacchiato/stargazers">
    <img src="https://img.shields.io/github/stars/ExpressoMacchiato/ExpressoMacchiato?style=social" alt="GitHub stars" />
  </a>
  <!-- 🐛 Issues aperti -->
  <a href="https://github.com/ExpressoMacchiato/ExpressoMacchiato/issues">
    <img src="https://img.shields.io/github/issues/ExpressoMacchiato/ExpressoMacchiato" alt="GitHub issues" />
  </a>
  <!-- 🔃 Pull Requests -->
  <a href="https://github.com/ExpressoMacchiato/ExpressoMacchiato/pulls">
    <img src="https://img.shields.io/github/issues-pr/ExpressoMacchiato/ExpressoMacchiato" alt="GitHub pull requests" />
  </a>
  <!-- 📦 Ultima Release -->
  <a href="https://github.com/ExpressoMacchiato/ExpressoMacchiato/releases">
    <img src="https://img.shields.io/github/v/release/ExpressoMacchiato/ExpressoMacchiato" alt="GitHub release" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/typescript-5.3.3-blue" alt="Typescript" />
  <img src="https://img.shields.io/badge/express-4.18.2-teal" alt="Express" />
  <img src="https://img.shields.io/badge/typeorm-0.3.21-teal" alt="TypeORM" />
</p>


<br>
<p align="center" style="font-size: 1.2rem;">
  💡 <strong>Check the full documentation</strong><br>
  👉 Visit <a href="https://alessios-books.gitbook.io/expresso-macchiato">expresso-macchiato docs</a> for the full API reference and guides.
</p>
<br>


## 🧘 Relax. Let expresso-macchiato handle it.
Writing a fully operational backend server—with routes, a database, and documentation—shouldn’t feel like crafting a rocket 🚀. With expresso-macchiato, the setup is minimal, the structure is clean, and the flexibility is in your hands.

No more boilerplate. No more endless wiring.

## 🧩 What is expresso-macchiato?
expresso-macchiato is a lightweight but powerful Node.js framework built on top of Express and TypeORM. It simplifies the process of:

- Creating and exposing RESTful routes from entity definitions.
- Generating and serving a Swagger schema out of the box.
- Bootstrapping your entire app (routes, database, sockets, etc.) with a single class.

It's designed for developers who want to go from zero to production-ready server in minutes.


Writing this:
```ts
export const noteRoutes = new RouterWrapper({
    tag:'note',
    basePath:'/api/note',
    dbRouting:
    {
        entity: Note,
        secure: { user_id: { tokenKey: 'id', methods: "*" } },
        getParameters: [{ in: 'query', like:true, name:'content' }],
        bodyParameters: Swagger.createSchema({ content: { type: 'string', } }),
    }
});
```
and mounting it to the Starter, you will:
1. Create dynamic routes for your entity.
2. Secure them with a token, with eventually some logics to query the db with the decrypted payload
3. Create the swagger documentation you can access right after.


## 🏁 Quick Start
The fastest way to get started with expresso-macchiato is using the official project scaffolding:

```bash
npx create-expresso-macchiato
```

This command sets up a complete and ready-to-use template, optimized for working with expresso-macchiato.

**Why this is the recommended way:**
1. Preconfigured build system using TSUP.
2. Includes jwe-token-based authentication and pre-exposed API routes.
3. Built-in MinIO utility for handling image storage from Docker.
4. Comes with a Dockerfile and docker-compose setup out of the box.
5. Includes prefilled .env files and a .gitignore tailored for Node/TypeScript projects.

You just need to:

```bash
npm install
npm run dev
```

And you're good to go! 🎉
This will:
* Connect to the database
* Expose some demo routes
* Serve auto-generated Swagger docs at /swagger-ui

### 🛠️ Manual Installation
Prefer starting from scratch? You can install expresso-macchiato directly into your own project:

```bash
npm install expresso-macchiato
```

> ### 💡 **Read more**
> ### 👉 For all the methods and correct use, check the [expresso-macchiato docs](https://alessios-books.gitbook.io/expresso-macchiato) for all the reference you need

## 🚀 Next Version

If you like **expresso-macchiato**, I'm open to contributors and motivated to keep improving the project.

### Planned for `v1.0.0`:
1. ✨ A clean and robust socket implementation (currently in the `develop` branch)
2. 🔐 Support for multiple authentication strategies in dynamic DB routing (currently only JWE is supported)
3. 💡 Fresh ideas and contributions from the community!

---

Feel free to open an issue, fork the repo, or start a discussion — let's make expresso-macchiato even better together!
