"use client";

import * as pdfjs from "pdfjs-dist";

let workerConfigured = false;

export function configurePdfWorker(): void {
  if (workerConfigured || typeof window === "undefined") {
    return;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

export type PdfPageRender = {
  canvas: HTMLCanvasElement;
  pageWidth: number;
  pageHeight: number;
};

export async function renderPdfPageToCanvas(
  url: string,
  pageNumber: number,
  resolutionScale = 2,
): Promise<PdfPageRender> {
  configurePdfWorker();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load PDF (${response.status})`);
  }

  const pdfData = new Uint8Array(await response.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

  if (pageNumber >= pdf.numPages) {
    throw new Error(`PDF page ${pageNumber} is out of range (document has ${pdf.numPages} pages)`);
  }

  const page = await pdf.getPage(pageNumber + 1);
  const baseViewport = page.getViewport({ scale: 1 });
  const pageWidth = baseViewport.width;
  const pageHeight = baseViewport.height;
  const scaledViewport = page.getViewport({ scale: resolutionScale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(scaledViewport.width);
  canvas.height = Math.round(scaledViewport.height);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create canvas context");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    canvas,
  }).promise;

  return { canvas, pageWidth, pageHeight };
}
