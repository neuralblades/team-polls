import { useState } from 'react';

const PollOption = ({ option, totalVotes, onVote, selected, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate percentage
  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  
  return (
    <div 
      className={`poll-option ${selected ? 'selected' : ''}`}
      onClick={() => !disabled && onVote(option.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: disabled ? 'default' : 'pointer',
        padding: '12px',
        marginBottom: '10px',
        borderRadius: '6px',
        border: `1px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
        backgroundColor: selected ? 'rgba(74, 107, 255, 0.1)' : isHovered && !disabled ? 'rgba(74, 107, 255, 0.05)' : 'white',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Progress bar */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percentage}%`,
          backgroundColor: 'rgba(74, 107, 255, 0.1)',
          zIndex: 0,
          transition: 'width 0.5s ease-out'
        }}
      />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span>{option.text}</span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>{option.votes} votes</span>
          <span style={{ marginLeft: '8px' }}>({percentage}%)</span>
        </div>
      </div>
    </div>
  );
};

export default PollOption;
