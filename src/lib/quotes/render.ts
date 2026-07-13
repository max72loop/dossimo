import "server-only";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuoteDocument } from "@/lib/quotes/quote-document";
type DocElement = Parameters<typeof renderToBuffer>[0];
export function renderQuotePdf(data: { label: string; lines: string[]; mentions: string[] }) { return renderToBuffer(createElement(QuoteDocument, data) as unknown as DocElement); }
