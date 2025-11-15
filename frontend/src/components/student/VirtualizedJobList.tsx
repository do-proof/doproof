import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { JobWithRecommendation } from '../../hooks/student/useJobs';
import TaskCard from '../TaskCard';

interface VirtualizedJobListProps {
  jobs: JobWithRecommendation[];
  height?: number;
  itemHeight?: number;
  onJobClick?: (job: JobWithRecommendation) => void;
}

const VirtualizedJobList: React.FC<VirtualizedJobListProps> = ({
  jobs,
  height = 600,
  itemHeight = 200,
  onJobClick
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const job = jobs[index];
    
    return (
      <div style={style}>
        <div className="px-2 py-2">
          <TaskCard
            job={job}
            onClick={() => onJobClick?.(job)}
          />
        </div>
      </div>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No jobs found</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={jobs.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </List>
  );
};

export default VirtualizedJobList;

