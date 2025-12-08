import { User, Band, InstrumentType } from '../types';
import { BAND_NAMES } from '../constants';

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}

/**
 * Smart Shuffle that prioritizes users with FEWER plays.
 * It groups users by play counts, shuffles within groups, then flattens.
 */
function priorityShuffle(users: User[], playCounts: Record<string, number>): User[] {
    const grouped: Record<number, User[]> = {};
    let maxPlays = 0;

    users.forEach(u => {
        const count = playCounts[u.id] || 0;
        if (!grouped[count]) grouped[count] = [];
        grouped[count].push(u);
        if (count > maxPlays) maxPlays = count;
    });

    let result: User[] = [];
    // Iterate from 0 plays up to maxPlays
    for (let i = 0; i <= maxPlays; i++) {
        if (grouped[i] && grouped[i].length > 0) {
            result = [...result, ...shuffle(grouped[i])];
        }
    }

    return result;
}

/**
 * Helper to get pair frequency score
 */
const getPairScore = (u1: User, u2: User, pairHistory: Record<string, number>) => {
  const key = [u1.id, u2.id].sort().join('-');
  return pairHistory[key] || 0;
};

/**
 * Builds the history of pairings from existing bands + past bands
 */
const buildPairHistory = (bands: Band[]): Record<string, number> => {
  const history: Record<string, number> = {};
  bands.forEach(band => {
    for (let x = 0; x < band.members.length; x++) {
      for (let y = x + 1; y < band.members.length; y++) {
        const u1 = band.members[x];
        const u2 = band.members[y];
        const key = [u1.id, u2.id].sort().join('-');
        history[key] = (history[key] || 0) + 1;
      }
    }
  });
  return history;
};

/**
 * Finds the last instrument played by a user in the most recent bands.
 */
const getLastPlayedRole = (userId: string, allBands: Band[]): InstrumentType | null => {
  // Traverse backwards
  for (let i = allBands.length - 1; i >= 0; i--) {
    const member = allBands[i].members.find(m => m.id === userId);
    if (member && member.assignedRole) {
      return member.assignedRole;
    }
  }
  return null;
};

/**
 * Determines the best instrument for a user based on rotation logic.
 * Avoids instruments already occupied in the current band.
 */
const getRotatedRole = (
  user: User, 
  occupiedInstruments: Set<InstrumentType>, 
  lastRole: InstrumentType | null
): InstrumentType | null => {
  
  // Filter instruments that are NOT currently occupied in the new band
  const validInstruments = user.instruments.filter(inst => !occupiedInstruments.has(inst));
  
  if (validInstruments.length === 0) return null; // No available slots for this user

  // If user only has one valid option, return it
  if (validInstruments.length === 1) return validInstruments[0];

  // If no history, pick random from valid
  if (!lastRole) return validInstruments[Math.floor(Math.random() * validInstruments.length)];

  // ROTATION LOGIC:
  // Find index of lastRole in the user's FULL instrument list to determine "next" preference
  const fullList = user.instruments;
  const lastIndex = fullList.indexOf(lastRole);
  
  // Reorder full list starting from the instrument AFTER the last played one
  // e.g. [A, B, C], last was A -> priority: B, C, A
  const priorityList = [
    ...fullList.slice(lastIndex + 1),
    ...fullList.slice(0, lastIndex + 1)
  ];

  // Find the first one in priority list that is currently valid (not occupied)
  const bestFit = priorityList.find(inst => !occupiedInstruments.has(inst)); // occupied check is redundant since priorityList contains all, but we need to match against valid
  
  return bestFit && !occupiedInstruments.has(bestFit) ? bestFit : validInstruments[0];
};

/**
 * Helper function to get a unique band name not present in the forbidden set.
 */
export const getUniqueBandName = (forbiddenNames: Set<string>): string => {
  // Filter names that are NOT in the forbidden set
  const available = BAND_NAMES.filter(name => !forbiddenNames.has(name));

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  // Fallback if all names are taken: Generate a variation
  let attempts = 0;
  let candidate = "";
  do {
      const base = BAND_NAMES[Math.floor(Math.random() * BAND_NAMES.length)];
      candidate = `${base} ${Math.floor(Math.random() * 100) + 2}`;
      attempts++;
  } while (forbiddenNames.has(candidate) && attempts < 20);
  
  return candidate || `Band ${Date.now()}`;
};

/**
 * Generates a SINGLE next band based on constraints.
 */
