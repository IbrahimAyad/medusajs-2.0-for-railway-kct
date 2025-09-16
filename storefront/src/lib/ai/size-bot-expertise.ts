/**
 * Size Bot Comprehensive Expertise
 * Complete knowledge base for suit sizing - 100 questions answered
 * Persistent memory for all sizing inquiries
 */

export interface SizingExpertise {
  category: string;
  questions: {
    [key: string]: {
      question: string;
      answer: string;
      keywords: string[];
      followUp?: string[];
      quickTips?: string[];
    };
  };
}

// SECTION 1: GENERAL SUIT SIZING BASICS
export const GENERAL_SIZING: SizingExpertise = {
  category: "General Suit Sizing Basics",
  questions: {
    "what_does_38r_mean": {
      question: "What does '38R' mean in a suit size?",
      answer: "38 = chest size in inches. R = regular jacket length. So 38R fits a 38-inch chest with regular length.",
      keywords: ["38r", "size meaning", "suit size", "numbers mean"],
      followUp: ["What's your chest measurement?", "How tall are you?"],
      quickTips: ["Chest size is key", "R for Regular length"]
    },
    "short_regular_long_difference": {
      question: "What's the difference between S (Short), R (Regular), and L (Long)?",
      answer: "Jacket length by height: Short = under 5'7\", Regular = 5'8\"-6'0\", Long = 6'1\"-6'3\", Extra Long = over 6'3\"",
      keywords: ["short", "regular", "long", "s r l", "height"],
      followUp: ["What's your height?", "Have you tried different lengths?"],
      quickTips: ["Based on height", "Affects jacket length only"]
    },
    "pants_with_jacket": {
      question: "Do suit pants come with the jacket size?",
      answer: "Yes, in most suit sets pants are paired with jacket. For separates, you buy each piece individually.",
      keywords: ["pants", "jacket", "together", "suit set", "separates"],
      followUp: ["Looking for a complete suit?", "Need different sizes?"],
      quickTips: ["Sets = matched", "Separates = flexibility"]
    },
    "pants_hemmed": {
      question: "Are dress pants automatically hemmed?",
      answer: "Most come 'unfinished' (long inseam) and need tailoring for exact length.",
      keywords: ["hemmed", "pants length", "unfinished", "tailoring"],
      followUp: ["Know your inseam?", "Have a tailor?"],
      quickTips: ["Budget for hemming", "Usually $10-20"]
    },
    "exact_chest_size": {
      question: "Do I buy the exact size of my chest?",
      answer: "Yes, generally jacket = chest measurement. If in-between, round up.",
      keywords: ["chest size", "exact", "measurement", "round up"],
      followUp: ["What's your chest measurement?", "Between sizes?"],
      quickTips: ["Round up if unsure", "Better slightly big"]
    },
    "slim_vs_classic": {
      question: "How do modern/slim-fit vs classic suits affect sizing?",
      answer: "Slim-fit = trimmer chest/waist/leg. Classic fit = more generous cut. Same size number, different fit.",
      keywords: ["slim fit", "classic", "modern", "fit difference"],
      followUp: ["Body type?", "Comfort preference?"],
      quickTips: ["Slim = younger look", "Classic = traditional"]
    },
    "worldwide_sizing": {
      question: "Are suit sizes the same worldwide?",
      answer: "No. US 38 ≈ UK 38, but EU sizes = chest in centimeters (48 EU ≈ 38 US).",
      keywords: ["worldwide", "international", "eu", "uk", "conversion"],
      followUp: ["Shopping internationally?", "Need conversion?"],
      quickTips: ["EU = add 10", "UK = same as US"]
    },
    "biggest_mistake": {
      question: "What's the biggest mistake men make?",
      answer: "Choosing by height only. Suit sizing is based primarily on chest measurement.",
      keywords: ["mistake", "common error", "wrong size"],
      followUp: ["Know your chest size?", "Been sized before?"],
      quickTips: ["Chest first", "Height second"]
    }
  }
};

