import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TimeSeriesData, SkillProgressData, CategoryPerformance } from '../../hooks/student/useAnalytics';

interface PerformanceChartProps {
  type: 'line' | 'area' | 'bar' | 'radar' | 'scatter' | 'pie';
  data: any[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  type,
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  className = ''
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        );

      case 'radar':
        return (
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Current Level"
              dataKey="current_level"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
            <Radar
              name="Previous Level"
              dataKey="previous_level"
              stroke={colors[1]}
              fill={colors[1]}
              fillOpacity={0.1}
            />
            <Tooltip />
            {showLegend && <Legend />}
          </RadarChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="time_spent" name="Time Spent" unit="h" />
            <YAxis dataKey="score" name="Score" unit="%" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Tasks" fill={colors[0]} />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() || <div>No chart available</div>}
      </ResponsiveContainer>
    </div>
  );
};

// Specialized chart components for common use cases

export const ScoreTrendChart: React.FC<{
  data: TimeSeriesData[];
  title?: string;
  height?: number;
}> = ({ data, title = "Score Trend", height = 300 }) => {
  return (
    <PerformanceChart
      type="area"
      data={data}
      title={title}
      height={height}
      colors={['#10B981']}
    />
  );
};

export const SkillRadarChart: React.FC<{
  data: SkillProgressData[];
  title?: string;
  height?: number;
}> = ({ data, title = "Skill Assessment", height = 400 }) => {
  return (
    <PerformanceChart
      type="radar"
      data={data}
      title={title}
      height={height}
      colors={['#3B82F6', '#94A3B8']}
    />
  );
};

export const CategoryPerformanceChart: React.FC<{
  data: CategoryPerformance[];
  title?: string;
  height?: number;
}> = ({ data, title = "Performance by Category", height = 300 }) => {
  const chartData = data.map(cat => ({
    category: cat.category,
    completion_rate: cat.completion_rate,
    average_score: cat.average_score,
    tasks_completed: cat.tasks_completed
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completion_rate" fill="#3B82F6" name="Completion Rate %" />
          <Bar dataKey="average_score" fill="#10B981" name="Average Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ActivityHeatmap: React.FC<{
  data: TimeSeriesData[];
  title?: string;
  height?: number;
}> = ({ data, title = "Activity Over Time", height = 200 }) => {
  return (
    <PerformanceChart
      type="line"
      data={data}
      title={title}
      height={height}
      colors={['#8B5CF6']}
    />
  );
};

export const TimeVsQualityScatter: React.FC<{
  data: Array<{ time_spent: number; score: number; task_name: string }>;
  title?: string;
  height?: number;
}> = ({ data, title = "Time vs Quality", height = 300 }) => {
  return (
    <PerformanceChart
      type="scatter"
      data={data}
      title={title}
      height={height}
      colors={['#F59E0B']}
    />
  );
};

export const DifficultyDistributionPie: React.FC<{
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
}> = ({ data, title = "Task Difficulty Distribution", height = 300 }) => {
  return (
    <PerformanceChart
      type="pie"
      data={data}
      title={title}
      height={height}
      colors={['#10B981', '#F59E0B', '#EF4444']}
    />
  );
};

export default PerformanceChart;