export const generateNextBand = (allUsers: User[], existingBands: Band[], pastBands: Band[] = [], fixedSize: number = 0): Band | null => {
  // FILTER: Only consider ACTIVE users
  const activeUsers = allUsers.filter(u => u.status === 'ACTIVE');

  if (activeUsers.length < 3) return null;

  // Combine history for logic
  const fullBandHistory = [...pastBands, ...existingBands];
  const pairHistory = buildPairHistory(fullBandHistory);
  
  // Calculate total plays for fair rotation
  const playCounts: Record<string, number> = {};
  fullBandHistory.forEach(b => b.members.forEach(m => {
      playCounts[m.id] = (playCounts[m.id] || 0) + 1;
  }));

  // 1. Determine Cooldowns
  // We strictly avoid people in the very last band to prevent back-to-back playing
  const lastBand = existingBands.length > 0 ? existingBands[existingBands.length - 1] : (pastBands.length > 0 ? pastBands[pastBands.length - 1] : null);
  const cooldownIds = new Set(lastBand ? lastBand.members.map(u => u.id) : []);

  // Split users and sort by Priority (Least Plays -> Most Plays)
  const availableUsersRaw = activeUsers.filter(u => !cooldownIds.has(u.id));
  const cooldownUsersRaw = activeUsers.filter(u => cooldownIds.has(u.id));

  // Use Priority Shuffle
  let availableUsers = priorityShuffle(availableUsersRaw, playCounts);
  let cooldownUsers = priorityShuffle(cooldownUsersRaw, playCounts);

  // State for the new band
  const selectedMembers: User[] = [];
  const selectedIds = new Set<string>();
  const occupiedInstruments = new Set<InstrumentType>();

  /**
   * Helper: Add user to band with specific role
   */
  const admitMember = (user: User, role: InstrumentType) => {
    selectedMembers.push({ ...user, assignedRole: role }); // CLONE user and assign role
    selectedIds.add(user.id);
    occupiedInstruments.add(role);
  };

  /**
   * Helper: Tries to find a suitable user for a specific role.
   * Checks strictly that the role is not already occupied.
   * If a user plays multiple instruments, checks if THIS role fits their rotation/availability.
   */
  const pickMemberForRole = (roleNeeded: InstrumentType): boolean => {
    if (occupiedInstruments.has(roleNeeded)) return false;

    // Logic: User must have the instrument. 
    // Optimization: logic regarding rotation happens "softly" here. 
    // We strictly need 'roleNeeded'. We just check if a user HAS it.
    
    const isValid = (u: User) => !selectedIds.has(u.id) && u.instruments.includes(roleNeeded);

    // Try available first (sorted by least plays)
    let candidate = availableUsers.find(isValid);
    // Fallback to cooldown if absolutely necessary
    if (!candidate) {
      candidate = cooldownUsers.find(isValid);
    }

    if (candidate) {
      admitMember(candidate, roleNeeded);
      return true;
    }
    return false;
  };

  /**
   * Helper: Picks a user who can do Harmonic (Guitar OR Keys).
   * Prioritizes instrument based on user's rotation if possible.
   */
  const pickHarmonic = (): boolean => {
    const canGuitar = !occupiedInstruments.has(InstrumentType.GUITAR);
    const canKeys = !occupiedInstruments.has(InstrumentType.KEYS);

    if (!canGuitar && !canKeys) return false;

    // Find someone who can play at least one of the available slots
    const isValid = (u: User) => {
      if (selectedIds.has(u.id)) return false;
      const hasGuitar = u.instruments.includes(InstrumentType.GUITAR);
      const hasKeys = u.instruments.includes(InstrumentType.KEYS);
      return (hasGuitar && canGuitar) || (hasKeys && canKeys);
    };

    let candidate = availableUsers.find(isValid) || cooldownUsers.find(isValid);

    if (candidate) {
      const lastRole = getLastPlayedRole(candidate.id, fullBandHistory);
      
      // Determine preference
      const hasGuitar = candidate.instruments.includes(InstrumentType.GUITAR);
      const hasKeys = candidate.instruments.includes(InstrumentType.KEYS);
      
      let chosenRole: InstrumentType | null = null;

      // If they have both and both slots are open, use rotation logic
      if (hasGuitar && hasKeys && canGuitar && canKeys) {
         // Simple rotation check
         chosenRole = getRotatedRole(candidate, occupiedInstruments, lastRole);
         // Ensure the rotated role is actually Guitar or Keys (it should be)
         if (chosenRole !== InstrumentType.GUITAR && chosenRole !== InstrumentType.KEYS) {
             chosenRole = InstrumentType.GUITAR; // Fallback
         }
      } 
      // Else force the available one
      else if (hasGuitar && canGuitar) {
        chosenRole = InstrumentType.GUITAR;
      } else if (hasKeys && canKeys) {
        chosenRole = InstrumentType.KEYS;
      }

      if (chosenRole) {
        admitMember(candidate, chosenRole);
        return true;
      }
    }
    return false;
  };

  // --- PHASE 1: CORE ROLES (3 members) ---
  const okDrums = pickMemberForRole(InstrumentType.DRUMS);
  const okBass = pickMemberForRole(InstrumentType.BASS);
  const okHarmonic = pickHarmonic();

  // Require all core roles to be present; otherwise abort generation
  if (!okDrums || !okBass || !okHarmonic) {
    return null;
  }

  // --- PHASE 2: FILL REMAINDER (Target Size 3 to 6 OR Fixed) ---
  const targetSize = fixedSize > 0 ? fixedSize : Math.floor(Math.random() * (6 - 3 + 1)) + 3;

  // Create pool
  let remainderPool = [
    ...availableUsers.filter(u => !selectedIds.has(u.id)),
    ...cooldownUsers.filter(u => !selectedIds.has(u.id))
  ];

  // Sort by pair score (diversity) BUT weighted heavily by play count
  // We already sorted by play count via priorityShuffle, so the order is roughly correct.
  // We just want to ensure we don't break that order too much with pair scoring.
  remainderPool.sort((a, b) => {
      // Primary sort: Play counts
      const playsA = playCounts[a.id] || 0;
      const playsB = playCounts[b.id] || 0;
      if (playsA !== playsB) return playsA - playsB;

      // Secondary sort: Pair diversity
      let scoreA = 0;
      let scoreB = 0;
      selectedMembers.forEach(m => {
        scoreA += getPairScore(a, m, pairHistory);
        scoreB += getPairScore(b, m, pairHistory);
      });
      return scoreA - scoreB; 
  });

  // Loop to fill slots
  for (const candidate of remainderPool) {
    if (selectedMembers.length >= targetSize) break;

    const lastRole = getLastPlayedRole(candidate.id, fullBandHistory);
    
    // Get the best instrument for this user that isn't taken
    const bestRole = getRotatedRole(candidate, occupiedInstruments, lastRole);

    if (bestRole) {
      admitMember(candidate, bestRole);
    }
  }

  // Get Unique Name
  const usedNames = new Set([
      ...existingBands.map(b => b.name),
      ...pastBands.map(b => b.name)
  ]);
  const finalName = getUniqueBandName(usedNames);

  return {
    id: `band-auto-${Date.now()}`,
    name: finalName,
    members: selectedMembers,
    isManual: false,
    durationMinutes: 6 // Default duration
  };
};