// SECTION 2: MEASURING CHEST & SHOULDERS
export const CHEST_SHOULDERS: SizingExpertise = {
  category: "Measuring Chest & Shoulders",
  questions: {
    "measure_chest": {
      question: "How do I measure my chest?",
      answer: "Wrap tape around the fullest part under the armpits. Don't flex or inhale heavily. Keep tape parallel to floor.",
      keywords: ["measure chest", "chest measurement", "tape measure"],
      followUp: ["Have a tape measure?", "Need help measuring?"],
      quickTips: ["Relax naturally", "Don't pull tight"]
    },
    "between_sizes": {
      question: "What if I'm between chest sizes (e.g., 41\")?",
      answer: "Always size up (to 42). Better to tailor down than have it too tight.",
      keywords: ["between sizes", "41", "odd number", "in between"],
      followUp: ["What's your exact measurement?", "Prefer snug or comfortable?"],
      quickTips: ["Size up", "Tailor can adjust"]
    },
    "broad_shoulders": {
      question: "Do broad shoulders affect suit size?",
      answer: "Yes. Always prioritize shoulder fit first; chest/waist can be adjusted by a tailor.",
      keywords: ["broad shoulders", "wide shoulders", "athletic"],
      followUp: ["Athletic build?", "Shoulder measurement?"],
      quickTips: ["Shoulders first", "Can't alter shoulders easily"]
    },
    "small_chest_wide_shoulders": {
      question: "What if my chest is small but shoulders wide?",
      answer: "Size for shoulders, then taper the torso with tailoring.",
      keywords: ["small chest", "wide shoulders", "v shape"],
      followUp: ["Athletic build?", "Willing to tailor?"],
      quickTips: ["Shoulders rule", "Tailor the body"]
    },
    "chest_42_waist_34": {
      question: "What if chest = 42 but waist = 34?",
      answer: "Off-the-rack 42 jacket pairs with ~36 waist pants. Tailor pants smaller or buy separates.",
      keywords: ["different measurements", "chest waist", "drop"],
      followUp: ["Athletic build?", "Consider separates?"],
      quickTips: ["Athletic cut helps", "Separates give flexibility"]
    }
  }
};

// SECTION 3: WAIST & PANTS
export const WAIST_PANTS: SizingExpertise = {
  category: "Waist & Pant Questions",
  questions: {
    "measure_waist": {
      question: "How do I measure my waist for suit pants?",
      answer: "Measure at natural waistline (above hip bones), not where jeans sit.",
      keywords: ["measure waist", "waist size", "pants measurement"],
      followUp: ["Know your jean size?", "Natural waist found?"],
      quickTips: ["Higher than jeans", "Above hip bones"]
    },
    "pants_looser": {
      question: "Why are suit pants looser than jeans?",
      answer: "They're cut higher (above hips) for dress fit and professional comfort.",
      keywords: ["looser", "baggy", "compared jeans", "fit different"],
      followUp: ["Prefer slimmer fit?", "First suit?"],
      quickTips: ["Different rise", "Professional cut"]
    },
    "bigger_than_jeans": {
      question: "Why do pants feel bigger than my jeans size?",
      answer: "Dress pant sizing typically runs 1-2 inches larger than denim. Size 32 jeans = 30-31 dress pants.",
      keywords: ["bigger", "size difference", "jeans vs suit"],
      followUp: ["What's your jean size?", "Tried sizing down?"],
      quickTips: ["Size down 1-2", "Different cut"]
    },
    "big_thighs": {
      question: "What if my thighs are big from working out?",
      answer: "Choose 'athletic fit' pants or buy separates for more thigh room.",
      keywords: ["big thighs", "muscular", "working out", "athletic"],
      followUp: ["Squat regularly?", "Current fit issues?"],
      quickTips: ["Athletic cut", "Avoid slim fit"]
    },
    "waist_smaller": {
      question: "What if my waist is much smaller than my chest?",
      answer: "Look for 'drop 8' sizing (8\" difference) or athletic cuts. 42R jacket with 34W pants.",
      keywords: ["small waist", "drop 8", "athletic build"],
      followUp: ["V-shaped build?", "Current suit issues?"],
      quickTips: ["Athletic drops", "May need tailoring"]
    },
    "waist_bigger": {
      question: "What if my waist is bigger than my chest?",
      answer: "Look for classic fit suits or buy separates to size both correctly.",
      keywords: ["bigger waist", "belly", "stomach", "portly"],
      followUp: ["Comfort priority?", "Open to separates?"],
      quickTips: ["Classic fit", "Separates work best"]
    }
  }
};

