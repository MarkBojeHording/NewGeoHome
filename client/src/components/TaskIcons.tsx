// ============= TASK ICON COMPONENTS =============

// Task Report Icons - using emoji style with subtle animations
export const TaskOreIcon = ({ onClick, task }) => (
  <span 
    className="text-xs inline-block cursor-pointer hover:scale-110 transition-transform" 
    title="Ore Pickup - Click for details"
    onClick={(e) => onClick(e, task)}
    style={{
      animation: 'taskPulse 3.45s ease-in-out infinite, taskBounce 3.45s ease-in-out infinite'
    }}
  >
    🪨
  </span>
)

export const TaskLootIcon = ({ onClick, task }) => (
  <span 
    className="text-xs inline-block cursor-pointer hover:scale-110 transition-transform" 
    title="Loot Pickup - Click for details"
    onClick={(e) => onClick(e, task)}
    style={{
      animation: 'taskPulse 3.45s ease-in-out infinite, taskBounce 3.45s ease-in-out infinite',
      animationDelay: '0s, 0.5s'
    }}
  >
    📦
  </span>
)

export const TaskRepairIcon = ({ onClick, task }) => (
  <span 
    className="text-xs inline-block cursor-pointer hover:scale-110 transition-transform" 
    title="Repair Task - Click for details"
    onClick={(e) => onClick(e, task)}
    style={{
      animation: 'taskPulse 3.45s ease-in-out infinite, taskBounce 3.45s ease-in-out infinite',
      animationDelay: '0s, 1s'
    }}
  >
    🔧
  </span>
)

export const TaskUpgradeIcon = ({ onClick, task }) => (
  <span 
    className="text-xs inline-block cursor-pointer hover:scale-110 transition-transform" 
    title="Upgrade Task - Click for details"
    onClick={(e) => onClick(e, task)}
    style={{
      animation: 'taskPulse 3.45s ease-in-out infinite, taskBounce 3.45s ease-in-out infinite',
      animationDelay: '0s, 1.5s'
    }}
  >
    🚧
  </span>
)

export const TaskResourcesIcon = ({ onClick, task }) => (
  <span 
    className="text-xs inline-block cursor-pointer hover:scale-110 transition-transform" 
    title="Resource Request - Click for details"
    onClick={(e) => onClick(e, task)}
    style={{
      animation: 'taskPulse 3.45s ease-in-out infinite, taskBounce 3.45s ease-in-out infinite',
      animationDelay: '0s, 2s'
    }}
  >
    📋
  </span>
)