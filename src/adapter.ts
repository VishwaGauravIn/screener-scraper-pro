export async function fetchPage(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        // screener gives a 404 for a wrong symbol. Without this we'd parse
        // the error page and return empty data without any error.
        throw new Error(`screener.in returned HTTP ${response.status} for ${url}`);
    }
    const html = await response.text();
    return html;
}
