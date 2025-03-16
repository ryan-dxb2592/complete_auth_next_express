import { UAParser } from "ua-parser-js";

// Function to check device
export const isMobile = async (userAgent: string) => {
  const parser = new UAParser(userAgent);

  const device = await parser.getDevice().withFeatureCheck();

  const isMobile =
    device.type === "mobile" ||
    device.type === "tablet" ||
    device.type === "smarttv";

  return isMobile;
};
