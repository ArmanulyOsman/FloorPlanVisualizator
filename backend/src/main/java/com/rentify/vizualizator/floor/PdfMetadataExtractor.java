package com.rentify.vizualizator.floor;

import com.rentify.vizualizator.common.exception.ValidationException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;

@Component
public class PdfMetadataExtractor {

    /**
     * Extract page size from the same render path used for preview,
     * so coordinates always match the displayed image (including page rotation).
     */
    public PdfPageMetadata extract(MultipartFile file, int pageIndex) {
        if (pageIndex < 0) {
            throw new ValidationException("PDF page index must be zero or positive");
        }

        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            if (pageIndex >= document.getNumberOfPages()) {
                throw new ValidationException("PDF page index is out of range");
            }

            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImage(pageIndex, 1.0f);

            float width = image.getWidth();
            float height = image.getHeight();

            if (width <= 0 || height <= 0) {
                throw new ValidationException("PDF page has invalid dimensions");
            }

            return new PdfPageMetadata(pageIndex, width, height);
        } catch (IOException exception) {
            throw new ValidationException("Failed to read PDF file: " + exception.getMessage());
        }
    }

    public record PdfPageMetadata(int pageIndex, float width, float height) {
    }
}