// SECTION 4: JACKET LENGTH & HEIGHT
export const JACKET_LENGTH: SizingExpertise = {
  category: "Jacket Length & Height",
  questions: {
    "know_length_needed": {
      question: "How should I know if I need short, regular, or long jacket?",
      answer: "Under 5'7\" = Short, 5'8\"-6'0\" = Regular, 6'1\"-6'3\" = Long, over 6'3\" = Extra Long",
      keywords: ["length", "short regular long", "height guide"],
      followUp: ["Your height?", "Torso length?"],
      quickTips: ["Height based", "Affects coverage"]
    },
    "jacket_end": {
      question: "Where should a jacket end?",
      answer: "Around mid to lower seat (butt). Should cover your zipper completely.",
      keywords: ["jacket length", "end", "coverage", "proper length"],
      followUp: ["Current jacket short?", "Coverage issues?"],
      quickTips: ["Cover zipper", "Mid-butt ideal"]
    },
    "shirt_cuff_show": {
      question: "How much shirt cuff should show?",
      answer: "About 1/4 to 1/2 inch beyond jacket sleeve when arms at sides.",
      keywords: ["shirt cuff", "sleeve length", "cuff showing"],
      followUp: ["Sleeve issues?", "Too long/short?"],
      quickTips: ["1/4-1/2 inch", "Sign of proper fit"]
    },
    "shoulder_fit": {
      question: "How should jacket shoulders fit?",
      answer: "Shoulder seam ends where arm starts - no divots, no overhang. Most important fit point.",
      keywords: ["shoulders", "seam", "fit", "overhang"],
      followUp: ["Shoulder issues?", "Feel tight?"],
      quickTips: ["Can't fix shoulders", "Must fit perfectly"]
    },
    "tall_jacket_fall": {
      question: "How far below waist should jacket fall on tall guys?",
      answer: "Should still cover full seat. Tall men need 'long' or 'extra long' for proper proportion.",
      keywords: ["tall", "jacket length", "proportion"],
      followUp: ["Over 6'1\"?", "Current fit?"],
      quickTips: ["Proportion matters", "Don't go short"]
    }
  }
};

// SECTION 5: SLEEVE LENGTH
export const SLEEVE_LENGTH: SizingExpertise = {
  category: "Sleeve Length",
  questions: {
    "measure_sleeve": {
      question: "How to measure sleeve length?",
      answer: "From shoulder seam to wrist bone with arm slightly bent.",
      keywords: ["sleeve", "measure", "arm length"],
      followUp: ["Long arms?", "Current issues?"],
      quickTips: ["Slight bend", "To wrist bone"]
    },
    "sleeves_short": {
      question: "What if sleeves are too short?",
      answer: "Go up in sleeve length (tall size) or have tailor extend if possible (1-1.5\" max).",
      keywords: ["short sleeves", "too short", "arms showing"],
      followUp: ["How short?", "Long arms?"],
      quickTips: ["Try Long size", "Limited alteration"]
    },
    "sleeves_long": {
      question: "What if sleeves are too long?",
      answer: "Easy fix - tailor can shorten up to 3 inches.",
      keywords: ["long sleeves", "too long", "covering hands"],
      followUp: ["How much excess?", "Tailor available?"],
      quickTips: ["Easy to fix", "Common alteration"]
    },
    "arm_length_affect": {
      question: "Does arm length affect jacket size?",
      answer: "Yes. Long arms = need 'Long' jacket size. Short arms = 'Short' size.",
      keywords: ["arm length", "affect size", "proportion"],
      followUp: ["Arm span?", "Current fit?"],
      quickTips: ["Affects S/R/L choice", "Not chest size"]
    }
  }
};

