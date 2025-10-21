/**
 * Unit tests for regiment parser
 * Tests the extractRegiment function with various player name formats
 */

import { describe, it, expect } from 'vitest'

// Mock the LogParser class from the worker
class LogParser {
  constructor() {
    this.config = {
      regimentPatterns: [
        // CB Clan prefix patterns (highest priority)
        {
          name: "CB Clan with Brackets",
          pattern: "^CB\\s*[\\[\\{]([^\\]\\}]+)[\\]\\}]",
          description: "Extracts CB clan when followed by brackets/braces (e.g., CB[30thOH], CB{30thOH})",
          extractGroup: 0 // Return full match to get "CB"
        },
        {
          name: "CB Clan with Space and Wrapper",
          pattern: "^CB\\s+[\\[\\{]",
          description: "Matches CB followed by space and wrapper (e.g., CB [30thOH], CB {30thOH})",
          extractGroup: 0
        },
        // Brackets with Spaces
        {
          name: "Brackets with Spaces in Regiment (Case Insensitive)",
          pattern: "\\[([0-9]+(?:st|nd|rd|th)?\\s*[A-Za-z]{2,4})(?:\\s+[A-Za-z]{2,4})?\\]",
          description: "Extracts regiment from brackets with optional spaces",
          extractGroup: 1,
          normalize: "removeSpaces"
        },
        // Braces with Spaces
        {
          name: "Braces with Spaces in Regiment (Case Insensitive)",
          pattern: "\\{([0-9]+(?:st|nd|rd|th)?\\s*[A-Za-z]{2,4})(?:\\s+[A-Za-z]{2,4})?\\}",
          description: "Extracts regiment from braces with optional spaces",
          extractGroup: 1,
          normalize: "removeSpaces"
        },
        // Prefix Before Any Wrapper
        {
          name: "Prefix Before Any Wrapper",
          pattern: "^([A-Za-z]{2,4})\\s*-?\\s*[\\[\\{\\(][^\\]\\}\\)]+[\\]\\}\\)]",
          description: "Extracts prefix before any wrapper",
          extractGroup: 1
        },
        // Square Brackets (Generic)
        {
          name: "Square Brackets (Generic)",
          pattern: "\\[([^\\]]+)\\]",
          description: "Extracts leftmost [] token",
          normalize: "cleanCompanySuffix"
        },
        // Curly Braces (Generic)
        {
          name: "Curly Braces (Generic)",
          pattern: "\\{([^}]+)\\}",
          description: "Extracts leftmost {} token",
          normalize: "cleanCompanySuffix"
        },
        // Underscore Delimiter
        {
          name: "Underscore Delimiter",
          pattern: "^([A-Z]+)_([0-9]+(?:st|nd|rd|th)?[A-Z]+)",
          description: "Extracts regiment from underscore format (e.g., CB_8ThOhio)",
          extractGroup: 2
        }
      ]
    }
  }

  extractRegiment(playerName) {
    for (const pattern of this.config.regimentPatterns) {
      const regex = new RegExp(pattern.pattern, 'i') // Case insensitive
      const match = playerName.match(regex)
      if (match) {
        const extractGroup = pattern.extractGroup || 1
        let regiment = match[extractGroup]?.trim() || match[1]?.trim()
        
        // For CB patterns, extract just "CB"
        if (pattern.name.startsWith("CB Clan")) {
          regiment = "CB"
        }
        
        // Normalize regiment name
        if (regiment) {
          regiment = this.normalizeRegiment(regiment, pattern.normalize)
        }
        
        return regiment
      }
    }
    return 'Uncategorized'
  }

  normalizeRegiment(regiment, normalizeType) {
    // Remove trailing company letters with optional dots
    regiment = regiment.replace(/\.[A-Z](\*)?$/i, '')
    
    // Remove trailing asterisks
    regiment = regiment.replace(/\*+$/, '')
    
    // Remove standalone company letters at the end
    regiment = regiment.replace(/\s+[A-Z](\*)?$/i, '')
    
    // Apply specific normalization
    if (normalizeType === 'removeSpaces') {
      regiment = regiment.replace(/\s+/g, '')
    }
    
    if (normalizeType === 'removeDash') {
      regiment = regiment.replace(/-/g, '')
    }
    
    if (normalizeType === 'uppercase') {
      regiment = regiment.toUpperCase()
    }
    
    if (normalizeType === 'cleanCompanySuffix') {
      // Remove company suffixes
      regiment = regiment.replace(/\.CAV$/i, '')
      regiment = regiment.replace(/\.Cav$/i, '')
      regiment = regiment.replace(/\.WA$/i, '')
      regiment = regiment.replace(/\(LB\)$/i, '')
      regiment = regiment.replace(/\{[A-Z]\}$/i, '')
      regiment = regiment.replace(/\[[A-Z]\]$/i, '')
      regiment = regiment.replace(/\.[A-Z]{1,3}$/i, '')
    }
    
    // Normalize spacing (remove all spaces)
    regiment = regiment.replace(/\s+/g, '')
    
    // Convert to uppercase for consistent comparison
    regiment = regiment.toUpperCase()
    
    // Normalize ordinals to lowercase
    regiment = regiment.replace(/(\d+)(ST|ND|RD|TH)/g, (match, num, ordinal) => {
      return num + ordinal.toLowerCase()
    })
    
    // Trim any remaining whitespace
    regiment = regiment.trim()
    
    return regiment
  }
}

