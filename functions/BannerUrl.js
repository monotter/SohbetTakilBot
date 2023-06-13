import axios from 'axios'
import { client } from '../client.js';
export async function getUserBannerUrl(userId, { dynamicFormat = true, defaultFormat = "webp", size = 512 } = {}) {
    // Supported image sizes, inspired by 'https://discord.js.org/#/docs/main/stable/typedef/ImageURLOptions'.
    if (![16, 32, 64, 128, 256, 512, 1024, 2048, 4096].includes(size)) {
        throw new Error(`The size '${size}' is not supported!`);
    }

    // We don't support gif as a default format,
    // because requesting .gif format when the original image is not a gif,
    // would result in an error 415 Unsupported Media Type.
    // If you want gif support, enable dynamicFormat, .gif will be used when is it available.
    if (!["webp", "png", "jpg", "jpeg"].includes(defaultFormat)) {
        throw new Error(`The format '${defaultFormat}' is not supported as a default format!`);
    }

    // We use raw API request to get the User object from Discord API,
    // since the discord.js v12's one doens't support .banner property.

    const user = (await client.users.fetch(userId))
    if (!user.banner) return null;

    const query = `?size=${size}`;
    const baseUrl = `https://cdn.discordapp.com/banners/${userId}/${user.banner}`;

    // If dynamic format is enabled we perform a HTTP HEAD request,
    // so we can use the content-type header to determine,
    // if the image is a gif or not.
    if (dynamicFormat) {
        const { headers } = await axios.head(baseUrl);
        if (headers && headers.hasOwnProperty("content-type")) {
            return baseUrl + (headers["content-type"] == "image/gif" ? ".gif" : `.${defaultFormat}`) + query;
        }
    }

    return baseUrl + `.${defaultFormat}` + query;
}
