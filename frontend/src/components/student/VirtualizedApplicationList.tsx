import React, { memo } from 'react';
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

// Memoized row component for better performance
const ApplicationRow = memo(({ index, style, data }: any) => {
  const { applications, jobsMap, tableView } = data;
  const application = applications[index];
  const job = jobsMap.get(application.job_id);

  return (
    <div style={style} className="px-2 py-2">
      <ApplicationStatusCard
        application={application}
        job={job}
        tableView={tableView}
      />
    </div>
  );
});

ApplicationRow.displayName = 'ApplicationRow';

const VirtualizedApplicationList: React.FC<VirtualizedApplicationListProps> = ({
  applications,
  jobsMap,
  height = 600,
  itemHeight = 140,
  tableView = false
}) => {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No applications found</p>
      </div>
    );
  }

  // Use virtualization only for large lists (> 15 items)
  if (applications.length <= 15) {
    return (
      <div style={{ maxHeight: height, overflowY: 'auto' }}>
        {applications.map((application) => {
          const job = jobsMap.get(application.job_id);
          return (
            <div key={application._id} className="px-2 py-2">
              <ApplicationStatusCard
                application={application}
                job={job}
                tableView={tableView}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={applications.length}
      itemSize={itemHeight}
      width="100%"
      itemData={{ applications, jobsMap, tableView }}
      overscanCount={2} // Render 2 extra items above and below viewport
    >
      {ApplicationRow}
    </List>
  );
};

export default memo(VirtualizedApplicationList);

