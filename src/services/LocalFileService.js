class LocalFileService {
    constructor() {
        this.rootHandle = null;
        this.fileHandles = new Map();
    }

    setRootHandle(handle) {
        this.rootHandle = handle;
    }

    setFileHandle(path, handle) {
        this.fileHandles.set(path, handle);
    }

    hasRoot() {
        return !!this.rootHandle;
    }

    async writeFile(path, content) {
        const handle = this.fileHandles.get(path);
        if (!handle) {
            throw new Error(`No file handle for path: ${path}`);
        }
        const writable = await handle.createWritable();
        await writable.write(content ?? '');
        await writable.close();
    }

    async writeAll(files) {
        for (const file of files) {
            if (!file?.path) continue;
            try {
                await this.writeFile(file.path, file.content);
            } catch (err) {
                console.error('[LocalFileService] Failed to write', file.path, err);
            }
        }
    }
}

export const localFileService = new LocalFileService();
