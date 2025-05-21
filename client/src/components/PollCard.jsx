import { Link } from 'react-router-dom';

const PollCard = ({ poll }) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="card">
      <h3>{poll.title}</h3>
      {poll.description && <p>{poll.description}</p>}
      <div className="poll-meta">
        <span>Created: {formatDate(poll.created_at)}</span>
        {poll.expires_at && (
          <span> • Expires: {formatDate(poll.expires_at)}</span>
        )}
        <span> • {poll.total_votes || 0} votes</span>
      </div>
      <div className="poll-actions">
        <Link to={`/polls/${poll.id}`} className="btn btn-primary">
          View Poll
        </Link>
      </div>
    </div>
  );
};

export default PollCard;
