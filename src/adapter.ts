export async function fetchPage(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        // e.g. 404 for an unknown company symbol
        throw new Error(`screener.in returned HTTP ${response.status} for ${url}`);
    }
    const html = await response.text();
    return html;
}
