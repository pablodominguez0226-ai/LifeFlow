import React from 'react';
import { CalendarioPage } from '../../pages/calendario';

interface CalendarViewProps {
  onOpenReplan?: (taskId: string) => void;
  onOpenNewActivity?: () => void;
  onOpenWeeklyGenerator?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = (props) => {
  return <CalendarioPage {...props} />;
};

export default CalendarView;