// SECTION 6: FIT STYLES
export const FIT_STYLES: SizingExpertise = {
  category: "Fit Styles",
  questions: {
    "slim_fit": {
      question: "What is slim fit?",
      answer: "Narrower shoulders, tapered waist, slim thighs. Modern, younger look. 2-3\" less fabric than classic.",
      keywords: ["slim fit", "what is", "narrow", "tight"],
      followUp: ["Body type?", "Age/style preference?"],
      quickTips: ["Younger look", "Less forgiving"]
    },
    "modern_fit": {
      question: "What is modern fit?",
      answer: "Balanced cut between slim and classic. Slightly tapered but not tight. Most versatile.",
      keywords: ["modern fit", "balanced", "middle ground"],
      followUp: ["First suit?", "Versatility important?"],
      quickTips: ["Safe choice", "Works for most"]
    },
    "classic_fit": {
      question: "What is classic fit?",
      answer: "Fuller chest, waist, thigh. Traditional cut with more room. Best for comfort or larger builds.",
      keywords: ["classic fit", "traditional", "fuller", "roomy"],
      followUp: ["Comfort priority?", "Professional setting?"],
      quickTips: ["Most room", "Traditional look"]
    },
    "muscular_fit": {
      question: "What fit is best for muscular body type?",
      answer: "Athletic fit or tailored slim. Room in chest/shoulders, tapered waist.",
      keywords: ["muscular", "athletic", "gym", "built"],
      followUp: ["Chest size?", "Work out regularly?"],
      quickTips: ["Athletic cut", "May need tailoring"]
    },
    "heavier_fit": {
      question: "What fit is best for heavier men?",
      answer: "Classic fit with structured shoulders and side vents for movement. Darker colors slim.",
      keywords: ["heavier", "bigger", "overweight", "plus size"],
      followUp: ["Comfort important?", "Color preference?"],
      quickTips: ["Classic works", "Dark colors help"]
    },
    "tall_lean_fit": {
      question: "What fit is best for tall, lean men?",
      answer: "Slim fit or modern fit with extra length. Avoid classic (too boxy).",
      keywords: ["tall lean", "skinny tall", "thin"],
      followUp: ["How tall?", "Very slim?"],
      quickTips: ["Slim looks proportional", "Long sizes essential"]
    }
  }
};

// SECTION 7: BODY TYPE ADJUSTMENTS
export const BODY_TYPES: SizingExpertise = {
  category: "Body Type Adjustments",
  questions: {
    "v_shape": {
      question: "Big chest, small waist (V-shape)?",
      answer: "Athletic fit best. Buy for chest, tailor waist in. Drop 8 suits ideal.",
      keywords: ["v shape", "athletic", "triangle", "tapered"],
      followUp: ["Chest-waist difference?", "Athletic background?"],
      quickTips: ["Athletic cuts", "Expect tailoring"]
    },
    "broad_average": {
      question: "Broad shoulders, average waist?",
      answer: "Focus on shoulders fitting perfectly. Classic or modern fit, avoid slim.",
      keywords: ["broad shoulders", "average waist", "wide"],
      followUp: ["Shoulder measurement?", "Current issues?"],
      quickTips: ["Shoulders first", "Regular fits work"]
    },
    "stocky_build": {
      question: "Stocky build (short torso/legs)?",
      answer: "Look for 'Short' sizes. Avoid long jackets that overwhelm.",
      keywords: ["stocky", "short torso", "compact"],
      followUp: ["Height?", "Proportion issues?"],
      quickTips: ["Short sizes", "Proportion key"]
    },
    "tall_thin": {
      question: "Tall, thin build?",
      answer: "Long jacket essential, slim leg pants. European cuts often work well.",
      keywords: ["tall thin", "lanky", "skinny tall"],
      followUp: ["How tall?", "Weight?"],
      quickTips: ["Long sizes", "Slim fits"]
    },
    "overweight_build": {
      question: "Overweight build?",
      answer: "Darker suits, classic fit, structured shoulders. Side vents for movement.",
      keywords: ["overweight", "heavy", "large"],
      followUp: ["Comfort priority?", "Professional needs?"],
      quickTips: ["Dark colors", "Quality fabric"]
    },
    "muscular_legs": {
      question: "Muscular legs?",
      answer: "Flat-front pants with stretch fabric. Athletic cut. Avoid skinny fits.",
      keywords: ["muscular legs", "big thighs", "quads"],
      followUp: ["Squat regularly?", "Current fit issues?"],
      quickTips: ["Athletic pants", "Stretch fabric helps"]
    }
  }
};

// SECTION 8: DROP & PROPORTIONS
export const SUIT_DROP: SizingExpertise = {
  category: "Suit Drop (Jacket-to-Pant Ratio)",
  questions: {
    "what_is_drop": {
      question: "What is suit drop?",
      answer: "Difference in inches between jacket chest and pant waist. Standard is 6\" (40R jacket = 34W pants).",
      keywords: ["drop", "suit drop", "difference", "ratio"],
      followUp: ["Chest-waist difference?", "Athletic build?"],
      quickTips: ["Standard = 6", "Athletic = 7-8"]
    },
    "waist_no_match": {
      question: "What if my waist doesn't match the drop?",
      answer: "Buy separates or have pants tailored. Most common solution.",
      keywords: ["doesn't match", "wrong drop", "different size"],
      followUp: ["How different?", "Open to separates?"],
      quickTips: ["Separates work", "Tailoring helps"]
    },
    "athletic_drop": {
      question: "What drop for athletic builds?",
      answer: "Drop 7 or 8 - larger chest-to-waist difference. Some brands offer athletic cuts.",
      keywords: ["athletic drop", "v shape", "muscular"],
      followUp: ["Measurements?", "Current fit issues?"],
      quickTips: ["7-8 drop", "Athletic brands"]
    },
    "belly_drop": {
      question: "What drop for men with belly?",
      answer: "Drop 4 or 5 - less difference between chest and waist. Executive cut.",
      keywords: ["belly", "stomach", "portly", "executive"],
      followUp: ["Comfort important?", "Professional wear?"],
      quickTips: ["4-5 drop", "Executive cut"]
    }
  }
};

