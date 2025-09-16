/**
 * Size Bot Short Query Handler
 * Handles 2-7 word sizing questions with high accuracy
 */

import { SIZE_BOT_EXPERTISE, analyzeSizeQuery, generateSizeRecommendation } from './size-bot-expertise';

export interface SizeQueryIntent {
  intent: string;
  confidence: number;
  measurements: {
    chest?: number;
    waist?: number;
    height?: string;
    inseam?: number;
  };
  bodyType?: string;
  urgency?: 'immediate' | 'planning' | 'browsing';
  concerns: string[];
  nextSteps: string[];
}

// SHORT SIZE QUERY PATTERNS (2-7 words)
export const SIZE_QUERY_PATTERNS = {
  // 2-3 WORD PATTERNS
  twoThreeWords: {
    "38r meaning": {
      intent: "size_explanation",
      measurements: { chest: 38 },
      concerns: ["understanding sizing"],
      response: "38R = 38\" chest, Regular length (5'8\"-6'0\"). The number is chest, letter is height-based length."
    },
    "measure chest": {
      intent: "measurement_guide",
      concerns: ["how to measure"],
      response: "Wrap tape around fullest part under armpits. Keep parallel to floor, don't flex."
    },
    "slim fit": {
      intent: "fit_style",
      concerns: ["fit types"],
      response: "Slim = narrower cut everywhere. 2-3\" less fabric than classic. Modern, younger look."
    },
    "too tight": {
      intent: "fit_problem",
      concerns: ["sizing up"],
      response: "Size up one. Better slightly big (can tailor) than too small (can't fix)."
    },
    "too short": {
      intent: "length_issue",
      concerns: ["jacket length", "sleeve length"],
      response: "Try 'Long' size if jacket/sleeves short. Affects length, not chest size."
    },
    "big thighs": {
      intent: "body_type",
      bodyType: "athletic",
      concerns: ["pants fit"],
      response: "Athletic fit pants or buy separates. Avoid slim fit. Look for stretch fabric."
    },
    "broad shoulders": {
      intent: "body_type",
      bodyType: "broad",
      concerns: ["shoulder fit"],
      response: "Shoulders must fit first - can't alter. Size for shoulders, tailor body."
    },
    "first suit": {
      intent: "beginner",
      concerns: ["starting out"],
      response: "Start with navy, modern fit, your chest size. Budget for $30-50 tailoring."
    },
    "between sizes": {
      intent: "sizing_decision",
      concerns: ["41 inches", "odd number"],
      response: "Always size up. 41\" chest = buy 42. Easier to tailor down."
    },
    "suit separates": {
      intent: "separates_info",
      concerns: ["different sizes"],
      response: "Buy jacket and pants separately when chest/waist don't match standard 6\" drop."
    }
  },

  // 4-5 WORD PATTERNS
  fourFiveWords: {
    "what size am i": {
      intent: "size_discovery",
      concerns: ["don't know size"],
      response: "Need: 1) Chest measurement under arms, 2) Height for S/R/L, 3) Waist at belly button.",
      nextSteps: ["Measure chest", "Check height", "Measure waist"]
    },
    "42 chest 34 waist": {
      intent: "measurements_given",
      measurements: { chest: 42, waist: 34 },
      bodyType: "athletic",
      concerns: ["drop difference"],
      response: "Athletic build! Need 42R jacket with separate 34W pants, or athletic cut suit."
    },
    "5 foot 6 inches": {
      intent: "height_given",
      measurements: { height: "5'6\"" },
      concerns: ["short height"],
      response: "You need 'Short' sizes. Regular jackets will be too long on you."
    },
    "6 foot 3 inches": {
      intent: "height_given",
      measurements: { height: "6'3\"" },
      concerns: ["tall height"],
      response: "You need 'Long' or 'Extra Long' sizes for proper jacket and sleeve length."
    },
    "how to measure waist": {
      intent: "measurement_guide",
      concerns: ["waist measurement"],
      response: "Measure at natural waistline (above hip bones), not where jeans sit. Usually 2\" higher."
    },
    "shoulders fit chest tight": {
      intent: "fit_problem",
      concerns: ["mixed fit issues"],
      response: "Keep this size - shoulders can't be fixed. Tailor can let out chest 1-2\"."
    },
    "pants too long help": {
      intent: "alteration_needed",
      concerns: ["hemming"],
      response: "Easy fix! Hemming costs $10-20. Choose your break: slight (modern) or full (traditional)."
    },
    "jacket sleeves too short": {
      intent: "length_issue",
      concerns: ["sleeve length"],
      response: "Try 'Long' size or extend sleeves (1\" max). Should show 1/4-1/2\" shirt cuff."
    },
    "athletic build suit help": {
      intent: "body_type",
      bodyType: "athletic",
      concerns: ["v-shape fit"],
      response: "Look for 'athletic cut' or drop-8 suits. 42 jacket with 34 pants. May need separates."
    },
    "big belly suit size": {
      intent: "body_type",
      bodyType: "larger",
      concerns: ["stomach fit"],
      response: "Classic fit or 'portly' cut. Size for belly, adjust chest. Consider separates."
    }
  },

  // 6-7 WORD PATTERNS
  sixSevenWords: {
    "chest 40 but waist is 36": {
      intent: "measurements_given",
      measurements: { chest: 40, waist: 36 },
      concerns: ["standard drop"],
      response: "Perfect for standard suits! 40R jacket comes with 34W pants (6\" drop). Hem to length."
    },
    "im 38 chest 5 foot 10": {
      intent: "full_measurements",
      measurements: { chest: 38, height: "5'10\"" },
      response: "You're 38R (Regular length for your height). Standard drop gives you 32W pants."
    },
    "need suit for wedding next week": {
      intent: "urgent_need",
      urgency: "immediate",
      concerns: ["time constraint"],
      response: "Buy off-rack in your size, get same-day alterations. Focus on shoulders fitting perfectly."
    },
    "how much should suit pants break": {
      intent: "styling_question",
      concerns: ["pant length"],
      response: "Slight break = modern (barely touches shoe). Full break = traditional. No break = trendy."
    },
    "difference between 38r and 38l jacket": {
      intent: "size_comparison",
      concerns: ["length difference"],
      response: "Same chest (38\"), different length. R = Regular (5'8\"-6'0\"), L = Long (6'1\"-6'3\"). About 1.5\" difference."
    },
    "can tailor fix tight shoulders jacket": {
      intent: "alteration_question",
      concerns: ["shoulder alteration"],
      response: "No - shoulders can't be fixed affordably. If shoulders don't fit, return it. Get right size."
    }
  }
};

