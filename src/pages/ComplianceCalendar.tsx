import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { calendarApi } from '../api/calendar';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });

export default function ComplianceCalendar() {
  const [events, setEvents] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await calendarApi.list();
        if (res.data?.status === 'success') {
          const ev = (res.data.data.events || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start),
            end: new Date(e.end || e.start),
            allDay: !!e.allDay,
            resource: e.meta,
            type: e.type
          }));
          setEvents(ev);
        } else {
          setEvents([]);
        }
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || events === null) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Compliance Calendar</Typography>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={[ 'month', 'week', 'day' ]}
        defaultView="month"
        popup
      />
    </Box>
  );
}
