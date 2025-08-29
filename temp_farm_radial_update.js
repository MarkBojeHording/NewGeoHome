// Just the resources calculation part for FarmRadialMenu

// TC calculation state  
const [mainTC, setMainTC] = useState({
  wood: '10',
  stone: '15', 
  metal: '5',
  hqm: '2'
});
const [trackRemainingTime, setTrackRemainingTime] = useState(false);
const [timerDays, setTimerDays] = useState('00');
const [timerHours, setTimerHours] = useState('00');
const [timerMinutes, setTimerMinutes] = useState('00');

// Helper to get numeric value from mainTC (treat empty string as 0)
const getNumericValue = (value) => {
  return value === '' ? 0 : Number(value);
};

// Get countdown to first Thursday (matching existing logic)
const getCountdown = () => {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), 1);
  while (target.getDay() !== 4) target.setDate(target.getDate() + 1);
  target.setHours(14, 0, 0, 0);
  if (target <= now) {
    target = new Date(target.setMonth(target.getMonth() + 1));
    target.setDate(1);
    while (target.getDay() !== 4) target.setDate(target.getDate() + 1);
    target.setHours(14, 0, 0, 0);
  }
  
  const diff = target.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    fractionalDays: Math.floor(diff / (1000 * 60 * 60 * 24)) + Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) / 24
  };
};

// Calculate optimal TC storage
const calculateOptimalStorage = () => {
  const daily = {
    wood: getNumericValue(mainTC.wood),
    stone: getNumericValue(mainTC.stone),
    metal: getNumericValue(mainTC.metal),
    hqm: getNumericValue(mainTC.hqm)
  };
  const SLOTS = 24;
  const STACK_LIMITS = { wood: 1000, stone: 1000, metal: 1000, hqm: 100 };
  
  // Skip if no upkeep
  const totalDaily = daily.wood + daily.stone + daily.metal + daily.hqm;
  if (totalDaily === 0) {
    return { totalMaterials: { wood: 0, stone: 0, metal: 0, hqm: 0 }, canFit: { wood: 0, stone: 0, metal: 0, hqm: 0 } };
  }
  
  const countdown = getCountdown();
  
  // Initialize slot allocation
  let slotAllocation = { wood: 0, stone: 0, metal: 0, hqm: 0 };
  let remainingSlots = SLOTS;
  
  // Allocate slots to maximize minimum days
  while (remainingSlots > 0) {
    let worstType = null;
    let worstDays = Infinity;
    
    // Find which resource runs out first (has least days)
    Object.keys(daily).forEach(type => {
      if (daily[type] > 0) {
        const currentCapacity = slotAllocation[type] * STACK_LIMITS[type];
        const days = currentCapacity / daily[type];
        if (days < worstDays) {
          worstDays = days;
          worstType = type;
        }
      }
    });
    
    if (worstType) {
      slotAllocation[worstType]++;
      remainingSlots--;
    } else {
      break;
    }
  }
  
  // Calculate max upkeep in TC
  const totalMaterials = {};
  Object.keys(daily).forEach(type => {
    if (daily[type] > 0) {
      const capacity = slotAllocation[type] * STACK_LIMITS[type];
      const daysUntilWipe = countdown.fractionalDays;
      totalMaterials[type] = Math.min(capacity, Math.floor(daily[type] * daysUntilWipe));
    } else {
      totalMaterials[type] = 0;
    }
  });

  // Calculate upkeep that can fit (if timer is active)
  const canFit = {};
  if (trackRemainingTime && (parseInt(timerDays) > 0 || parseInt(timerHours) > 0 || parseInt(timerMinutes) > 0)) {
    const days = parseInt(timerDays) || 0;
    const hours = parseInt(timerHours) || 0;
    const minutes = parseInt(timerMinutes) || 0;
    const fractionalDays = days + (hours / 24) + (minutes / (24 * 60));
    
    Object.keys(daily).forEach(type => {
      if (daily[type] > 0) {
        const capacity = slotAllocation[type] * STACK_LIMITS[type];
        const currentAmount = 0; // For simplicity, assume nothing currently in TC
        canFit[type] = Math.max(0, Math.min(capacity, Math.floor(daily[type] * fractionalDays)) - currentAmount);
      } else {
        canFit[type] = 0;
      }
    });
  } else {
    Object.keys(daily).forEach(type => {
      canFit[type] = totalMaterials[type];
    });
  }
  
  return { totalMaterials, canFit };
};

// Resource values based on TC calculations (replacing the old useState)
const resources = (() => {
  const tcResults = calculateOptimalStorage();
  // Use "Upkeep that can fit" if timer is active and has time, otherwise "Max Upkeep in TC"
  const hasTimerTime = trackRemainingTime && (parseInt(timerDays) > 0 || parseInt(timerHours) > 0 || parseInt(timerMinutes) > 0);
  const values = hasTimerTime ? tcResults.canFit : tcResults.totalMaterials;
  return {
    stone: values.stone || 0,
    metal: values.metal || 0,
    hqm: values.hqm || 0,
    wood: values.wood || 0
  };
})();