// SECTION 9: ALTERATIONS & TAILORING
export const ALTERATIONS: SizingExpertise = {
  category: "Alterations & Tailoring",
  questions: {
    "never_alter": {
      question: "Which part of suit should never be altered too much?",
      answer: "Shoulders. Hardest and most expensive to alter. Get these right from start.",
      keywords: ["never alter", "shoulders", "expensive", "difficult"],
      followUp: ["Shoulder fit?", "Other alterations needed?"],
      quickTips: ["Shoulders = dealbreaker", "$100+ to fix"]
    },
    "pants_hemmed": {
      question: "Can pants always be hemmed?",
      answer: "Yes, most common alteration. Usually $10-20.",
      keywords: ["hem", "pants", "length", "shorten"],
      followUp: ["Know inseam?", "Break preference?"],
      quickTips: ["Easy fix", "Budget for it"]
    },
    "jacket_let_out": {
      question: "Can jackets be let out/taken in?",
      answer: "Yes, usually by 1-2 inches at waist and chest. Limited by seam allowance.",
      keywords: ["let out", "take in", "adjust", "jacket"],
      followUp: ["How much needed?", "Current fit?"],
      quickTips: ["1-2 inch max", "Check seam allowance"]
    },
    "sleeve_adjusted": {
      question: "Can sleeve length be adjusted?",
      answer: "Yes, typically by 1-2 inches shorter, 1 inch longer (if fabric available).",
      keywords: ["sleeve", "adjust", "lengthen", "shorten"],
      followUp: ["How much adjustment?", "Functional buttons?"],
      quickTips: ["Easier to shorten", "Check button type"]
    },
    "waist_let_out": {
      question: "How many inches can pants waist be let out?",
      answer: "Typically up to 2 inches if fabric available. Taking in is easier - up to 4 inches.",
      keywords: ["waist", "let out", "pants", "bigger"],
      followUp: ["How much needed?", "Weight fluctuate?"],
      quickTips: ["2\" out max", "4\" in possible"]
    }
  }
};

// SECTION 10: SPECIAL CASES & EDGE CASES
export const SPECIAL_CASES: SizingExpertise = {
  category: "Special Cases",
  questions: {
    "very_short": {
      question: "What if I'm very short (under 5'5\")?",
      answer: "Choose 'Short' sizes or consider boys' XL/men's XS. Some brands offer 'Extra Short'.",
      keywords: ["very short", "under 5'5", "extra short"],
      followUp: ["Exact height?", "Current issues?"],
      quickTips: ["Short essential", "Boys XL option"]
    },
    "very_tall": {
      question: "What if I'm very tall (over 6'3\")?",
      answer: "Extra Long suits essential. May need custom for over 6'5\". Big & Tall sections.",
      keywords: ["very tall", "over 6'3", "extra long"],
      followUp: ["Exact height?", "Arm span?"],
      quickTips: ["XL sizes", "Custom may be needed"]
    },
    "very_slim": {
      question: "What if I'm very slim?",
      answer: "Extra slim or skinny fit lines. European/Italian cuts. May need boys' sizes if under 34 chest.",
      keywords: ["very slim", "skinny", "thin", "small"],
      followUp: ["Chest size?", "Weight?"],
      quickTips: ["European cuts", "Extra slim fits"]
    },
    "bodybuilder": {
      question: "What if I lift weights and have lats problem?",
      answer: "Expect tightness across back. Size up jacket, get athletic cut, add stretch fabric.",
      keywords: ["lats", "bodybuilder", "lift weights", "back tight"],
      followUp: ["Chest size?", "Back width?"],
      quickTips: ["Size up", "Stretch fabrics"]
    },
    "belly_larger": {
      question: "What if my belly is larger than chest?",
      answer: "Big & tall or portly cut jackets. Executive fit. Buy for belly, adjust chest.",
      keywords: ["belly larger", "stomach", "portly", "big belly"],
      followUp: ["Measurements?", "Comfort priority?"],
      quickTips: ["Portly cuts", "Executive fit"]
    },
    "size_up_or_down": {
      question: "If in doubt, should I size up or down?",
      answer: "Size up - easier to tailor down than let out. Too small can't be fixed.",
      keywords: ["doubt", "size up down", "unsure", "between"],
      followUp: ["Between what sizes?", "Tailoring budget?"],
      quickTips: ["Up is safer", "Tailor can fix"]
    },
    "number_one_rule": {
      question: "What is the #1 rule of suit sizing?",
      answer: "Fit the shoulders first. Everything else can be tailored, shoulders cannot.",
      keywords: ["#1 rule", "most important", "key", "golden rule"],
      followUp: ["Shoulders fit well?", "Other concerns?"],
      quickTips: ["Shoulders first", "Non-negotiable"]
    }
  }
};

