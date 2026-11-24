import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

export function getParsedDataFromHtml(parsedHtml: CheerioAPI) {
   return {
    analysis: parsedHtml('#analysis'),
    peers: parsedHtml('#peers'),
    quarters: parsedHtml('#quarters'),
    profitLoss: parsedHtml('#profit-loss'),
    balanceSheet: parsedHtml('#balance-sheet'),
    cashFlow: parsedHtml('#cash-flow'),
    ratios: parsedHtml('#ratios'),
    shareholding: parsedHtml('#shareholding'),
    documents: parsedHtml('#documents')
   }
}

export function processAnalysis(analysis: Cheerio<Element>) {
    const pros = analysis
        .find('.pros ul li')
        .map((_, el) => el.firstChild && 'data' in el.firstChild ? el.firstChild.data?.trim() : '')
        .toArray()
        .filter((text): text is string => !!text);

    const cons = analysis
        .find('.cons ul li')
        .map((_, el) => el.firstChild && 'data' in el.firstChild ? el.firstChild.data?.trim() : '')
        .toArray()
        .filter((text): text is string => !!text);

    return { pros, cons };
}

// peers data is loaded on the fly, so not using it for now ~VG
// export function processPeers(peers: Cheerio<Element>) {
//     const table = peers.find('table.data-table');
    
//     // Extract headers
//     const headers: string[] = [];
//     table.find('tbody tr:first-child th').each((_, th) => {
//         const headerText = th.firstChild && 'data' in th.firstChild 
//             ? th.firstChild.data?.trim() 
//             : '';
//         if (headerText) headers.push(headerText);
//     });

//     // Extract peer data rows
//     const peerData: Record<string, string | number>[] = [];
    
//     table.find('tbody tr[data-row-company-id]').each((_, row) => {
//         const cells = row.children.filter((child): child is Element => 
//             child.type === 'tag' && child.name === 'td'
//         );
        
//         const rowData: Record<string, string | number> = {};
        
//         cells.forEach((cell, index) => {
//             const header = headers[index] || `col${index}`;
            
//             // Check if cell contains a link (for Name column)
//             const link = cell.children.find((child): child is Element => 
//                 child.type === 'tag' && child.name === 'a'
//             );
            
//             if (link) {
//                 const text = link.firstChild && 'data' in link.firstChild 
//                     ? link.firstChild.data?.trim() 
//                     : '';
//                 rowData[header] = text || '';
//                 rowData['link'] = link.attribs?.href || '';
//             } else {
//                 const text = cell.firstChild && 'data' in cell.firstChild 
//                     ? cell.firstChild.data?.trim() 
//                     : '';
//                 // Try to parse as number
//                 const num = parseFloat(text || '');
//                 rowData[header] = isNaN(num) ? (text || '') : num;
//             }
//         });
        
//         if (Object.keys(rowData).length > 0) {
//             peerData.push(rowData);
//         }
//     });

//     // Extract median row from tfoot
//     let median: Record<string, string | number> = {};
//     table.find('tfoot tr td').each((index, cell) => {
//         const header = headers[index] || `col${index}`;
//         const text = cell.firstChild && 'data' in cell.firstChild 
//             ? cell.firstChild.data?.trim() 
//             : '';
//         const num = parseFloat(text || '');
//         median[header] = isNaN(num) ? (text || '') : num;
//     });

//     return { headers, peers: peerData, median };
// }

// Gets all the text inside a tag (nested tags too) and cleans up extra spaces and newlines.
function parsedText(el: Element): string {
    let text = '';
    const walk = (node: Element['children'][number]) => {
        if (node.type === 'text' && 'data' in node) text += node.data;
        else if ('children' in node) node.children.forEach(walk);
    };
    el.children.forEach(walk);
    return text.replace(/\s+/g, ' ').trim();
}

