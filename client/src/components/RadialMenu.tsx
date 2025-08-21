import React, { useState, useEffect } from 'react';

const RadialMenu = () => {
  const [selectedInner, setSelectedInner] = useState(null);
  const [selectedOuter, setSelectedOuter] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resources, setResources] = useState({
    stone: 0,
    metal: 0,
    hqm: 0
  });
  
  // Configuration
  const centerX = 300;
  const centerY = 300;
  const innerRadius = 40;
  const middleRadius = 150;
  const outerRadius = 190;
  const startAngle = 180;
  const segments = 5;
  const totalAngle = 180;
  const segmentAngle = totalAngle / segments;
  
  // Gap text configuration for action items
  const GAP_TEXTS = [
    'SCHEDULE RAID',     // Section 0
    'NEED NAMES',        // Section 1
    'THEY MOVED LOOT',   // Section 2
    'DECAYING',          // Section 3
    'WRITE REPORT'       // Section 4
  ];
  
  // Outer segment text
  const OUTER_TEXT = 'ADVANCED';
  
  // Inner segment labels for action items
  const INNER_LABELS = ['⚔️', '❓', '💰', '💀', '📋'];
  
  // Get label position
  const getLabelPosition = (radius, segmentIndex) => {
    const midAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    const angleRad = (midAngle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    return { x, y };
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
          setSelectedInner(null);
          setSelectedOuter(null);
          setHoveredSegment(null);
          setResources({
            stone: 0,
            metal: 0,
            hqm: 0
          });
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);
  
  // Create SVG path
  const createPath = (startRadius, endRadius, segmentIndex) => {
    const startSegmentAngle = startAngle + (segmentIndex * segmentAngle);
    const endSegmentAngle = startSegmentAngle + segmentAngle;
    
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
  
  // Create curved path for text
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
  
  // Get color for segments
  const getColor = (index, isOuter) => {
    const segmentId = isOuter ? `outer-${index}` : `inner-${index}`;
    const isHovered = hoveredSegment === segmentId;
    
    if (isOuter) {
      // Darker, more aggressive colors for outer segments
      if (index === 0) return `hsl(0, 70%, ${isHovered ? 40 : 30}%)`;
      if (index === 1) return `hsl(280, 50%, ${isHovered ? 35 : 25}%)`;
      if (index === 2) return `hsl(15, 65%, ${isHovered ? 35 : 25}%)`;
      if (index === 3) return `hsl(0, 0%, ${isHovered ? 30 : 20}%)`;
      if (index === 4) return `hsl(20, 50%, ${isHovered ? 35 : 25}%)`;
    }
    
    // Advanced action colors for inner segments
    if (index === 0) return `hsl(0, 80%, ${isHovered ? 55 : 45}%)`;
    if (index === 1) return `hsl(280, 50%, ${isHovered ? 55 : 45}%)`;
    if (index === 2) return `hsl(15, 70%, ${isHovered ? 55 : 45}%)`;
    if (index === 3) return `hsl(0, 0%, ${isHovered ? 45 : 35}%)`;
    if (index === 4) return `hsl(20, 65%, ${isHovered ? 50 : 40}%)`;
    
    return `hsl(0, 60%, ${isHovered ? 55 : 45}%)`;
  };
  
  // Handle clicks
  const handleClick = (type, index) => {
    if (type === 'inner') {
      setSelectedInner(index);
    } else {
      setSelectedOuter(index);
    }
  };
  
  // Render pulsating overlay
  const renderPulsatingOverlay = (segmentIndex, condition, overlayText) => {
    if (!condition) return null;
    
    const segmentCenterAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    const segmentCenterRadius = (middleRadius + 20 + outerRadius) / 2;
    const angleRad = (segmentCenterAngle * Math.PI) / 180;
    const transformX = centerX + segmentCenterRadius * Math.cos(angleRad);
    const transformY = centerY + segmentCenterRadius * Math.sin(angleRad);
    
    // Special case for "They Moved Loot" - split container
    if (segmentIndex === 2) {
      const halfSegmentAngle = segmentAngle / 2;
      const startSegmentAngle = startAngle + (segmentIndex * segmentAngle);
      
      // Create path for left half (IN - green)
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
      
      // Calculate text position for each half
      const textRadius = (middleRadius + 20 + outerRadius) / 2;
      
      return (
        <g style={{
          transformOrigin: `${transformX}px ${transformY}px`,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {/* Left half - IN (green) */}
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
              setSelectedInner(null);
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
            IN
          </text>
          
          {/* Right half - OUT (red) */}
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
              setSelectedInner(null);
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
            OUT
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
          d={createPath(middleRadius + 10, outerRadius + 10, segmentIndex)}
          fill="hsl(0, 70%, 50%)"
          fillOpacity="1"
          stroke="hsl(0, 80%, 40%)"
          strokeWidth="3"
          className="cursor-pointer hover:brightness-110"
          filter="url(#redGlow)"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInner(null);
          }}
        />
        <text 
          fill="white" 
          fontSize="15" 
          fontWeight="bold" 
          className="pointer-events-none select-none" 
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
        >
          <textPath href={`#outerTextPath-${segmentIndex}`} startOffset="50%" textAnchor="middle">
            {overlayText}
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
          @keyframes subtlePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }
          @keyframes deployFromCenter {
            0% { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
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
          .deploy-animation {
            animation: deployFromCenter 0.3s ease-out;
            transform-origin: ${centerX}px ${centerY}px;
          }
        `}</style>
        
        <svg width="600" height="600" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
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
            <filter id="actionButtonGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feFlood floodColor="#dc2626" floodOpacity="0.4"/>
              <feComposite in2="coloredBlur" operator="in"/>
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
                d={createTextPath(middleRadius + 8, i, i === 2 ? 1 : 3, i === 2 ? 1 : 3)}
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
          
          {/* Render segments */}
          {isExpanded && (
            <g className="deploy-animation">
              {/* Render all segments */}
              {Array.from({ length: segments }).map((_, index) => (
                <g key={index}>
                  {/* Inner segment */}
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
                  
                  {/* Inner segment icon */}
                  <text
                    {...getLabelPosition(innerRadius + (middleRadius - innerRadius) * 0.5, index)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="32"
                    className="pointer-events-none select-none"
                    fill="white"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                  >
                    {INNER_LABELS[index]}
                  </text>
                  
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
                      {GAP_TEXTS[index]}
                    </textPath>
                  </text>
                  
                  {/* Outer segment text */}
                  <text fill="white" fontSize="11" fontWeight="bold" className="pointer-events-none select-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                    <textPath href={`#outerTextPath-${index}`} startOffset="50%" textAnchor="middle">
                      {OUTER_TEXT}
                    </textPath>
                  </text>
                </g>
              ))}
              
              {/* Render conditional overlays */}
              {renderPulsatingOverlay(0, selectedInner === 0, 'SCHEDULE')}
              {renderPulsatingOverlay(1, selectedInner === 1, 'NAMES')}
              {renderPulsatingOverlay(2, selectedInner === 2, '')}
              {renderPulsatingOverlay(3, selectedInner === 3, 'DECAYING')}
              {renderPulsatingOverlay(4, selectedInner === 4, 'REPORT')}
              
              {/* Calculate button for when appropriate inner segment is selected */}
              {(selectedInner === 0 || selectedInner === 1 || selectedInner === 3 || selectedInner === 4) && (
                <g className="pulse-animation">
                  <circle
                    cx={centerX}
                    cy={centerY - 2}
                    r={innerRadius - 5}
                    fill="hsl(120, 70%, 45%)"
                    stroke="hsl(120, 80%, 35%)"
                    strokeWidth="3"
                    className="cursor-pointer hover:brightness-110"
                    filter="url(#greenGlow)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInner(null);
                    }}
                  />
                  <text
                    x={centerX}
                    y={centerY - 2}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                  >
                    CALCULATE
                  </text>
                </g>
              )}
            </g>
          )}
          
          {/* Center action button */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill={isExpanded ? "hsl(0, 70%, 40%)" : "hsl(0, 70%, 50%)"}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="3"
            className={`cursor-pointer transition-all duration-300 hover:brightness-110 ${isExpanded ? '' : 'action-pulse'}`}
            filter="url(#actionButtonShadow)"
            onClick={() => setIsExpanded(!isExpanded)}
          />
          
          {/* Center button icon/text */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fontWeight="bold"
            fill="white"
            className="pointer-events-none select-none"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
          >
            {isExpanded ? '✕' : '🎯'}
          </text>
        </svg>
    </>
  );
};

export default RadialMenu;