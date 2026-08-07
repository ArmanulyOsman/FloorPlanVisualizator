package com.rentify.vizualizator.common.geometry;

import java.util.List;

public final class AreaCalculator {

    private AreaCalculator() {
    }

    public static Double calculateGeometricArea(List<PointDto> polygon, Double metersPerPixel, double pageWidth, double pageHeight) {
        if (metersPerPixel == null || metersPerPixel <= 0.0) {
            return null;
        }

        if (polygon == null || polygon.size() < 3) {
            return null;
        }

        double pixelArea = Math.abs(shoelaceArea(polygon)) * pageWidth * pageHeight;
        double metersPerPixelSquared = metersPerPixel * metersPerPixel;
        return pixelArea * metersPerPixelSquared;
    }

    private static double shoelaceArea(List<PointDto> polygon) {
        double sum = 0.0;
        int size = polygon.size();

        for (int i = 0; i < size; i++) {
            PointDto current = polygon.get(i);
            PointDto next = polygon.get((i + 1) % size);
            sum += current.x() * next.y() - next.x() * current.y();
        }

        return sum / 2.0;
    }
}