/**
 * GENERATES DEMO DATA FOR TESTING
 */
export const generateDemoData = (): User[] => {
  const names = [
    "Mario", "Luigi", "Peach", "Toad", "Bowser", "Wario", "Yoshi", "Zelda", "Link", "Ganondorf",
    "Samus", "Kirby", "Donkey", "Diddy", "Fox", "Falco", "Pikachu", "Jigglypuff", "Sonic", "Tails"
  ];
  const lastNames = [
    "Rossi", "Verdi", "Bianchi", "Neri", "Gialli", "Blu", "Viola", "Arancio", "Rosa", "Marrone",
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"
  ];

  const demoUsers: User[] = [];

  for (let i = 0; i < 20; i++) {
    const isMulti = i < 8; // First 8 are multi-instrumentalists
    const instruments: InstrumentType[] = [];
    
    // Ensure distribution
    if (i % 5 === 0) instruments.push(InstrumentType.DRUMS);
    else if (i % 5 === 1) instruments.push(InstrumentType.BASS);
    else if (i % 5 === 2) instruments.push(InstrumentType.GUITAR);
    else if (i % 5 === 3) instruments.push(InstrumentType.KEYS);
    else instruments.push(InstrumentType.VOICE);

    if (isMulti) {
       // Add a second random instrument
       const opts = [InstrumentType.VOICE, InstrumentType.GUITAR, InstrumentType.KEYS, InstrumentType.OTHER];
       const second = opts[Math.floor(Math.random() * opts.length)];
       if (!instruments.includes(second)) instruments.push(second);
    }

    demoUsers.push({
      id: `demo-${i}`,
      firstName: names[i],
      lastName: lastNames[i],
      username: `${names[i].toLowerCase()}_${lastNames[i].substring(0, 1).toLowerCase()}`,
      instruments: instruments,
      status: 'ACTIVE',
      createdAt: Date.now(),
      avatarSeed: `seed-${i}`
    });
  }
  
  return demoUsers;
};