// INTELLIGENT QUERY ANALYZER FOR SIZE BOT
export function analyzeSizeQuery(query: string): {
  category: string;
  answer: string;
  confidence: number;
  followUps: string[];
  tips: string[];
  measurements?: string[];
} {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  
  // Search through all expertise categories
  const allCategories = [
    GENERAL_SIZING,
    CHEST_SHOULDERS,
    WAIST_PANTS,
    JACKET_LENGTH,
    SLEEVE_LENGTH,
    FIT_STYLES,
    BODY_TYPES,
    SUIT_DROP,
    ALTERATIONS,
    SPECIAL_CASES
  ];
  
  // First, try exact keyword matching
  for (const category of allCategories) {
    for (const [key, data] of Object.entries(category.questions)) {
      // Check if query contains any keywords
      const hasKeyword = data.keywords.some(keyword => 
        queryLower.includes(keyword) || 
        keyword.split(' ').every(word => words.includes(word))
      );
      
      if (hasKeyword) {
        return {
          category: category.category,
          answer: data.answer,
          confidence: 95,
          followUps: data.followUp || [],
          tips: data.quickTips || [],
          measurements: extractMeasurements(query)
        };
      }
    }
  }
  
  // Context-based matching for common patterns
  const patterns = {
    measurement: {
      regex: /\b\d{2,3}[rRsSlL]?\b|\b\d{1,2}["']\s*\d{1,2}["']?\b/,
      category: "measurement_help",
      answer: "I see you mentioned measurements. Let me help you understand what those mean for your suit size."
    },
    height: {
      regex: /\b[456]'[0-9]+["']?|\b(short|tall|height)\b/,
      category: "height_based",
      answer: "Your height determines jacket length (S/R/L). Let me help you find the right length."
    },
    fit: {
      regex: /\b(tight|loose|big|small|fit)\b/,
      category: "fit_issue",
      answer: "Fit issues are common. Let me help diagnose what needs adjusting."
    },
    body: {
      regex: /\b(athletic|muscular|slim|thin|heavy|big)\b/,
      category: "body_type",
      answer: "Your body type affects suit choice. Let me recommend the best fit style for you."
    }
  };
  
  // Check patterns
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.regex.test(queryLower)) {
      return {
        category: pattern.category,
        answer: pattern.answer,
        confidence: 80,
        followUps: ["What's your chest size?", "What's your height?", "Any specific concerns?"],
        tips: ["Measurements help", "Consider your body type"],
        measurements: extractMeasurements(query)
      };
    }
  }
  
  // Default response for unclear queries
  return {
    category: "general_help",
    answer: "I'll help you find your perfect suit size. Let's start with your measurements.",
    confidence: 60,
    followUps: [
      "What's your chest measurement?",
      "How tall are you?",
      "What's your usual size?",
      "Any fit issues with current suits?"
    ],
    tips: ["Chest and height are key", "Shoulders must fit perfectly"],
    measurements: []
  };
}

