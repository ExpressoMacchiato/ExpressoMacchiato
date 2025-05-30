export type BackgroundServiceConstructor = {
    name:string;
    main: () => Promise<void>
}
