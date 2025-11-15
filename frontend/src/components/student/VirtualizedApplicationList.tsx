import React from 'react';
import { FixedSizeList as List } from 'react-window';
import ApplicationStatusCard from '../ApplicationStatusCard';
import { StudentApplication } from '../../hooks/student/useApplications';
import { Job } from '../../hooks/student/useJobs';

interface VirtualizedApplicationListProps {
  applications: StudentApplication[];
  jobsMap: Map<string, Job>;
  height?: number;
  itemHeight?: number;
  tableView?: boolean;
}

const VirtualizedApplicationList: React.FC<VirtualizedApplicationListProps> = ({
  applications,
  jobsMap,
  height = 600,
  itemHeight = 120,
  tableView = false
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const application = applications[index];
    const job = jobsMap.get(application.job_id);
    
    return (
      <div style={style}>
        <div className="px-2 py-2">
          <ApplicationStatusCard
            application={application}
            job={job}
            tableView={tableView}
          />
        </div>
      </div>
    );
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No applications found</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={applications.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </List>
  );
};

export default VirtualizedApplicationList;

