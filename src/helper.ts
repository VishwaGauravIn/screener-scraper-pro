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

export function processAbsoluteTable(section: Cheerio<Element>) {
    const table = section.find('table.data-table');
    
    // Extract column headers from thead
    const headers: string[] = [''];  // First column is row label
    table.find('thead tr th').each((_, th) => {
        const headerText = th.firstChild && 'data' in th.firstChild 
            ? th.firstChild.data?.trim() 
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