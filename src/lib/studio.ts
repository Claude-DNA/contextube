/** Context Cloud Studio, where flows are created before they are published here. */
export const STUDIO_URL = (process.env.NEXT_PUBLIC_STUDIO_URL ?? "https://contextcloud.studio").replace(/\/$/, "");

/** Studio's "Start a new flow" page; signed-out visitors sign up there and land back on it. */
export const NEW_FLOW_URL = `${STUDIO_URL}/new?from=contextube`;