describe('Regiment Parser', () => {
  const parser = new LogParser()

  describe('CB Clan Format', () => {
    it('should extract CB from CB[30thOH]Pvt. Riley Gaming', () => {
      expect(parser.extractRegiment('CB[30thOH]Pvt. Riley Gaming')).toBe('CB')
    })

    it('should extract CB from CB{30thOh}Cpt.HomelessBanana', () => {
      expect(parser.extractRegiment('CB{30thOh}Cpt.HomelessBanana')).toBe('CB')
    })

    it('should extract CB from CB{30thOH} 1stLt. Falcon', () => {
      expect(parser.extractRegiment('CB{30thOH} 1stLt. Falcon')).toBe('CB')
    })

    it('should extract CB from CB {30thOH} Merc. Minty', () => {
      expect(parser.extractRegiment('CB {30thOH} Merc. Minty')).toBe('CB')
    })

    it('should extract CB from CB_8ThOhio_Pv2_Sword', () => {
      expect(parser.extractRegiment('CB_8ThOhio_Pv2_Sword')).toBe('CB')
    })

    it('should extract CB from cb{30thoh} Pvt. Dragonov (lowercase)', () => {
      expect(parser.extractRegiment('cb{30thoh} Pvt. Dragonov')).toBe('CB')
    })

    it('should extract CB from CB[8thOH]Capt.WompWomp', () => {
      expect(parser.extractRegiment('CB[8thOH]Capt.WompWomp')).toBe('CB')
    })

    it('should extract CB from CB {30th OH} Pvt.DJ [S]', () => {
      expect(parser.extractRegiment('CB {30th OH} Pvt.DJ [S]')).toBe('CB')
    })
  })

  describe('Standard Regiment Formats', () => {
    it('should extract 8thCT from [8thCT.Cav]1Sgt. Mucho Bitey', () => {
      expect(parser.extractRegiment('[8thCT.Cav]1Sgt. Mucho Bitey')).toBe('8thCT')
    })

    it('should extract 1stMD from V-[1stMD.Cav]SgtMaj.UMP45', () => {
      expect(parser.extractRegiment('V-[1stMD.Cav]SgtMaj.UMP45')).toBe('1stMD')
    })

    it('should extract 65thIL from V-[65th-IL]PVT.Dman2112g', () => {
      expect(parser.extractRegiment('V-[65th-IL]PVT.Dman2112g')).toBe('65thIL')
    })

    it('should extract 65thIL from {65th IL} Fire Truck', () => {
      expect(parser.extractRegiment('PVT {65th IL} Fire Truck')).toBe('65thIL')
    })

    it('should extract 7thAR from (7TH AR) CCSPC VooDoo', () => {
      expect(parser.extractRegiment('(7TH AR) CCSPC VooDoo')).toBe('7thAR')
    })

    it('should extract 6thAR from (6thAR.WA)OrdSgt Spaniard', () => {
      expect(parser.extractRegiment('(6thAR.WA)OrdSgt Spaniard')).toBe('6thAR')
    })
  })

  describe('Edge Cases', () => {
    it('should handle mixed case regiment names', () => {
      expect(parser.extractRegiment('[1STMD.CAV]rct.KryTop')).toBe('1stMD')
    })

    it('should handle spaces in regiment names', () => {
      expect(parser.extractRegiment('[7THLA.(LB)]MCan.Photoshop™')).toBe('7thLA')
    })

    it('should return Uncategorized for unmatched patterns', () => {
      expect(parser.extractRegiment('RandomPlayerName123')).toBe('Uncategorized')
    })

    it('should handle special characters in player names', () => {
      expect(parser.extractRegiment('CB[8thOH]Pfc. Henry Kissinger (')).toBe('CB')
    })
  })

  describe('Company Suffix Removal', () => {
    it('should remove .CAV suffix', () => {
      expect(parser.extractRegiment('[8thCT.CAV]Sgt. Woodhams')).toBe('8thCT')
    })

    it('should remove .Cav suffix (mixed case)', () => {
      expect(parser.extractRegiment('[1stMD.Cav]Sgt.Harold')).toBe('1stMD')
    })

    it('should remove (LB) suffix', () => {
      expect(parser.extractRegiment('[7thLA.(LB)]Cpl.Williman')).toBe('7thLA')
    })

    it('should remove {A} suffix', () => {
      expect(parser.extractRegiment('[8thCT{A}]Pfc. Puncakian')).toBe('8thCT')
    })
  })
})
