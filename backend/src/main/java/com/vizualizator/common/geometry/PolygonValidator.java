package com.vizualizator.common.geometry;

import com.vizualizator.common.exception.ValidationException;

import java.util.ArrayList;
import java.util.List;

public final class PolygonValidator {

    private static final double EPSILON = 1e-9;

    private PolygonValidator() {
    }

    public static List<PointDto> normalizePolygon(List<PointDto> polygon) {
        if (polygon == null || polygon.isEmpty()) {
            throw new ValidationException("Polygon must contain at least 3 points");
        }

        List<PointDto> points = new ArrayList<>(polygon);
        if (points.size() > 1 && isSamePoint(points.get(0), points.get(points.size() - 1))) {
            points.remove(points.size() - 1);
        }

        if (points.size() < 3) {
            throw new ValidationException("Polygon must contain at least 3 points");
        }

        for (PointDto point : points) {
            validatePointInBounds(point);
        }

        if (hasSelfIntersection(points)) {
            throw new ValidationException("Polygon must not self-intersect");
        }

        return List.copyOf(points);
    }

    private static void validatePointInBounds(PointDto point) {
        if (point.x() < 0.0 || point.x() > 1.0 || point.y() < 0.0 || point.y() > 1.0) {
            throw new ValidationException("Polygon points must be normalized between 0 and 1");
        }
    }

    private static boolean hasSelfIntersection(List<PointDto> points) {
        int size = points.size();
        for (int i = 0; i < size; i++) {
            PointDto a1 = points.get(i);
            PointDto a2 = points.get((i + 1) % size);

            for (int j = i + 1; j < size; j++) {
                if (Math.abs(i - j) <= 1 || (i == 0 && j == size - 1)) {
                    continue;
                }

                PointDto b1 = points.get(j);
                PointDto b2 = points.get((j + 1) % size);

                if (segmentsIntersect(a1, a2, b1, b2)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean segmentsIntersect(PointDto p1, PointDto p2, PointDto p3, PointDto p4) {
        double d1 = direction(p3, p4, p1);
        double d2 = direction(p3, p4, p2);
        double d3 = direction(p1, p2, p3);
        double d4 = direction(p1, p2, p4);

        if (((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON))
                && ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))) {
            return true;
        }

        if (Math.abs(d1) <= EPSILON && onSegment(p3, p4, p1)) {
            return true;
        }
        if (Math.abs(d2) <= EPSILON && onSegment(p3, p4, p2)) {
            return true;
        }
        if (Math.abs(d3) <= EPSILON && onSegment(p1, p2, p3)) {
            return true;
        }
        return Math.abs(d4) <= EPSILON && onSegment(p1, p2, p4);
    }

    private static double direction(PointDto a, PointDto b, PointDto c) {
        return (c.x() - a.x()) * (b.y() - a.y()) - (b.x() - a.x()) * (c.y() - a.y());
    }

    private static boolean onSegment(PointDto a, PointDto b, PointDto c) {
        return Math.min(a.x(), b.x()) - EPSILON <= c.x()
                && c.x() <= Math.max(a.x(), b.x()) + EPSILON
                && Math.min(a.y(), b.y()) - EPSILON <= c.y()
                && c.y() <= Math.max(a.y(), b.y()) + EPSILON;
    }

    private static boolean isSamePoint(PointDto a, PointDto b) {
        return Math.abs(a.x() - b.x()) <= EPSILON && Math.abs(a.y() - b.y()) <= EPSILON;
    }
}
