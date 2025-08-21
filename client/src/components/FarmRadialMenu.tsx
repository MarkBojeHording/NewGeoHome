import React, { useState, useEffect } from 'react';

const RadialMenu = () => {
  const [selectedInner, setSelectedInner] = useState(null);
  const [selectedOuter, setSelectedOuter] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [segment1A1Value, setSegment1A1Value] = useState('00');
  const [segment1A2Value, setSegment1A2Value] = useState('00');
  const [segmentCoreValue, setSegmentCoreValue] = useState('00');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Resource values in raw numbers (will be divided by 1000 for display)
  const [resources, setResources] = useState({
    stone: 0,
    metal: 0,
    hqm: 0,
    wood: 0
  });
  
  // Decay schedule values
  const [decayResources, setDecayResources] = useState({
    stone: { current: 0, max: 500 },
    metal: { current: 0, max: 1000 },
    hqm: { current: 0, max: 2000 }
  });
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        const hasActiveOverlay = selectedInner !== null;
        
        if (hasActiveOverlay) {
          setSelectedInner(null);
        } else if (isExpanded) {
          setIsExpanded(false);
          setSelectedInner(null);
          setSelectedOuter(null);
          setHoveredSegment(null);
          setSegment1A1Value('00');
          setSegment1A2Value('00');
          setSegmentCoreValue('00');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedInner, isExpanded]);
  
  // Configuration
  const centerX = 220;
  const centerY = 250;
  const innerRadius = 40;
  const middleRadius = 150;
  const outerRadius = 190;
  const startAngle = 180;
  const segments = 6;
  const totalAngle = 270;
  const segmentAngle = totalAngle / segments;
  
  // Gap texts for each section
  const gapTexts = [
    'HARVEST TIMER',   // Red section (index 0)
    'NEEDS PICKUP',    // Yellow section (index 1)
    'REPAIR/UPGRADE',  // Green section (index 2)
    'NEEDS RESOURCES', // Light blue section (index 3)
    'DECAYING OUT',    // Blue section (index 4)
    'MAKE REPORT'      // Purple section (index 5)
  ];

  // Resource configuration
  const resourceConfig = [
    { name: 'Stone', key: 'stone', color: 'white', radius: 18 },
    { name: 'Metal', key: 'metal', color: '#E57373', radius: 30 },
    { name: 'HQM', key: 'hqm', color: 'hsl(200, 25%, 75%)', radius: 42, 
      style: { textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0px 0px 3px rgba(255,255,255,0.3)' } },
    { name: 'Wood', key: 'wood', color: 'hsl(30, 60%, 45%)', radius: 54 }
  ];

  // Plant emojis configuration
  const plantEmojis = {
    '0-green': { emoji: '🌿', name: 'Hemp' },
    '0-0-bottom': { emoji: '🍋', name: 'Yellow Berries' },
    '0-0-top': { emoji: '🎃', name: 'Pumpkin' },
    '0-1-bottom': { emoji: '🍓', name: 'Red Berries' },
    '0-1-top': { emoji: '🫐', name: 'Blueberries' }
  };
  
  // Handle Action button click
  const handleActionClick = () => {
    if (isExpanded) {
      setSelectedInner(null);
      setSelectedOuter(null);
      setHoveredSegment(null);
      setSegment1A1Value('00');
      setSegment1A2Value('00');
      setSegmentCoreValue('00');
    }
    setIsExpanded(!isExpanded);
  };
  
  // Function to update resource values
  const updateResources = (updates) => {
    setResources(prev => ({ ...prev, ...updates }));
  };
  
  // Format resource value with K suffix
  const formatResourceValue = (value) => {
    return value >= 1000 
      ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` 
      : value.toString();
  };
  
  // Generate path for a segment
  const createPath = (startRadius, endRadius, segmentIndex, subSegment = null, customAngles = null) => {
    let startSegmentAngle, endSegmentAngle;
    
    if (customAngles) {
      startSegmentAngle = customAngles.start;
      endSegmentAngle = customAngles.end;
    } else {
      startSegmentAngle = startAngle + (segmentIndex * segmentAngle);
      endSegmentAngle = startSegmentAngle + segmentAngle;
      
      if (subSegment !== null) {
        const halfSegment = segmentAngle / 2;
        if (subSegment === 0) {
          endSegmentAngle = startSegmentAngle + halfSegment;
        } else {
          startSegmentAngle = startSegmentAngle + halfSegment;
        }
      }
    }
    
    const startAngleRad = (startSegmentAngle * Math.PI) / 180;
    const endAngleRad = (endSegmentAngle * Math.PI) / 180;
    
    const x1 = centerX + startRadius * Math.cos(startAngleRad);
    const y1 = centerY + startRadius * Math.sin(startAngleRad);
    const x2 = centerX + endRadius * Math.cos(startAngleRad);
    const y2 = centerY + endRadius * Math.sin(startAngleRad);
    const x3 = centerX + endRadius * Math.cos(endAngleRad);
    const y3 = centerY + endRadius * Math.sin(endAngleRad);
    const x4 = centerX + startRadius * Math.cos(endAngleRad);
    const y4 = centerY + startRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = (endSegmentAngle - startSegmentAngle) > 180 ? 1 : 0;
    
    return `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${endRadius} ${endRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${startRadius} ${startRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
    `;
  };
  
  // Generate gradient colors
  const getColor = (index, isOuter, subSegment = null) => {
    if (isOuter) {
      const segmentId = `outer-${index}`;
      const isGrey = index === 4 || index === 5;
      const baseColor = isGrey ? 'hsl(0, 0%,' : 'hsl(0, 70%,';
      const lightness = hoveredSegment === segmentId ? 55 : 45;
      return `${baseColor} ${lightness}%)`;
    }
    
    // Special cases for specific segments
    if (index === 0 && subSegment === 0) {
      const segmentId = `inner-${index}-${subSegment}`;
      const lightness = hoveredSegment === segmentId ? 70 : 60;
      return `hsl(50, 85%, ${lightness}%)`;
    }
    
    if (index === 3) {
      const segmentId = `inner-${index}`;
      const lightness = hoveredSegment === segmentId ? 65 : 55;
      return `hsl(200, 70%, ${lightness}%)`;
    }
    
    if (index === 4) {
      const segmentId = `inner-${index}`;
      const lightness = hoveredSegment === segmentId ? 35 : 25;
      return `hsl(30, 50%, ${lightness}%)`;
    }
    
    if (index === 5) {
      const segmentId = `inner-${index}`;
      const lightness = hoveredSegment === segmentId ? 70 : 60;
      return `hsl(30, 45%, ${lightness}%)`;
    }
    
    if (index === 1) {
      const segmentId = subSegment !== null ? `inner-${index}-${subSegment}` : `inner-${index}`;
      const baseLightness = subSegment === 0 ? 40 : 50;
      const lightness = hoveredSegment === segmentId ? baseLightness + 10 : baseLightness;
      return `hsl(0, 0%, ${lightness}%)`;
    }
    
    const hue = (index * 360) / segments;
    const saturation = 60;
    let lightness = subSegment === 0 ? 50 : 60;
    const segmentId = subSegment !== null ? `inner-${index}-${subSegment}` : `inner-${index}`;
    
    if (hoveredSegment === segmentId) {
      lightness += 10;
    }
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  
  // Handle clicks
  const handleClick = (type, index, subSegment = null) => {
    if (type === 'inner') {
      const id = subSegment !== null ? `${index}-${subSegment}` : index;
      setSelectedInner(id);
      const plant = plantEmojis[id];
      const label = plant ? `${plant.name} ${plant.emoji}` :
                    id === '1-0' ? 'Rock 🪨' : 
                    id === '1-1' ? 'Package 📦💎' :
                    id === '2-0' ? 'Wrench 🔧' :
                    id === '2-1' ? 'Window/Brick 🪟🧱' :
                    id === 3 ? 'Resources' :
                    id === 4 ? 'DECAY' :
                    id === 5 ? 'Folder 📁' :
                    `${index + 1}A${subSegment ? subSegment + 1 : ''}`;
      console.log(`Inner segment ${label} selected`);
    } else {
      setSelectedOuter(index);
      console.log(`Outer segment ADVANCED (position ${index + 1}) selected`);
    }
  };
  
  // Generate label position
  const getLabelPosition = (radius, segmentIndex, subSegment = null) => {
    let midAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    
    if (subSegment !== null) {
      const quarterSegment = segmentAngle / 4;
      midAngle = startAngle + (segmentIndex * segmentAngle) + 
                 (subSegment === 0 ? quarterSegment : quarterSegment * 3);
    }
    
    const angleRad = (midAngle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    return { x, y };
  };
  
  // Generate arrow positions
  const getArrowData = (baseRadius, segmentIndex, subSegment = null, isCore = false) => {
    let midAngle;
    
    if (isCore) {
      midAngle = startAngle + (segmentAngle / 2);
    } else if (subSegment !== null) {
      const quarterSegment = segmentAngle / 4;
      midAngle = startAngle + (segmentIndex * segmentAngle) + 
                 (subSegment === 0 ? quarterSegment : quarterSegment * 3);
    } else {
      midAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    }
    
    const angleRad = (midAngle * Math.PI) / 180;
    const upRadius = baseRadius + 15;
    const downRadius = baseRadius - 5;
    
    const upX = centerX + upRadius * Math.cos(angleRad);
    const upY = centerY + upRadius * Math.sin(angleRad);
    const downX = centerX + downRadius * Math.cos(angleRad);
    const downY = centerY + downRadius * Math.sin(angleRad);
    const rotation = (midAngle + 90) % 360;
    
    return { upX, upY, downX, downY, rotation };
  };
  
  // Handle number increment/decrement
  const handleNumberChange = (field, increment) => {
    const updateValue = (currentValue) => {
      let num = parseInt(currentValue || '0');
      if (increment) {
        num = (num + 1) % 100;
      } else {
        num = num === 0 ? 99 : num - 1;
      }
      return num.toString().padStart(2, '0');
    };
    
    const updateCoreValue = (currentValue) => {
      let num = parseInt(currentValue || '0');
      if (increment) {
        num = num === 90 ? 0 : num + 10;
      } else {
        num = num === 0 ? 90 : num - 10;
      }
      return num.toString().padStart(2, '0');
    };
    
    if (field === 'core') {
      setSegmentCoreValue(updateCoreValue(segmentCoreValue));
    } else if (field === '1a1') {
      setSegment1A1Value(updateValue(segment1A1Value));
    } else if (field === '1a2') {
      setSegment1A2Value(updateValue(segment1A2Value));
    }
  };

  // Handle decay resource changes
  const handleDecayResourceChange = (resourceType, increment) => {
    setDecayResources(prev => {
      const current = prev[resourceType].current;
      const max = prev[resourceType].max;
      let newValue;
      
      if (increment) {
        newValue = Math.min(current + 50, max);
      } else {
        newValue = Math.max(current - 50, 0);
      }
      
      return {
        ...prev,
        [resourceType]: { ...prev[resourceType], current: newValue }
      };
    });
  };

  // Create text path helper
  const createTextPath = (radius, segmentIndex, startOffset = 3, endOffset = 3) => {
    const startSegmentAngle = startAngle + (segmentIndex * segmentAngle) + startOffset;
    const endSegmentAngle = startAngle + ((segmentIndex + 1) * segmentAngle) - endOffset;
    
    const startAngleRad = (startSegmentAngle * Math.PI) / 180;
    const endAngleRad = (endSegmentAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  // Render pulsating overlay helper
  const renderPulsatingOverlay = (index, leftText, rightText, onLeftClick, onRightClick, showTimers = false, isSplit = false) => {
    const segmentCenterAngle = startAngle + (index * segmentAngle) + (segmentAngle / 2);
    const segmentCenterRadius = (middleRadius + 20 + outerRadius) / 2;
    const angleRad = (segmentCenterAngle * Math.PI) / 180;
    const transformX = centerX + segmentCenterRadius * Math.cos(angleRad);
    const transformY = centerY + segmentCenterRadius * Math.sin(angleRad);
    
    if (isSplit) {
      const halfSegmentAngle = segmentAngle / 2;
      const startSegmentAngle = startAngle + (index * segmentAngle);
      
      const createHalfPath = (isLeftHalf) => {
        const startAngleOffset = isLeftHalf ? 0 : halfSegmentAngle;
        const endAngleOffset = isLeftHalf ? halfSegmentAngle : segmentAngle;
        
        const startSegAngle = startSegmentAngle + startAngleOffset;
        const endSegAngle = startSegmentAngle + endAngleOffset;
        
        const startAngleRad = (startSegAngle * Math.PI) / 180;
        const endAngleRad = (endSegAngle * Math.PI) / 180;
        
        const x1 = centerX + (middleRadius + 10) * Math.cos(startAngleRad);
        const y1 = centerY + (middleRadius + 10) * Math.sin(startAngleRad);
        const x2 = centerX + (outerRadius + 10) * Math.cos(startAngleRad);
        const y2 = centerY + (outerRadius + 10) * Math.sin(startAngleRad);
        const x3 = centerX + (outerRadius + 10) * Math.cos(endAngleRad);
        const y3 = centerY + (outerRadius + 10) * Math.sin(endAngleRad);
        const x4 = centerX + (middleRadius + 10) * Math.cos(endAngleRad);
        const y4 = centerY + (middleRadius + 10) * Math.sin(endAngleRad);
        
        return `
          M ${x1} ${y1}
          L ${x2} ${y2}
          A ${outerRadius + 10} ${outerRadius + 10} 0 0 1 ${x3} ${y3}
          L ${x4} ${y4}
          A ${middleRadius + 10} ${middleRadius + 10} 0 0 0 ${x1} ${y1}
        `;
      };
      
      const textRadius = (middleRadius + 20 + outerRadius) / 2;
      
      return (
        <g style={{
          transformOrigin: `${transformX}px ${transformY}px`,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {/* Left half */}
          <path
            d={createHalfPath(true)}
            fill="hsl(120, 70%, 45%)"
            fillOpacity="1"
            stroke="hsl(120, 80%, 35%)"
            strokeWidth="3"
            className="cursor-pointer hover:brightness-110"
            filter="url(#greenGlow)"
            onClick={(e) => {
              e.stopPropagation();
              onLeftClick?.();
            }}
          />
          <text
            x={centerX + textRadius * Math.cos((startSegmentAngle + halfSegmentAngle/2) * Math.PI / 180)}
            y={centerY + textRadius * Math.sin((startSegmentAngle + halfSegmentAngle/2) * Math.PI / 180)}
            fill="white"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
          >
            {leftText}
          </text>
          
          {/* Right half */}
          <path
            d={createHalfPath(false)}
            fill="hsl(0, 70%, 50%)"
            fillOpacity="1"
            stroke="hsl(0, 80%, 40%)"
            strokeWidth="3"
            className="cursor-pointer hover:brightness-110"
            filter="url(#redGlow)"
            onClick={(e) => {
              e.stopPropagation();
              onRightClick?.();
            }}
          />
          <text
            x={centerX + textRadius * Math.cos((startSegmentAngle + segmentAngle - halfSegmentAngle/2) * Math.PI / 180)}
            y={centerY + textRadius * Math.sin((startSegmentAngle + segmentAngle - halfSegmentAngle/2) * Math.PI / 180)}
            fill="white"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
          >
            {rightText}
          </text>
        </g>
      );
    }
    
    return (
      <g style={{
        transformOrigin: `${transformX}px ${transformY}px`,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <path
          d={createPath(middleRadius + 10, outerRadius + 10, index)}
          fill="hsl(0, 70%, 50%)"
          fillOpacity="1"
          stroke="hsl(0, 80%, 40%)"
          strokeWidth="3"
          className="cursor-pointer hover:brightness-110"
          filter="url(#redGlow)"
          onClick={(e) => {
            e.stopPropagation();
            onLeftClick?.();
          }}
        />
        <text 
          fill="white" 
          fontSize="15" 
          fontWeight="bold" 
          className="pointer-events-none select-none" 
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
        >
          <textPath href={`#outerTextPath-${index}`} startOffset="50%" textAnchor="middle">
            {leftText}
          </textPath>
        </text>
      </g>
    );
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes deployFromCenter {
          0% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }
        .deploy-animation {
          animation: deployFromCenter 0.3s ease-out;
          transform-origin: ${centerX}px ${centerY}px;
        }
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
          transform-origin: ${centerX}px ${centerY}px;
        }
        @keyframes actionPulse {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.03);
            filter: brightness(1.2);
          }
        }
        .action-pulse {
          animation: actionPulse 3s ease-in-out infinite;
          transform-origin: ${centerX}px ${centerY}px;
        }
      `}</style>
      
      <svg width="440" height="500" viewBox="0 0 440 500" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Filters */}
          <filter id="actionButtonShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
            <feOffset dx="0" dy="3" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.5"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="greenGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feFlood floodColor="#22c55e" floodOpacity="0.6"/>
            <feComposite in2="coloredBlur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="redGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feFlood floodColor="#dc2626" floodOpacity="0.6"/>
            <feComposite in2="coloredBlur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gap text paths */}
          {Array.from({ length: segments }).map((_, i) => (
            <path
              key={`gapPath-${i}`}
              id={`gapTextPath-${i}`}
              d={createTextPath(middleRadius + 8, i, 3, 3)}
            />
          ))}
          
          {/* Outer text paths */}
          {Array.from({ length: segments }).map((_, i) => (
            <path
              key={`outerPath-${i}`}
              id={`outerTextPath-${i}`}
              d={createTextPath((middleRadius + 20 + outerRadius) / 2 - 4, i)}
            />
          ))}
        </defs>
        
        {/* Resource circles background */}
        {resourceConfig.map((resource, index) => (
          <circle
            key={resource.key}
            cx={centerX}
            cy={centerY}
            r={resource.radius}
            fill="none"
            stroke={resource.color}
            strokeWidth="2"
            strokeOpacity="0.3"
            className="pointer-events-none"
          />
        ))}
        
        {/* Render segments when expanded */}
        {isExpanded && (
          <g className="deploy-animation">
            {/* Render all segments */}
            {Array.from({ length: segments }).map((_, index) => (
              <g key={index}>
                {/* Inner segment for index 0 (split) */}
                {index === 0 && (
                  <>
                    <path
                      d={createPath(innerRadius, middleRadius, index, 0)}
                      fill={getColor(index, false, 0)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-0`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 0)}
                      style={{
                        filter: selectedInner === `${index}-0` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    <path
                      d={createPath(innerRadius, middleRadius, index, 1)}
                      fill={getColor(index, false, 1)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-1`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 1)}
                      style={{
                        filter: selectedInner === `${index}-1` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    {/* Labels for segment 0 */}
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      🍋
                    </text>
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      🎃
                    </text>
                  </>
                )}
                
                {/* Inner segment for index 1 (split) */}
                {index === 1 && (
                  <>
                    <path
                      d={createPath(innerRadius, middleRadius, index, 0)}
                      fill={getColor(index, false, 0)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-0`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 0)}
                      style={{
                        filter: selectedInner === `${index}-0` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    <path
                      d={createPath(innerRadius, middleRadius, index, 1)}
                      fill={getColor(index, false, 1)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-1`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 1)}
                      style={{
                        filter: selectedInner === `${index}-1` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    {/* Labels for segment 1 */}
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      🪨
                    </text>
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      📦💎
                    </text>
                  </>
                )}
                
                {/* Inner segment for index 2 (split) */}
                {index === 2 && (
                  <>
                    <path
                      d={createPath(innerRadius, middleRadius, index, 0)}
                      fill={getColor(index, false, 0)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-0`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 0)}
                      style={{
                        filter: selectedInner === `${index}-0` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    <path
                      d={createPath(innerRadius, middleRadius, index, 1)}
                      fill={getColor(index, false, 1)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}-1`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index, 1)}
                      style={{
                        filter: selectedInner === `${index}-1` ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    {/* Labels for segment 2 */}
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      🔧
                    </text>
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index, 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      🪟🧱
                    </text>
                  </>
                )}
                
                {/* Regular inner segment for indices 3, 4, 5 */}
                {index >= 3 && (
                  <>
                    <path
                      d={createPath(innerRadius, middleRadius, index)}
                      fill={getColor(index, false)}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-300 hover:brightness-110"
                      onMouseEnter={() => setHoveredSegment(`inner-${index}`)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleClick('inner', index)}
                      style={{
                        filter: selectedInner === index ? 'brightness(1.3)' : 'none'
                      }}
                    />
                    {/* Labels for segments 3, 4, 5 */}
                    <text
                      {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={index === 5 ? "16" : "20"}
                      className="pointer-events-none select-none"
                      fill="white"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      {index === 3 ? '💰' : index === 4 ? '☠️' : '📁'}
                    </text>
                  </>
                )}
                
                {/* Outer segment */}
                <path
                  d={createPath(middleRadius + 20, outerRadius, index)}
                  fill={getColor(index, true)}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                  onMouseEnter={() => setHoveredSegment(`outer-${index}`)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => handleClick('outer', index)}
                  style={{
                    filter: selectedOuter === index ? 'brightness(1.3)' : 'none'
                  }}
                />
                
                {/* Gap text between inner and outer segments */}
                <text fill="white" fontSize="12" fontWeight="bold" className="pointer-events-none select-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                  <textPath href={`#gapTextPath-${index}`} startOffset="50%" textAnchor="middle">
                    {gapTexts[index]}
                  </textPath>
                </text>
                
                {/* Outer segment text */}
                <text fill="white" fontSize="11" fontWeight="bold" className="pointer-events-none select-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                  <textPath href={`#outerTextPath-${index}`} startOffset="50%" textAnchor="middle">
                    ADVANCED
                  </textPath>
                </text>
              </g>
            ))}
            
            {/* Render conditional overlays based on selected inner segments */}
            {selectedInner === '0-0' && renderPulsatingOverlay(0, '🍓', '🫐', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              false, true)}
            
            {selectedInner === '0-1' && renderPulsatingOverlay(0, 'HARVEST', 'TIMER', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              true, true)}
            
            {selectedInner === '1-0' && renderPulsatingOverlay(1, 'GET', 'ROCK', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              false, true)}
            
            {selectedInner === '1-1' && renderPulsatingOverlay(1, 'GET', 'BOX', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              false, true)}
            
            {selectedInner === '2-0' && renderPulsatingOverlay(2, 'REPAIR', 'TOOL', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              false, true)}
            
            {selectedInner === '2-1' && renderPulsatingOverlay(2, 'UPGRADE', 'WALL', 
              () => setSelectedInner(null), 
              () => setSelectedInner(null), 
              false, true)}
            
            {selectedInner === 3 && renderPulsatingOverlay(3, 'RESOURCES', '', 
              () => setSelectedInner(null))}
            
            {selectedInner === 4 && renderPulsatingOverlay(4, 'DECAY', '', 
              () => setSelectedInner(null))}
            
            {selectedInner === 5 && renderPulsatingOverlay(5, 'REPORT', '', 
              () => setSelectedInner(null))}
          </g>
        )}
        
        {/* Resource values display on circles */}
        {resourceConfig.map((resource, index) => (
          <text
            key={`${resource.key}-text`}
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="bold"
            fill={resource.color}
            className="pointer-events-none select-none"
            style={resource.style || { textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
            transform={`translate(0, ${(index - 1.5) * 16})`}
          >
            {formatResourceValue(resources[resource.key])}
          </text>
        ))}
        
        {/* Core timer display */}
        {(selectedInner === '1-0' || selectedInner === '1-1') && (
          <g>
            {(() => {
              const { upX, upY, downX, downY, rotation } = getArrowData(67, 0, null, true);
              return (
                <>
                  {/* Up arrow */}
                  <g 
                    transform={`translate(${upX}, ${upY}) rotate(${rotation})`}
                    className="cursor-pointer hover:brightness-125"
                    onClick={() => handleNumberChange('core', true)}
                  >
                    <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                  </g>
                  
                  {/* Core value */}
                  <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill="yellow"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    transform="translate(0, 78)"
                  >
                    {segmentCoreValue}
                  </text>
                  
                  {/* Down arrow */}
                  <g 
                    transform={`translate(${downX}, ${downY}) rotate(${rotation + 180})`}
                    className="cursor-pointer hover:brightness-125"
                    onClick={() => handleNumberChange('core', false)}
                  >
                    <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                  </g>
                </>
              );
            })()}
          </g>
        )}
        
        {/* Number displays for segments 1 */}
        {(selectedInner === '1-0' || selectedInner === '1-1') && (
          <>
            {/* Segment 1A1 */}
            <g>
              {(() => {
                const { upX, upY, downX, downY, rotation } = getArrowData(95, 1, 0);
                return (
                  <>
                    <g 
                      transform={`translate(${upX}, ${upY}) rotate(${rotation})`}
                      className="cursor-pointer hover:brightness-125"
                      onClick={() => handleNumberChange('1a1', true)}
                    >
                      <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                    </g>
                    
                    <text
                      {...getLabelPosition(95, 1, 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill="yellow"
                      className="pointer-events-none select-none"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      {segment1A1Value}
                    </text>
                    
                    <g 
                      transform={`translate(${downX}, ${downY}) rotate(${rotation + 180})`}
                      className="cursor-pointer hover:brightness-125"
                      onClick={() => handleNumberChange('1a1', false)}
                    >
                      <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                    </g>
                  </>
                );
              })()}
            </g>
            
            {/* Segment 1A2 */}
            <g>
              {(() => {
                const { upX, upY, downX, downY, rotation } = getArrowData(95, 1, 1);
                return (
                  <>
                    <g 
                      transform={`translate(${upX}, ${upY}) rotate(${rotation})`}
                      className="cursor-pointer hover:brightness-125"
                      onClick={() => handleNumberChange('1a2', true)}
                    >
                      <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                    </g>
                    
                    <text
                      {...getLabelPosition(95, 1, 1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill="yellow"
                      className="pointer-events-none select-none"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                    >
                      {segment1A2Value}
                    </text>
                    
                    <g 
                      transform={`translate(${downX}, ${downY}) rotate(${rotation + 180})`}
                      className="cursor-pointer hover:brightness-125"
                      onClick={() => handleNumberChange('1a2', false)}
                    >
                      <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                    </g>
                  </>
                );
              })()}
            </g>
          </>
        )}
        
        {/* Decay display overlay */}
        {selectedInner === 4 && (
          <g className="pulse-animation">
            {['stone', 'metal', 'hqm'].map((resourceType, index) => (
              <g key={resourceType}>
                {(() => {
                  const baseAngle = startAngle + (4 * segmentAngle) + (segmentAngle / 2);
                  const offsetAngle = (index - 1) * 15; // Spread resources around the segment
                  const angle = baseAngle + offsetAngle;
                  const angleRad = (angle * Math.PI) / 180;
                  const radius = 220;
                  const x = centerX + radius * Math.cos(angleRad);
                  const y = centerY + radius * Math.sin(angleRad);
                  
                  return (
                    <>
                      {/* Up arrow */}
                      <g 
                        transform={`translate(${x}, ${y - 20}) rotate(${angle + 90})`}
                        className="cursor-pointer hover:brightness-125"
                        onClick={() => handleDecayResourceChange(resourceType, true)}
                      >
                        <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                      </g>
                      
                      {/* Resource display */}
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="white"
                        className="pointer-events-none select-none"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                      >
                        {decayResources[resourceType].current}/{decayResources[resourceType].max}
                      </text>
                      
                      {/* Down arrow */}
                      <g 
                        transform={`translate(${x}, ${y + 20}) rotate(${angle + 270})`}
                        className="cursor-pointer hover:brightness-125"
                        onClick={() => handleDecayResourceChange(resourceType, false)}
                      >
                        <polygon points="0,-6 8,6 -8,6" fill="white" stroke="black" strokeWidth="1"/>
                      </g>
                    </>
                  );
                })()}
              </g>
            ))}
          </g>
        )}
        
        {/* Center action button */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill={isExpanded ? "hsl(120, 70%, 40%)" : "hsl(120, 70%, 50%)"}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="3"
          className={`cursor-pointer transition-all duration-300 hover:brightness-110 ${isExpanded ? '' : 'action-pulse'}`}
          filter="url(#actionButtonShadow)"
          onClick={handleActionClick}
        />
        
        {/* Center button icon/text */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fontWeight="bold"
          fill="white"
          className="pointer-events-none select-none"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
        >
          {isExpanded ? '✕' : '🚜'}
        </text>
      </svg>
    </>
  );
};

export default RadialMenu;