import React from 'react';

interface BatchInfoSectionProps {
  month: string;
  setMonth: (month: string) => void;
}

const BatchInfoSection: React.FC<BatchInfoSectionProps> = ({
  month,
  setMonth
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>
          Month:
        </label>
        <div className="relative">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white transition-shadow"
          >
            <option value="">Select a month</option>
            {months.map((monthName) => (
              <option key={monthName} value={monthName.toUpperCase()}>
                {monthName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BatchInfoSection;