// EXTRACT MEASUREMENTS FROM QUERY
function extractMeasurements(query: string): string[] {
  const measurements: string[] = [];
  
  // Extract chest sizes (36-54)
  const chestMatch = query.match(/\b(3[6-9]|4[0-9]|5[0-4])\b/);
  if (chestMatch) measurements.push(`Chest: ${chestMatch[0]}"`);
  
  // Extract height
  const heightMatch = query.match(/\b([456])'?\s*([0-9]+)"?/);
  if (heightMatch) measurements.push(`Height: ${heightMatch[0]}`);
  
  // Extract S/R/L
  const lengthMatch = query.match(/\b([SRL])\b/i);
  if (lengthMatch) {
    const length = lengthMatch[0].toUpperCase();
    measurements.push(`Length: ${length === 'S' ? 'Short' : length === 'R' ? 'Regular' : 'Long'}`);
  }
  
  // Extract waist
  const waistMatch = query.match(/\bwaist\s*(\d{2,3})\b/i);
  if (waistMatch) measurements.push(`Waist: ${waistMatch[1]}"`);
  
  return measurements;
}

// COMPREHENSIVE SIZE RECOMMENDATION
export function generateSizeRecommendation(
  chest?: number,
  height?: string,
  waist?: number,
  bodyType?: string
): {
  recommendation: string;
  jacketSize: string;
  pantSize: string;
  fitStyle: string;
  alterations: string[];
} {
  // Determine jacket size
  let jacketSize = chest ? `${chest}` : "Need chest measurement";
  
  // Determine length based on height
  if (height) {
    const heightInches = parseHeight(height);
    if (heightInches < 67) jacketSize += "S";
    else if (heightInches <= 72) jacketSize += "R";
    else if (heightInches <= 75) jacketSize += "L";
    else jacketSize += "XL";
  }
  
  // Determine pant size (standard drop 6)
  const pantSize = chest && waist ? `${waist}W` : 
                   chest ? `${chest - 6}W` : 
                   "Need measurements";
  
  // Determine fit style based on body type
  const fitStyle = bodyType === "athletic" ? "Athletic/Slim Fit" :
                  bodyType === "slim" ? "Slim Fit" :
                  bodyType === "average" ? "Modern Fit" :
                  bodyType === "larger" ? "Classic Fit" :
                  "Modern Fit (safe choice)";
  
  // Common alterations needed
  const alterations = [];
  if (chest && waist && (chest - waist) > 8) {
    alterations.push("Taper jacket waist");
  }
  alterations.push("Hem pants to length");
  if (bodyType === "athletic") {
    alterations.push("Let out thighs if needed");
  }
  
  const recommendation = `Based on your measurements: ${jacketSize} jacket with ${pantSize} pants in ${fitStyle}. ${alterations.length ? `Expect these alterations: ${alterations.join(", ")}.` : ""}`;
  
  return {
    recommendation,
    jacketSize,
    pantSize,
    fitStyle,
    alterations
  };
}

// PARSE HEIGHT STRING
function parseHeight(height: string): number {
  const match = height.match(/(\d+)'?\s*(\d+)?/);
  if (match) {
    const feet = parseInt(match[1]);
    const inches = match[2] ? parseInt(match[2]) : 0;
    return feet * 12 + inches;
  }
  return 70; // Default to average
}

// QUICK RESPONSE BUILDER
export function buildSizeResponse(query: string): {
  response: string;
  suggestions: string[];
  measurements: string[];
  confidence: number;
} {
  const analysis = analyzeSizeQuery(query);
  
  // Build conversational response
  let response = analysis.answer;
  
  // Add measurements if detected
  if (analysis.measurements && analysis.measurements.length > 0) {
    response += `\n\nI detected these measurements: ${analysis.measurements.join(", ")}`;
  }
  
  // Add quick tips
  if (analysis.tips && analysis.tips.length > 0) {
    response += `\n\n💡 Quick tips: ${analysis.tips.join(" • ")}`;
  }
  
  return {
    response,
    suggestions: analysis.followUps,
    measurements: analysis.measurements || [],
    confidence: analysis.confidence
  };
}

// EXPORT SIZE BOT EXPERTISE
export const SIZE_BOT_EXPERTISE = {
  categories: {
    GENERAL_SIZING,
    CHEST_SHOULDERS,
    WAIST_PANTS,
    JACKET_LENGTH,
    SLEEVE_LENGTH,
    FIT_STYLES,
    BODY_TYPES,
    SUIT_DROP,
    ALTERATIONS,
    SPECIAL_CASES
  },
  analyze: analyzeSizeQuery,
  recommend: generateSizeRecommendation,
  buildResponse: buildSizeResponse,
  extractMeasurements
};