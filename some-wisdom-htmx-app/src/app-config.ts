import path from "path";

//TODO: minification/hashing + cache of assets

function envVariableOrDefault(key: string, defaultValue: any) {
    return process.env[key] ?? defaultValue;
}

function envVariableOrThrow(key: string) {
    const value = process.env[key];
    if (value) {
        return value;
    }
    throw new Error(`${key} env variable is required, but is undefined`);
}

export const getAssetsSrc = () => ({
    htmx: envVariableOrDefault("ASSETS_HTMX_SRC", "https://unpkg.com/htmx.org@1.9.3"),
    styles: envVariableOrDefault("ASSETS_STYLES_SRC", "/style.css"),
    indexJs: envVariableOrDefault("ASSETS_INDEX_JS_SRC", "/index.js")
});

export const getAppConfig = () => {
    const assetsPath = envVariableOrDefault("ASSETS_PATH", path.join(__dirname, "..", "assets"));
    return {
        server: {
            port: envVariableOrDefault("SERVER_PORT", 8080)
        },
        session: {
            //5 hours
            duration: envVariableOrDefault("SESSION_DURATION", 5 * 60 * 60 * 1000),
            dir: envVariableOrDefault("SESSION_DIR", path.join("/tmp", "session")),
            refreshInterval: envVariableOrDefault("SESSION_REFRESH_INTERVAL", 60 * 1000),
        },
        db: {
            path: envVariableOrDefault("DB_PATH", path.join(__dirname, "..", "assets", "db"))
        },
        assets: {
            path: assetsPath,
            stylesPath: envVariableOrDefault("ASSETS_STYLES_PATH", assetsPath)
        }
    }
};