export function processAbsoluteTable(section: Cheerio<Element>) {
    // Some sections have more than one table (shareholding has quarterly + yearly).
    // Reading all of them together mixed up the dates and values, so only take the first one.
    const table = section.find('table.data-table').first();
    
    // Extract column headers from thead
    const headers: string[] = [''];  // First column is row label
    table.find('thead tr th').each((_, th) => {
        // Some headers come with newlines inside, like "Mar 2026\n   (S)", so clean them up
        const headerText = th.firstChild && 'data' in th.firstChild
            ? parsedText(th)
            : '';
        headers.push(headerText);
    });
    // Remove the first empty header that was just a placeholder
    headers.shift();

    // Extract data rows from tbody
    const data: Record<string, Record<string, string | number>> = {};
    
    table.find('tbody tr').each((_, row) => {
        const cells = row.children.filter((child): child is Element => 
            child.type === 'tag' && child.name === 'td'
        );
        
        if (cells.length === 0) return;
        
        // First cell is the row label
        const firstCell = cells[0];
        let rowLabel = '';
        
        // Check for button (expandable rows like Sales, Expenses)
        const button = firstCell?.children.find((child): child is Element => 
            child.type === 'tag' && child.name === 'button'
        );
        
        if (button) {
            // Get text from button, excluding the + span
            for (const child of button.children) {
                if (child.type === 'text' && 'data' in child) {
                    rowLabel += child.data;
                }
            }
            rowLabel = rowLabel.replace(/\s+/g, ' ').trim();
        } else {
            // Regular text cell
            rowLabel = firstCell?.firstChild && 'data' in firstCell.firstChild 
                ? firstCell.firstChild.data?.trim() || ''
                : '';
        }
        
        // Skip rows without a proper label (like "Raw PDF" row)
        if (!rowLabel || rowLabel === 'Raw PDF') return;
        
        const rowData: Record<string, string | number> = {};
        
        // Process value cells (skip first cell which is the label)
        cells.slice(1).forEach((cell, index) => {
            const header = headers[index + 1] || `col${index}`;
            const text = cell.firstChild && 'data' in cell.firstChild 
                ? cell.firstChild.data?.trim() 
                : '';
            
            // Parse value - handle percentages and numbers
            if (text) {
                if (text.endsWith('%')) {
                    rowData[header] = text; // Keep percentage as string
                } else {
                    const num = parseFloat(text.replace(/,/g, ''));
                    rowData[header] = isNaN(num) ? text : num;
                }
            }
        });
        
        if (Object.keys(rowData).length > 0) {
            data[rowLabel] = rowData;
        }
    });

    return { headers: headers.slice(1), data };
}

// Shareholding has 2 tables in the HTML, one for the Quarterly tab and one for the Yearly tab.
// Read them separately so each value stays under its own date.
export function processShareholding(section: Cheerio<Element>) {
    const quarterlySection = section.find('#quarterly-shp');
    const yearlySection = section.find('#yearly-shp');
    return {
        quarterly: quarterlySection.length > 0 ? processAbsoluteTable(quarterlySection) : {},
        yearly: yearlySection.length > 0 ? processAbsoluteTable(yearlySection) : {},
    };
}

// The box at the top of the page with Market Cap, Current Price, P/E, ROE etc.
// Values are kept as text because they have ₹, Cr. and % in them.
export function processTopRatios(parsedHtml: CheerioAPI) {
    const ratios: Record<string, string> = {};
    parsedHtml('#top-ratios li').each((_, li) => {
        const name = parsedHtml(li).find('.name').text().replace(/\s+/g, ' ').trim();
        const value = parsedHtml(li).find('.value').text().replace(/\s+/g, ' ').trim();
        if (name && value) ratios[name] = value;
    });
    return ratios;
}

// Company name, about text, and whether the numbers are consolidated or standalone.
// The normal URL gives standalone and /consolidated/ gives consolidated, and for big
// companies they can be very different, so it's useful to know which one you got.
export function processCompanyInfo(parsedHtml: CheerioAPI) {
    const name = parsedHtml('h1').first().text().replace(/\s+/g, ' ').trim();
    const about = parsedHtml('.company-profile .about').first().text().replace(/\s+/g, ' ').trim();

    // Under each table heading there's a line like "Consolidated Figures in Rs. Crores".
    // There are other .sub lines too, so pick the one that has "Figures" in it.
    const figuresLine = parsedHtml('#profit-loss .sub, #quarters .sub, #balance-sheet .sub')
        .map((_, el) => parsedHtml(el).text())
        .toArray()
        .find((text) => /figures/i.test(text)) ?? '';
    let basis: 'consolidated' | 'standalone' | 'unknown' = 'unknown';
    if (/consolidated\s+figures/i.test(figuresLine)) basis = 'consolidated';
    else if (/standalone\s+figures/i.test(figuresLine)) basis = 'standalone';
    // Companies with no subsidiaries just say "Figures in Rs. Crores", which is standalone
    else if (/figures\s+in/i.test(figuresLine)) basis = 'standalone';

    return { name, about, basis };
}

