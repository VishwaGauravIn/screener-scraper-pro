export async function fetchPage(url: string) {
    const response = await fetch(url);
    const html = await response.text();
    return html;
}