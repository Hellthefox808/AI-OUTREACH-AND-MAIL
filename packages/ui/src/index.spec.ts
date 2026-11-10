/**
 * Unit tests for @career-intelligence/ui primitives, classnames helper, and motion tokens.
 */

import { describe, it, expect } from "vitest";
import {
  cn,
  MOTION_DURATIONS,
  MOTION_EASINGS,
  Button,
  Input,
  Card,
  Badge,
  Table,
  SpatialModal,
  SpatialKpiCard,
  SpatialTabs,
  SpatialTooltip,
  SpatialToastProvider,
  useToast,
  SpatialSkeleton,
  SpatialSkeletonTable,
  SpatialCommandPalette,
} from "./index";

describe("packages/ui - Design System Primitives", () => {
  describe("cn (classnames utility)", () => {
    it("should join multiple valid class strings with spaces", () => {
      const result = cn("btn", "btn-primary", "rounded-xl");
      expect(result).toBe("btn btn-primary rounded-xl");
    });

    it("should filter out undefined, null, false, and empty string tokens", () => {
      const isVisible = false;
      const isHovered = true;
      const result = cn(
        "base-card",
        undefined,
        null,
        isVisible && "hidden-class",
        isHovered && "hover:border-white/20",
        ""
      );
      expect(result).toBe("base-card hover:border-white/20");
    });

    it("should return empty string when all inputs are falsy", () => {
      const result = cn(undefined, null, false);
      expect(result).toBe("");
    });
  });

  describe("Spatial Motion Tokens", () => {
    it("should define duration tokens matching Apple HIG spatial curves", () => {
      expect(MOTION_DURATIONS.instant).toBe(100);
      expect(MOTION_DURATIONS.micro).toBe(160);
      expect(MOTION_DURATIONS.standard).toBe(220);
      expect(MOTION_DURATIONS.smooth).toBe(320);
      expect(MOTION_DURATIONS.spatial).toBe(450);
      expect(MOTION_DURATIONS.cinematic).toBe(650);
    });

    it("should define cubic bezier easing curves for spatial transitions", () => {
      expect(MOTION_EASINGS.standard).toContain("cubic-bezier");
      expect(MOTION_EASINGS.spatial).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
      expect(MOTION_EASINGS.spring).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
      expect(MOTION_EASINGS.linear).toBe("linear");
    });
  });

  describe("Component Exports Integrity", () => {
    it("should export all essential glass and spatial components", () => {
      expect(Button).toBeDefined();
      expect(Input).toBeDefined();
      expect(Card).toBeDefined();
      expect(Badge).toBeDefined();
      expect(Table).toBeDefined();
      expect(SpatialModal).toBeDefined();
      expect(SpatialKpiCard).toBeDefined();
      expect(SpatialTabs).toBeDefined();
      expect(SpatialTooltip).toBeDefined();
      expect(SpatialToastProvider).toBeDefined();
      expect(useToast).toBeDefined();
      expect(SpatialSkeleton).toBeDefined();
      expect(SpatialSkeletonTable).toBeDefined();
      expect(SpatialCommandPalette).toBeDefined();
    });
  });
});