// ANALYZE SHORT SIZE QUERIES
export function analyzeSizeShortQuery(query: string): SizeQueryIntent {
  const words = query.toLowerCase().trim().split(/\s+/);
  const wordCount = words.length;
  const queryLower = query.toLowerCase();
  
  // Extract measurements from query
  const measurements: any = {};
  
  // Check for chest size (36-54)
  const chestMatch = query.match(/\b(3[6-9]|4[0-9]|5[0-4])\b/);
  if (chestMatch && !queryLower.includes("inseam") && !queryLower.includes("waist")) {
    measurements.chest = parseInt(chestMatch[0]);
  }
  
  // Check for waist size
  const waistMatch = query.match(/waist\s*(\d{2,3})|(\d{2,3})\s*waist|(\d{2,3})w\b/i);
  if (waistMatch) {
    measurements.waist = parseInt(waistMatch[1] || waistMatch[2] || waistMatch[3]);
  }
  
  // Check for height
  const heightMatch = query.match(/([456])[',\s]+(\d{1,2})|([456])\s*foot\s*(\d{1,2})?/i);
  if (heightMatch) {
    const feet = heightMatch[1] || heightMatch[3];
    const inches = heightMatch[2] || heightMatch[4] || "0";
    measurements.height = `${feet}'${inches}"`;
  }
  
  // Detect body type
  let bodyType = "average";
  if (queryLower.includes("athletic") || queryLower.includes("muscular") || queryLower.includes("gym")) {
    bodyType = "athletic";
  } else if (queryLower.includes("slim") || queryLower.includes("thin") || queryLower.includes("skinny")) {
    bodyType = "slim";
  } else if (queryLower.includes("big") || queryLower.includes("heavy") || queryLower.includes("large") || queryLower.includes("belly")) {
    bodyType = "larger";
  } else if (queryLower.includes("broad") || queryLower.includes("wide")) {
    bodyType = "broad";
  }
  
  // Detect urgency
  let urgency: 'immediate' | 'planning' | 'browsing' = 'browsing';
  if (words.some(w => ['tomorrow', 'today', 'tonight', 'urgent', 'asap', 'week'].includes(w))) {
    urgency = 'immediate';
  } else if (words.some(w => ['wedding', 'interview', 'event', 'prom'].includes(w))) {
    urgency = 'planning';
  }
  
  // Detect intent
  let intent = "general_sizing";
  let concerns: string[] = [];
  
  if (queryLower.includes("measure")) {
    intent = "measurement_guide";
    concerns = ["how to measure"];
  } else if (queryLower.includes("fit") || queryLower.includes("tight") || queryLower.includes("loose")) {
    intent = "fit_problem";
    concerns = ["fit issues"];
  } else if (queryLower.includes("athletic") || queryLower.includes("muscular") || queryLower.includes("bodybuilder")) {
    intent = "body_type";
    concerns = ["athletic fit"];
  } else if (queryLower.includes("first") || queryLower.includes("beginner")) {
    intent = "beginner";
    concerns = ["new to suits"];
  } else if (measurements.chest || measurements.waist || measurements.height) {
    intent = "measurements_given";
    concerns = ["size calculation"];
  } else if (queryLower.includes("alter") || queryLower.includes("tailor") || queryLower.includes("hem")) {
    intent = "alteration_question";
    concerns = ["tailoring needed"];
  }
  
  // Generate next steps based on what's missing
  const nextSteps: string[] = [];
  if (!measurements.chest) nextSteps.push("Measure chest");
  if (!measurements.height) nextSteps.push("Provide height");
  if (!measurements.waist) nextSteps.push("Measure waist");
  if (intent === "fit_problem") nextSteps.push("Try different size");
  if (intent === "alteration_question") nextSteps.push("Find local tailor");
  
  return {
    intent,
    confidence: measurements.chest ? 90 : 75,
    measurements,
    bodyType,
    urgency,
    concerns,
    nextSteps
  };
}

// GENERATE SMART SIZE RESPONSE
export function generateSizeResponse(query: string): {
  response: string;
  recommendations: string[];
  measurements: string[];
  nextActions: string[];
  confidence: number;
} {
  // First check our pattern library
  const words = query.toLowerCase().trim().split(/\s+/).length;
  const patterns = words <= 3 ? SIZE_QUERY_PATTERNS.twoThreeWords :
                   words <= 5 ? SIZE_QUERY_PATTERNS.fourFiveWords :
                   SIZE_QUERY_PATTERNS.sixSevenWords;
  
  // Check for exact pattern match
  for (const [pattern, data] of Object.entries(patterns)) {
    if (query.toLowerCase().includes(pattern)) {
      return {
        response: data.response,
        recommendations: data.nextSteps || [],
        measurements: data.measurements ? 
          [`Chest: ${data.measurements.chest}`, `Waist: ${data.measurements.waist}`].filter(Boolean) : [],
        nextActions: data.nextSteps || ["Provide measurements", "Choose fit style"],
        confidence: 95
      };
    }
  }
  
  // Use intelligent analysis
  const intent = analyzeSizeShortQuery(query);
  const sizeAnalysis = analyzeSizeQuery(query);
  
  // Build response based on intent
  let response = sizeAnalysis.answer;
  
  // Add specific guidance based on measurements
  if (intent.measurements.chest || intent.measurements.height) {
    const recommendation = generateSizeRecommendation(
      intent.measurements.chest,
      intent.measurements.height,
      intent.measurements.waist,
      intent.bodyType
    );
    response = recommendation.recommendation;
  }
  
  // Build recommendations
  const recommendations = [];
  if (intent.bodyType === "athletic") {
    recommendations.push("Try athletic cut suits");
    recommendations.push("Consider separates");
  } else if (intent.bodyType === "slim") {
    recommendations.push("Look for slim fit");
    recommendations.push("European brands fit better");
  } else if (intent.bodyType === "larger") {
    recommendations.push("Classic fit recommended");
    recommendations.push("Dark colors slim");
  }
  
  // Extract measurements for display
  const measurements = [];
  if (intent.measurements.chest) measurements.push(`Chest: ${intent.measurements.chest}"`);
  if (intent.measurements.waist) measurements.push(`Waist: ${intent.measurements.waist}"`);
  if (intent.measurements.height) measurements.push(`Height: ${intent.measurements.height}`);
  
  return {
    response,
    recommendations: recommendations.length ? recommendations : sizeAnalysis.tips,
    measurements,
    nextActions: intent.nextSteps,
    confidence: intent.confidence
  };
}

// CONVERSATIONAL SIZE BOT RESPONSES
export function buildConversationalSizeResponse(query: string): string {
  const analysis = generateSizeResponse(query);
  const intent = analyzeSizeShortQuery(query);
  
  // Build natural response based on urgency and intent
  let response = "";
  
  if (intent.urgency === "immediate") {
    response = "Let's get you sized quickly! ";
  } else if (intent.intent === "beginner") {
    response = "First suit? Exciting! Here's what you need to know: ";
  } else if (intent.bodyType === "athletic") {
    response = "Athletic build - I've got you covered! ";
  }
  
  response += analysis.response;
  
  // Add friendly follow-up
  if (intent.measurements.chest && !intent.measurements.height) {
    response += " What's your height so I can determine S/R/L?";
  } else if (!intent.measurements.chest) {
    response += " Can you measure your chest for me?";
  }
  
  return response;
}

// EXPORT SIZE BOT SHORT QUERY HANDLER
export const SIZE_SHORT_QUERY = {
  patterns: SIZE_QUERY_PATTERNS,
  analyze: analyzeSizeShortQuery,
  generate: generateSizeResponse,
  conversational: buildConversationalSizeResponse
};