import type { CanvasNode, CanvasWorkflow } from "../types";
import { getCanvasPort, isCanvasPortConfigured } from "./canvasPort";

export type CanvasBoard =
  | { readonly availability: "available"; readonly workflow: CanvasWorkflow }
  | { readonly availability: "empty" }
  | { readonly availability: "unavailable"; readonly reason: "transport-not-composed" };

export class CanvasService {
  static async loadBoard(): Promise<CanvasBoard> {
    if (!isCanvasPortConfigured()) {
      return { availability: "unavailable", reason: "transport-not-composed" };
    }
    const workflow = await getCanvasPort().loadWorkflow();
    if (!workflow || workflow.nodes.length === 0) {
      return { availability: "empty" };
    }
    return { availability: "available", workflow };
  }

  /** Reading order: top-to-bottom, then left-to-right. */
  static sortNodes(nodes: readonly CanvasNode[]): CanvasNode[] {
    return [...nodes].sort((left, right) => {
      if (left.y !== right.y) return left.y - right.y;
      return left.x - right.x;
    });
  }
}
