/**
 * Unit tests for regiment parser
 * Tests the extractRegiment function with various player name formats
 */

import { describe, it, expect } from 'vitest'
import parsingConfig from '../src/config/parsing-config.json'

// Mock the LogParser class from the worker
class LogParser {
  constructor() {
    this.config = parsingConfig
  }

  extractRegiment(playerName) {
    for (const pattern of this.config.regimentPatterns) {
      const regex = new RegExp(pattern.pattern, 'i') // Case insensitive
      const match = playerName.match(regex)
      if (match) {
        const extractGroup = pattern.extractGroup || 1
        let regiment = match[extractGroup]?.trim() || match[1]?.trim()
        
        // Special handling for clan extraction patterns
        if (pattern.normalize === 'extractCB') {
          regiment = 'CB'
        } else if (pattern.normalize === 'extractCQB') {
          regiment = 'CQB'
        } else if (pattern.normalize === 'extractTKO') {
          regiment = 'TKO'
        } else if (pattern.normalize === 'extractJD') {
          regiment = 'JD'
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
      regiment = regiment.replace(/\.\(LB\)$/i, '')
      regiment = regiment.replace(/\(LB\)$/i, '')
      regiment = regiment.replace(/\{[A-Z]\}$/i, '')
      regiment = regiment.replace(/\{[A-Z]{2}\}$/i, '')
      regiment = regiment.replace(/\[[A-Z]\]$/i, '')
      regiment = regiment.replace(/\.[A-Z]{1,3}$/i, '')
    }
    
    if (normalizeType === 'truncateState') {
      // Truncate state abbreviations longer than 2 letters
      // Match pattern like "8ThOhio" and convert to "8thOH"
      regiment = regiment.replace(/(\d+(?:st|nd|rd|th)?)([A-Z][a-z]{2,})/i, (match, num, state) => {
        return num + state.substring(0, 2).toUpperCase()
      })
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

    it('should extract CB from CB_8ThOhio_Pv2_Sword (underscore format)', () => {
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

    it('should extract CB from CB(8thOh)Cpl. Shagsby', () => {
      expect(parser.extractRegiment('CB(8thOh)Cpl. Shagsby')).toBe('CB')
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

  describe('JD Clan Format', () => {
    it('should extract JD from JD[38Va]SgtMaj.TacticalPotato', () => {
      expect(parser.extractRegiment('JD[38Va]SgtMaj.TacticalPotato')).toBe('JD')
    })

    it('should extract JD from JD-[38th Va]Cpt.Frostyspace2', () => {
      expect(parser.extractRegiment('JD-[38th Va]Cpt.Frostyspace2')).toBe('JD')
    })

    it('should extract JD from JD{JD-CAV}ExaltedCyclopsMantis', () => {
      expect(parser.extractRegiment('JD{JD-CAV}ExaltedCyclopsMantis')).toBe('JD')
    })

    it('should extract JD from JD[JD-Cav]QMSgt.T1GERKiNG87', () => {
      expect(parser.extractRegiment('JD[JD-Cav]QMSgt.T1GERKiNG87')).toBe('JD')
    })

    it('should extract JD from JD[JD-Cav]1stSgt.Spooky Ghost', () => {
      expect(parser.extractRegiment('JD[JD-Cav]1stSgt.Spooky Ghost')).toBe('JD')
    })

    it('should extract JD from JD-[38th VA] 2ndLt. Flandre', () => {
      expect(parser.extractRegiment('JD-[38th VA] 2ndLt. Flandre')).toBe('JD')
    })

    it('should extract JD from JD[2nd Ga-INF]LCpl.Deko', () => {
      expect(parser.extractRegiment('JD[2nd Ga-INF]LCpl.Deko')).toBe('JD')
    })
  })

  describe('Debug Report Cases - Oct 2025', () => {
    it('should extract 12th from [12th]TheThrongler', () => {
      expect(parser.extractRegiment('[12th]TheThrongler')).toBe('12th')
    })

    it('should extract 59NY from [59NY(WB)] Pvt. OShronk', () => {
      expect(parser.extractRegiment('[59NY(WB)] Pvt. OShronk')).toBe('59NY')
    })

    it('should extract CB from CB_8ThOhio_Pv2_Sword (clan extraction)', () => {
      expect(parser.extractRegiment('CB_8ThOhio_Pv2_Sword')).toBe('CB')
    })

    it('should extract 59thNY from [59thNY (B)] Pvt. Nurt', () => {
      expect(parser.extractRegiment('[59thNY (B)] Pvt. Nurt')).toBe('59thNY')
    })

    it('should extract 7thTX from [7thTX. H]Vol. Cole McLean', () => {
      expect(parser.extractRegiment('[7thTX. H]Vol. Cole McLean')).toBe('7thTX')
    })

    it('should extract AVC from AVC[9thAL Cav] 2ndLt. Tater', () => {
      expect(parser.extractRegiment('AVC[9thAL Cav] 2ndLt. Tater')).toBe('AVC')
    })

    it('should extract AVC from AVC[8thAL]Snr.Pvt. Ghost Delta', () => {
      expect(parser.extractRegiment('AVC[8thAL]Snr.Pvt. Ghost Delta')).toBe('AVC')
    })

    it('should extract AVC from AVC[8thAL] Pvt. MarsTheDoomer', () => {
      expect(parser.extractRegiment('AVC[8thAL] Pvt. MarsTheDoomer')).toBe('AVC')
    })

    it('should extract AVC from AVC(8thAL)Pvt.Zack', () => {
      expect(parser.extractRegiment('AVC(8thAL)Pvt.Zack')).toBe('AVC')
    })

    it('should extract AVC from AVC[8thAL.I]Cpl.MNnative187', () => {
      expect(parser.extractRegiment('AVC[8thAL.I]Cpl.MNnative187')).toBe('AVC')
    })

    it('should extract AVC from AVC[9thCav] Rct. Tez', () => {
      expect(parser.extractRegiment('AVC[9thCav] Rct. Tez')).toBe('AVC')
    })

    it('should extract AVC from AVC[8thAL] Pvt. IlustriusWeiner', () => {
      expect(parser.extractRegiment('AVC[8thAL] Pvt. IlustriusWeiner')).toBe('AVC')
    })

    it('should extract AVC from AVC[8thAL]DrumMaj.Bootystyx', () => {
      expect(parser.extractRegiment('AVC[8thAL]DrumMaj.Bootystyx')).toBe('AVC')
    })
  })

  describe('Debug Report Cases - Oct 21, 2025', () => {
    it('should extract 12thVA from [12thVA.A.] Cpl. Kettle', () => {
      expect(parser.extractRegiment('[12thVA.A.] Cpl. Kettle')).toBe('12thVA')
    })

    it('should extract 51stAL from [51st AL.] Cpl. Jimmy', () => {
      expect(parser.extractRegiment('[51st AL.] Cpl. Jimmy')).toBe('51stAL')
    })

    it('should extract TKO from TKO-[CB]Cpl. Goolock', () => {
      expect(parser.extractRegiment('TKO-[CB]Cpl. Goolock')).toBe('TKO')
    })

    it('should extract TKO from TKO-[CB]Cpl. Rukian', () => {
      expect(parser.extractRegiment('TKO-[CB]Cpl. Rukian')).toBe('TKO')
    })
  })
})
