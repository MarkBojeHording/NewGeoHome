import React, { useState, useEffect } from 'react';

interface RadialMenuProps {
  location: any;
  onAction: (action: string) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ location, onAction, onClose, style }) => {
  const [selectedInner, setSelectedInner] = useState<number | null>(null);
  const [selectedOuter, setSelectedOuter] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resources, setResources] = useState({
    stone: 0,
    metal: 0,
    hqm: 0
  });
  
  // Configuration - much larger size for better visibility (160px x 160px)
  const centerX = 80;
  const centerY = 80;
  const innerRadius = 25;
  const middleRadius = 60;
  const outerRadius = 80;
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
  const getLabelPosition = (radius: number, segmentIndex: number) => {
    const midAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    const angleRad = (midAngle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    return { x, y };
  };
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
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
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded, onClose]);
  
  // Create SVG path
  const createPath = (startRadius: number, endRadius: number, segmentIndex: number) => {
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
  const createTextPath = (radius: number, segmentIndex: number, startOffset = 3, endOffset = 3) => {
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
  const getColor = (index: number, isOuter: boolean) => {
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
  const handleClick = (type: 'inner' | 'outer', index: number) => {
    if (type === 'inner') {
      setSelectedInner(index);
      // Handle actions based on inner segment
      const actions = ['Schedule Raid', 'Need Names', 'They Moved Loot', 'Decaying', 'Write report'];
      if (index !== 3) { // Not decaying
        onAction(actions[index]);
        setIsExpanded(false);
        onClose();
      }
    } else {
      setSelectedOuter(index);
    }
  };
  
  // Render pulsating overlay
  const renderPulsatingOverlay = (segmentIndex: number, condition: boolean, overlayText: string) => {
    if (!condition) return null;
    
    const segmentCenterAngle = startAngle + (segmentIndex * segmentAngle) + (segmentAngle / 2);
    const segmentCenterRadius = (middleRadius + 5 + outerRadius) / 2;
    const angleRad = (segmentCenterAngle * Math.PI) / 180;
    const transformX = centerX + segmentCenterRadius * Math.cos(angleRad);
    const transformY = centerY + segmentCenterRadius * Math.sin(angleRad);
    
    // Special case for "They Moved Loot" - split container
    if (segmentIndex === 2) {
      const halfSegmentAngle = segmentAngle / 2;
      const startSegmentAngle = startAngle + (segmentIndex * segmentAngle);
      
      // Create path for left half (IN - green)
      const createHalfPath = (isLeftHalf: boolean) => {
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
      const textRadius = (middleRadius + 5 + outerRadius) / 2;
      
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
            strokeWidth="1"
            className="cursor-pointer hover:brightness-110"
            filter="url(#greenGlow)"
            onClick={(e) => {
              e.stopPropagation();
              onAction('Loot moved in');
              setIsExpanded(false);
              onClose();
            }}
          />
          <text
            x={centerX + textRadius * Math.cos((startSegmentAngle + halfSegmentAngle/2) * Math.PI / 180)}
            y={centerY + textRadius * Math.sin((startSegmentAngle + halfSegmentAngle/2) * Math.PI / 180)}
            fill="white"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
          >
            IN
          </text>
          
          {/* Right half - OUT (red) */}
          <path
            d={createHalfPath(false)}
            fill="hsl(0, 70%, 50%)"
            fillOpacity="1"
            stroke="hsl(0, 80%, 40%)"
            strokeWidth="1"
            className="cursor-pointer hover:brightness-110"
            filter="url(#redGlow)"
            onClick={(e) => {
              e.stopPropagation();
              onAction('Loot moved out');
              setIsExpanded(false);
              onClose();
            }}
          />
          <text
            x={centerX + textRadius * Math.cos((startSegmentAngle + segmentAngle - halfSegmentAngle/2) * Math.PI / 180)}
            y={centerY + textRadius * Math.sin((startSegmentAngle + segmentAngle - halfSegmentAngle/2) * Math.PI / 180)}
            fill="white"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
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
            if (segmentIndex === 0) onAction('Schedule Raid');
            else if (segmentIndex === 1) onAction('Need Names');
            else if (segmentIndex === 3) onAction('Start Decay Timer');
            else if (segmentIndex === 4) onAction('Write report');
            setIsExpanded(false);
            onClose();
          }}
        />
        <text 
          fill="white" 
          fontSize="8" 
          fontWeight="bold" 
          className="pointer-events-none select-none" 
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
        >
          <textPath href={`#outerTextPath-${segmentIndex}`} startOffset="50%" textAnchor="middle">
            {overlayText}
          </textPath>
        </text>
      </g>
    );
  };

  return (
    <div 
      className="absolute"
      style={{
        ...style,
        zIndex: 50
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
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
          @keyframes deployFromCenter {
            0% { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
        
        <svg width="160" height="160" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Filters */}
            <filter id="actionButtonShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="1" result="offsetblur"/>
              <feFlood floodColor="#000000" floodOpacity="0.5"/>
              <feComposite in2="offsetblur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="actionButtonGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feFlood floodColor="#dc2626" floodOpacity="0.4"/>
              <feComposite in2="coloredBlur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="greenGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feFlood floodColor="#22c55e" floodOpacity="0.6"/>
              <feComposite in2="coloredBlur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="redGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
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
                    strokeWidth="1"
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
                    fill="white"
                    fontSize={index === 2 ? "12" : "10"}
                    opacity="0.9"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {INNER_LABELS[index]}
                  </text>
                  
                  {/* Outer segment */}
                  <path
                    d={createPath(middleRadius + 5, outerRadius, index)}
                    fill={getColor(index, true)}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                    className="cursor-pointer transition-all duration-300 hover:brightness-110"
                    onMouseEnter={() => setHoveredSegment(`outer-${index}`)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => handleClick('outer', index)}
                    style={{
                      filter: selectedOuter === index ? 'brightness(1.3)' : 'none'
                    }}
                  />
                </g>
              ))}
              
              {/* Gap text */}
              {GAP_TEXTS.map((text, index) => (
                <text key={`gap-text-${index}`} fill="rgba(255,255,255,0.9)" fontSize={index === 2 ? "6" : "7"} fontWeight="bold" className="pointer-events-none select-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  <textPath href={`#gapTextPath-${index}`} startOffset="50%" textAnchor="middle">{text}</textPath>
                </text>
              ))}
              
              {/* Outer segment text */}
              {Array.from({ length: segments }).map((_, index) => (
                <text key={`outer-text-${index}`} fill="white" fontSize="8" fontWeight="bold" className="pointer-events-none select-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  <textPath href={`#outerTextPath-${index}`} startOffset="50%" textAnchor="middle">{OUTER_TEXT}</textPath>
                </text>
              ))}
              
              {/* Pulsating overlays */}
              {renderPulsatingOverlay(0, selectedInner === 0, 'SCHEDULE')}
              {renderPulsatingOverlay(1, selectedInner === 1, 'MAKE ICON')}
              {renderPulsatingOverlay(2, selectedInner === 2, 'LOOT FLOW')}
              {renderPulsatingOverlay(3, selectedInner === 3, 'START TIMER')}
              {renderPulsatingOverlay(4, selectedInner === 4, 'REPORT')}
              
              {/* Static resource containers for decaying - shown outside the circle */}
              {selectedInner === 3 && (
                <foreignObject x="60" y="10" width="120" height="80">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {[
                      { name: 'Stone', key: 'stone', current: resources.stone, max: 500, color: 'hsl(0, 0%, 60%)', borderColor: 'hsl(0, 0%, 75%)' },
                      { name: 'Metal', key: 'metal', current: resources.metal, max: 1000, color: 'hsl(0, 0%, 35%)', borderColor: 'hsl(0, 0%, 50%)' },
                      { name: 'HQM', key: 'hqm', current: resources.hqm, max: 2000, color: 'hsl(200, 50%, 35%)', borderColor: 'hsl(200, 60%, 50%)' }
                    ].map((resource, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '2px 4px',
                          backgroundColor: resource.color,
                          border: `1px solid ${resource.borderColor}`,
                          borderRadius: '2px',
                          color: 'white',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 1px rgba(0,0,0,0.9)',
                          height: '18px'
                        }}
                      >
                        <span>{resource.name}</span>
                        <input
                          type="text"
                          value={resource.current}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value === '' || !isNaN(parseInt(value))) {
                              setResources(prev => ({
                                ...prev,
                                [resource.key]: Math.min(parseInt(value) || 0, resource.max)
                              }));
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '40px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '2px',
                            color: 'white',
                            padding: '1px 2px',
                            fontSize: '7px',
                            textAlign: 'center'
                          }}
                        />
                        <span>/{resource.max}</span>
                      </div>
                    ))}
                  </div>
                </foreignObject>
              )}
            </g>
          )}
          
          {/* Center Action button */}
          <g 
            className={`transition-transform duration-200 cursor-pointer ${!isExpanded ? 'hover:scale-110 action-pulse' : ''}`}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            onClick={() => {
              if (isExpanded) {
                setSelectedInner(null);
                setSelectedOuter(null);
                setHoveredSegment(null);
                setResources({
                  stone: 0,
                  metal: 0,
                  hqm: 0
                });
              }
              setIsExpanded(!isExpanded);
            }}
          >
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius - 1}
              fill={isExpanded ? "hsl(0, 75%, 50%)" : "hsl(0, 60%, 30%)"}
              stroke={isExpanded ? "hsl(0, 80%, 35%)" : "hsl(0, 60%, 20%)"}
              strokeWidth="1.5"
              className="transition-all duration-300"
              filter={isExpanded ? "url(#actionButtonGlow)" : "url(#actionButtonShadow)"}
            />
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="bold"
              fill="white"
              className="select-none"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
            >
              ACTION
            </text>
          </g>
        </svg>
    </div>
  );
};

export default RadialMenu;