export function processDocuments(section: Cheerio<Element>) {
    // Helper to extract text from element
    const getText = (el: Element | undefined): string => {
        if (!el) return '';
        if (el.firstChild && 'data' in el.firstChild) {
            return el.firstChild.data?.trim() || '';
        }
        return '';
    };

    // Helper to find child elements by tag name
    const findChild = (el: Element, tagName: string): Element | undefined => {
        return el.children.find((child): child is Element => 
            child.type === 'tag' && child.name === tagName
        );
    };

    // Helper to find all child elements by tag name
    const findChildren = (el: Element, tagName: string): Element[] => {
        return el.children.filter((child): child is Element => 
            child.type === 'tag' && child.name === tagName
        );
    };

    // 1. Parse Announcements
    const announcements: { title: string; description: string; link: string }[] = [];
    section.find('.documents:not(.annual-reports):not(.credit-ratings):not(.concalls) ul.list-links li a').each((_, el) => {
        const link = el.attribs?.href || '';
        let title = '';
        let description = '';
        
        for (const child of el.children) {
            if (child.type === 'text' && 'data' in child) {
                title += child.data;
            } else if (child.type === 'tag' && child.name === 'div') {
                description = getText(child);
            }
        }
        
        if (title.trim()) {
            announcements.push({ title: title.trim(), description, link });
        }
    });

    // 2. Parse Annual Reports
    const annualReports: { year: string; source: string; link: string }[] = [];
    section.find('.annual-reports ul.list-links li a').each((_, el) => {
        const link = el.attribs?.href || '';
        let year = '';
        let source = '';
        
        for (const child of el.children) {
            if (child.type === 'text' && 'data' in child) {
                year += child.data;
            } else if (child.type === 'tag' && child.name === 'div') {
                source = getText(child);
            }
        }
        
        annualReports.push({ year: year.trim(), source, link });
    });

    // 3. Parse Credit Ratings
    const creditRatings: { title: string; date: string; source: string; link: string }[] = [];
    section.find('.credit-ratings ul.list-links li a').each((_, el) => {
        const link = el.attribs?.href || '';
        let title = '';
        let dateSource = '';
        
        for (const child of el.children) {
            if (child.type === 'text' && 'data' in child) {
                title += child.data;
            } else if (child.type === 'tag' && child.name === 'div') {
                dateSource = getText(child);
            }
        }
        
        // Parse "30 Oct 2025 from crisil" format
        const match = dateSource.match(/(.+?)\s+from\s+(.+)/i);
        const date = match?.[1]?.trim() ?? dateSource;
        const source = match?.[2]?.trim() ?? '';
        
        creditRatings.push({ title: title.trim(), date, source, link });
    });

    // 4. Parse Concalls
    const concalls: { month: string; transcript?: string; ppt?: string; recording?: string }[] = [];
    section.find('.concalls ul.list-links li').each((_, li) => {
        const entry: { month: string; transcript?: string; ppt?: string; recording?: string } = { month: '' };
        
        // Get month from the first div
        const monthDiv = findChild(li, 'div');
        if (monthDiv) {
            entry.month = getText(monthDiv);
        }
        
        // Get links
        const links = findChildren(li, 'a');
        for (const link of links) {
            const href = link.attribs?.href || '';
            const text = getText(link).toLowerCase();
            
            if (text.includes('transcript')) {
                entry.transcript = href;
            } else if (text === 'ppt') {
                entry.ppt = href;
            } else if (text === 'rec') {
                entry.recording = href;
            }
        }
        
        if (entry.month) {
            concalls.push(entry);
        }
    });

    return { announcements, annualReports, creditRatings, concalls };
}
    
export function processPnlToFindCAGRs(section: Cheerio<Element>) {
    const cagrs: Record<string, Record<string, string>> = {};

    section.find('table.ranges-table').each((_, table) => {
        // Get table title from th
        let title = '';
        const thRow = table.children.find((child): child is Element => 
            child.type === 'tag' && (child.name === 'tbody' || child.name === 'thead')
        );
        
        if (thRow) {
            const firstTr = thRow.children.find((child): child is Element => 
                child.type === 'tag' && child.name === 'tr'
            );
            if (firstTr) {
                const th = firstTr.children.find((child): child is Element => 
                    child.type === 'tag' && child.name === 'th'
                );
                if (th?.firstChild && 'data' in th.firstChild) {
                    title = th.firstChild.data?.trim() || '';
                }
            }
        }

        if (!title) return;

        const data: Record<string, string> = {};

        // Get tbody for data rows
        const tbody = table.children.find((child): child is Element => 
            child.type === 'tag' && child.name === 'tbody'
        );

        if (tbody) {
            const rows = tbody.children.filter((child): child is Element => 
                child.type === 'tag' && child.name === 'tr'
            );

            // Skip first row (header row with th)
            for (const row of rows) {
                const cells = row.children.filter((child): child is Element => 
                    child.type === 'tag' && child.name === 'td'
                );

                if (cells.length >= 2) {
                    const period = cells[0]?.firstChild && 'data' in cells[0].firstChild 
                        ? cells[0].firstChild.data?.trim().replace(':', '') || ''
                        : '';
                    const value = cells[1]?.firstChild && 'data' in cells[1].firstChild 
                        ? cells[1].firstChild.data?.trim() || ''
                        : '';

                    if (period && value) {
                        data[period] = value;
                    }
                }
            }
        }

        if (Object.keys(data).length > 0) {
            cagrs[title] = data;
        }
    });

    return cagrs;
}