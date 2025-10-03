import React from 'react';
import { Heart } from 'lucide-react';
import './CalendarDay.css';

function CalendarDay({ day, isToday, events, eventTypes, onEventClick }) {
  return (
    <div className={`calendar-day ${isToday ? 'today' : ''}`}>
      <div className="day-number">{day}</div>
      <div className="events-list">
        {events.slice(0, 2).map(event => {
          const EventIcon = eventTypes[event.type]?.icon || Heart;
          const eventColor = eventTypes[event.type]?.color || '#94a3b8';
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="event-badge"
              style={{ backgroundColor: eventColor }}
            >
              <EventIcon size={10} />
              <span>{event.title}</span>
            </div>
          );
        })}
        {events.length > 2 && (
          <div 
            className="more-events"
            onClick={() => {
              if (events.length > 0) onEventClick(events[0]);
            }}
          >
            +{events.length - 2}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarDay;