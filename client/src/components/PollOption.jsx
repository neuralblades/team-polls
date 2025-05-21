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
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '10px',
        border: `2px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
        backgroundColor: selected ? 'var(--primary-light)' : isHovered && !disabled ? 'rgba(67, 97, 238, 0.05)' : 'white',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all var(--transition-speed)',
        boxShadow: selected ? '0 4px 12px rgba(67, 97, 238, 0.15)' : isHovered && !disabled ? '0 4px 8px rgba(0, 0, 0, 0.05)' : 'none'
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
          backgroundColor: 'var(--primary-light)',
          zIndex: 0,
          transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{
            fontWeight: selected ? '600' : '500',
            fontSize: '1.1rem'
          }}>
            {option.text}
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
          <span style={{
            fontWeight: 'bold',
            color: selected ? 'var(--primary-color)' : 'inherit'
          }}>
            {option.votes} votes
          </span>
          <span style={{
            marginTop: '4px',
            fontSize: '0.9rem',
            color: 'var(--secondary-color)',
            fontWeight: percentage > 50 ? '600' : 'normal'
          }}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PollOption;
