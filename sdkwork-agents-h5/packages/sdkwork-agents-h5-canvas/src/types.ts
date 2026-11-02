/**
 * Canvas board types (`app.agents.canvas.board`).
 *
 * The PC canvas owns a browser-local workflow graph (text, image, and video
 * nodes plus groups and connections). Mobile renders a read-only, viewport-
 * constrained projection of that graph; editing stays a PC/tablet capability
 * (`PLAN-2026-1102-client-page-parity.md` section 6).
 */

export type CanvasNodeType = "text" | "image-gen" | "video-gen" | "flow-step" | "sticky";

export type CanvasNodeStatus = "idle" | "generating" | "completed" | "failed";

export interface CanvasNode {
  readonly id: string;
  readonly type: CanvasNodeType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly content?: string;
  readonly prompt?: string;
  readonly status?: CanvasNodeStatus;
  readonly mediaUrl?: string;
  readonly groupId?: string;
}

export interface CanvasGroup {
  readonly id: string;
  readonly title: string;
}

export interface CanvasConnection {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
}

export interface CanvasWorkflow {
  readonly nodes: readonly CanvasNode[];
  readonly groups: readonly CanvasGroup[];
  readonly connections: readonly CanvasConnection[];
}
