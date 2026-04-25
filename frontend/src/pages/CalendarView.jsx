import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../utils/api';
import { Clock, MapPin, User } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarView() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sched, rm, inst, crs] = await Promise.all([
          api.get('/schedules/'), api.get('/rooms/'), api.get('/instructors/'), api.get('/courses/')
        ]);
        
        // Map day_of_week to nearest upcoming date
        const dayMap = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
        
        const calendarEvents = sched.data.map(s => {
          const course = crs.data.find(c => c.id === s.course) || {};
          const room = rm.data.find(r => r.id === s.room) || {};
          const instObj = inst.data.find(i => i.id === s.instructor) || {};

          const now = new Date();
          const currentDay = now.getDay();
          const targetDay = dayMap[s.day_of_week];
          let diff = targetDay - currentDay;
          
          const targetDate = new Date();
          targetDate.setDate(now.getDate() + diff);
          
          const [startH, startM] = s.start_time.split(':');
          const [endH, endM] = s.end_time.split(':');
          
          const start = new Date(targetDate);
          start.setHours(parseInt(startH), parseInt(startM), 0);
          
          const end = new Date(targetDate);
          end.setHours(parseInt(endH), parseInt(endM), 0);

          return {
            title: course.name || 'Class',
            start,
            end,
            resource: {
              code: course.code,
              room: room.name,
              instructor: instObj.name
            }
          };
        });

        setEvents(calendarEvents);
      } catch (err) {
        console.error("Failed to load schedules", err);
      }
    };
    fetchAll();
  }, []);

  const EventComponent = ({ event }) => (
    <div className="calendar-event-card">
      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{event.title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.75rem', opacity: 0.9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <MapPin size={10} /> {event.resource.room}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <User size={10} /> {event.resource.instructor}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <div className="page-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Class Schedule</h1>
          <p className="text-muted">A bird's eye view of all academic activities.</p>
        </div>
      </div>
      
      <div className="card" style={{ height: '100%', padding: '1rem' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="work_week"
          views={['work_week', 'day', 'agenda']}
          components={{
            event: EventComponent
          }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
