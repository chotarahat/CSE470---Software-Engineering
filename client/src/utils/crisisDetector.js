import { crisisKeywords  } from "./crisisKeywords";
export function detectCrisis(text) {
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => 
        lowerText.includes(keyword)
    );
}