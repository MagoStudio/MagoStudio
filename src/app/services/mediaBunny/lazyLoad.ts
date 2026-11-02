let mediabunnyPromise: Promise<typeof import("mediabunny")> | null = null;
let konvaPromise: Promise<typeof import("konva")> | null = null;

export const getMediabunny = () => (mediabunnyPromise ??= import("mediabunny"));

export const getKonva = () => (konvaPromise ??= import("konva"));
