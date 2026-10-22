/** Viewport padding so mega/plain menus never kiss the screen edge. */
export const NAV_MENU_VIEWPORT_PAD_PX = 12;

/** Gap between the island nav bottom and the open panel. */
export const NAV_MENU_GAP_PX = 12;

/** Mega panel max width (58rem) — matches prior design. */
export const NAV_MEGA_MAX_WIDTH_PX = 58 * 16;

/** Plain dropdown preferred width band. */
export const NAV_PLAIN_MIN_WIDTH_PX = 18 * 16;
export const NAV_PLAIN_MAX_WIDTH_PX = 22 * 16;

export type MenuBox = {
  top: number;
  left: number;
  width: number;
};

/**
 * Center a menu under the header island (viewport-centered like the island),
 * clamped so the full width stays inside the viewport with padding.
 */
export function positionMegaMenu(args: {
  viewportWidth: number;
  islandBottom: number;
  pad?: number;
  maxWidth?: number;
  gap?: number;
}): MenuBox {
  const pad = args.pad ?? NAV_MENU_VIEWPORT_PAD_PX;
  const maxWidth = args.maxWidth ?? NAV_MEGA_MAX_WIDTH_PX;
  const gap = args.gap ?? NAV_MENU_GAP_PX;
  const available = Math.max(0, args.viewportWidth - pad * 2);
  const width = Math.min(maxWidth, available);
  const left = Math.max(pad, (args.viewportWidth - width) / 2);
  return {
    top: Math.max(0, args.islandBottom + gap),
    left,
    width,
  };
}

/**
 * Center a plain dropdown on its trigger, clamped inside the viewport.
 */
export function positionPlainMenu(args: {
  viewportWidth: number;
  triggerLeft: number;
  triggerWidth: number;
  triggerBottom: number;
  pad?: number;
  minWidth?: number;
  maxWidth?: number;
  gap?: number;
}): MenuBox {
  const pad = args.pad ?? NAV_MENU_VIEWPORT_PAD_PX;
  const minWidth = args.minWidth ?? NAV_PLAIN_MIN_WIDTH_PX;
  const maxWidth = args.maxWidth ?? NAV_PLAIN_MAX_WIDTH_PX;
  const gap = args.gap ?? NAV_MENU_GAP_PX;
  const available = Math.max(0, args.viewportWidth - pad * 2);
  const width = Math.min(maxWidth, Math.max(minWidth, Math.min(maxWidth, available)));
  const preferredLeft = args.triggerLeft + args.triggerWidth / 2 - width / 2;
  const left = Math.min(Math.max(preferredLeft, pad), args.viewportWidth - width - pad);
  return {
    top: Math.max(0, args.triggerBottom + gap),
    left: Number.isFinite(left) ? left : pad,
    width,
  };
}
