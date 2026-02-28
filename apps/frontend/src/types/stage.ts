/**
 * Stage Type Definitions
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

export interface IResolutionInfo {
  name: string;
  width: number;
  height: number;
  coordsWidth: number;
  coordsHeight: number;
  precision: number;
  devicePixelRatio: number;
}
