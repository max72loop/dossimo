import "server-only";

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { FactureDocument } from "@/lib/factures/document";
import type { FactureComplete } from "@/lib/factures/get-facture";

type DocElement = Parameters<typeof renderToBuffer>[0];

export function renderFacturePdf(data: FactureComplete): Promise<Buffer> {
  return renderToBuffer(
    createElement(FactureDocument, { data }) as unknown as DocElement,
  );
}
