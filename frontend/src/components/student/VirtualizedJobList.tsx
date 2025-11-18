import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { JobWithRecommendation } from '../../hooks/student/useJobs';
import TaskCard from '../TaskCard';

interface VirtualizedJobListProps {
  jobs: JobWithRecommendation[];
  height?: number;
  itemHeight?: number;
  onJobClick?: (job: JobWithRecommendation) => void;
}

// Memoized row component for better performance
const JobRow = memo(({ index, style, data }: any) => {
  const { jobs, onJobClick } = data;
  const job = jobs[index];

  return (
    <div style={style} className="px-2 py-2">
      <TaskCard
        job={job}
        onViewDetails={() => onJobClick?.(job)}
      />
    </div>
  );
});

JobRow.displayName = 'JobRow';

const VirtualizedJobList: React.FC<VirtualizedJobListProps> = ({
  jobs,
  height = 600,
  itemHeight = 220,
  onJobClick
}) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No jobs found</p>
      </div>
    );
  }

  // Use virtualization only for large lists (> 20 items)
  if (jobs.length <= 20) {
    return (
      <div style={{ maxHeight: height, overflowY: 'auto' }}>
        {jobs.map((job) => (
          <div key={job._id} className="px-2 py-2">
            <TaskCard
              job={job}
              onViewDetails={() => onJobClick?.(job)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={jobs.length}
      itemSize={itemHeight}
      width="100%"
      itemData={{ jobs, onJobClick }}
      overscanCount={3} // Render 3 extra items above and below viewport
    >
      {JobRow}
    </List>
  );
};

export default memo(VirtualizedJobList);

