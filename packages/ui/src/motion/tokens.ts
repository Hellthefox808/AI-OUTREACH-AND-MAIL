/**
 * Spatial Motion Tokens & Easing Constants
 * Inspired by Apple Human Interface Guidelines and VisionOS Spatial Interfaces
 */

export const MOTION_DURATIONS = {
  instant: 100, // Immediate feedback (clicks, toggles)
  micro: 160, // Standard controls, buttons, hover states
  standard: 220, // Common surface & state transitions
  smooth: 320, // Panels, sheets, drawer expansions
  spatial: 450, // Depth transitions, modal elevations
  cinematic: 650, // Ambient sequences, initial reveals
} as const;

export const MOTION_EASINGS = {
  // Apple standard fluid deceleration
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  // Natural entrance curve
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  // Swift exit curve
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  // Spatial 3D / depth transform curve
  spatial: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // Tactile spring response
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Linear for smooth continuous particle / spin transitions
  linear: 'linear',
} as const;

export type MotionDuration = keyof typeof MOTION_DURATIONS;
export type MotionEasing = keyof typeof MOTION_EASINGS;
