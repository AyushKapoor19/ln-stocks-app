/**
 * Stage Type Definitions
 * 
 * Proper typing for Lightning.js Stage to avoid 'any' usage
 */

export interface IStageConfig {
  w: number;
  h: number;
  precision?: number;
  devicePixelRatio?: number;
  coordsWidth?: number;
  coordsHeight?: number;
  getOption(key: string): unknown;
}

export interface ResolutionInfo {
  name: string;
  width: number;
  height: number;
  coordsWidth: number;
  coordsHeight: number;
  precision: number;
  devicePixelRatio: number;
}



