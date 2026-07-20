/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection, useStoreObject } from "../shared/hooks/useDataStore.js";
import { dataStore } from "../shared/repositories/dataStore.js";
import { indexById } from "../shared/utils/indexById.js";

const EngagementContext = createContext(null);
const TODAY = () => new Date().toISOString().split("T")[0];

function addActivity(list, type, title, description, tone = "accent") {
  return [
    {
      id: `ACT-${Date.now()}`,
      type,
      title,
      description,
      date: TODAY(),
      tone,
    },
    ...(list || []),
  ];
}

function addCommunication(list, entry) {
  return [{ id: `COM-${Date.now()}`, date: TODAY(), tone: "accent", ...entry }, ...(list || [])];
}

export function EngagementProvider({ children }) {
  const data = useStoreObject("engagement") || {};
  const partnersList = useCollection("channelPartners");
  const customersList = useCollection("customers");
  const propertiesList = useCollection("properties");
  const venturesList = useCollection("ventures");
  const layoutsList = useCollection("layouts");
  const plotsList = useCollection("plots");

  const value = useMemo(() => {
    const partners = partnersList.filter((p) => p.status === "Approved");
    const partnersById = indexById(partnersList);
    const customersById = indexById(customersList);
    const propertiesById = indexById(propertiesList);
    const venturesById = indexById(venturesList);
    const layoutsById = indexById(layoutsList);
    const plotsById = indexById(plotsList);

    const updateEngagement = (updater) => dataStore.updateObject("engagement", updater);

    const getKpis = () => {
      const today = TODAY();
      const meetings = data.meetings || [];
      const siteVisits = data.siteVisits || [];
      const events = data.events || [];
      const announcements = data.announcements || [];

      return {
        todaysMeetings: meetings.filter((m) => m.date === today && m.status !== "Cancelled").length,
        upcomingSiteVisits: siteVisits.filter(
          (s) => s.date >= today && ["Scheduled", "In Progress"].includes(s.status)
        ).length,
        activeEvents: events.filter((e) => e.status === "Upcoming").length,
        websiteAnnouncements: announcements.filter((a) => a.enabled && a.status === "Published").length,
        pendingInvitations: meetings.filter((m) => m.invitationStatus === "Pending").length,
        completedMeetings: meetings.filter((m) => m.status === "Completed").length,
        scheduledNotifications: announcements.filter(
          (a) => a.status === "Scheduled" || a.scheduledPublish
        ).length,
        missedMeetings: meetings.filter((m) => m.status === "Missed").length,
      };
    };

    const getCalendarEvents = () => {
      const items = [];
      (data.meetings || []).forEach((m) => {
        items.push({
          id: m.id,
          title: m.title,
          date: m.date,
          time: m.time,
          type: "meeting",
          color: "accent",
          status: m.status,
          meta: m.partnerName,
        });
      });
      (data.siteVisits || []).forEach((s) => {
        items.push({
          id: s.id,
          title: `Site Visit — ${s.customerName}`,
          date: s.date,
          time: s.time,
          type: "site-visit",
          color: "success",
          status: s.status,
          meta: s.ventureName,
        });
      });
      (data.events || []).forEach((e) => {
        items.push({
          id: e.id,
          title: e.name,
          date: e.date,
          time: e.time,
          type: "team-event",
          color: "violet",
          status: e.status,
          meta: e.venue,
        });
      });
      (data.reminders || []).forEach((r) => {
        if (["Meeting", "Site Visit", "Property Visit"].includes(r.type)) {
          items.push({
            id: r.id,
            title: r.title,
            date: r.dueDate,
            time: r.dueTime,
            type: r.type.toLowerCase().replace(" ", "-"),
            color: "warning",
            status: r.status,
            meta: r.partnerName,
          });
        }
      });
      return items;
    };

    const addMeeting = (meeting) => {
      const id = `MTG-${9000 + (data.meetings?.length || 0) + 1}`;
      const entry = { ...meeting, id, status: meeting.status || "Scheduled", createdDate: TODAY() };
      updateEngagement((prev) => ({
        ...prev,
        meetings: [entry, ...(prev.meetings || [])],
        communications: addCommunication(prev.communications, {
          type: "meeting-scheduled",
          title: "Meeting Scheduled",
          description: `${entry.title} on ${entry.date}`,
          partnerId: entry.partnerId,
          partnerName: entry.partnerName,
          customerId: entry.customerId,
          tone: "accent",
        }),
        activities: addActivity(prev.activities, "meeting-created", "Meeting Created", entry.title),
      }));
      return id;
    };

    const addSiteVisit = (visit) => {
      const id = `SV-${9100 + (data.siteVisits?.length || 0) + 1}`;
      const entry = { ...visit, id, status: "Scheduled", createdDate: TODAY() };
      updateEngagement((prev) => ({
        ...prev,
        siteVisits: [entry, ...(prev.siteVisits || [])],
        activities: addActivity(
          prev.activities,
          "site-visit-scheduled",
          "Site Visit Scheduled",
          `${entry.customerName} — ${entry.ventureName}`
        ),
      }));
      return id;
    };

    const addAnnouncement = (ann) => {
      const id = `ANN-${9300 + (data.announcements?.length || 0) + 1}`;
      const entry = {
        ...ann,
        id,
        enabled: ann.enabled !== false,
        pinned: ann.pinned || false,
        status: ann.status || "Draft",
        createdDate: TODAY(),
      };
      updateEngagement((prev) => ({
        ...prev,
        announcements: [entry, ...(prev.announcements || [])],
        ...(entry.status === "Published"
          ? {
              communications: addCommunication(prev.communications, {
                type: "notification-published",
                title: "Notification Published",
                description: entry.title,
                tone: "success",
              }),
              activities: addActivity(
                prev.activities,
                "notification-published",
                "Notification Published",
                entry.title,
                "success"
              ),
            }
          : {}),
      }));
      return id;
    };

    const publishAnnouncement = (id) => {
      updateEngagement((prev) => ({
        ...prev,
        announcements: (prev.announcements || []).map((a) =>
          a.id === id ? { ...a, status: "Published", publishedDate: TODAY(), enabled: true } : a
        ),
        communications: addCommunication(prev.communications, {
          type: "notification-published",
          title: "Notification Published",
          description: (prev.announcements || []).find((a) => a.id === id)?.title,
          tone: "success",
        }),
        activities: addActivity(
          prev.activities,
          "notification-published",
          "Notification Published",
          (prev.announcements || []).find((a) => a.id === id)?.title || "",
          "success"
        ),
      }));
    };

    const addReminder = (reminder) => {
      const id = `REM-${9400 + (data.reminders?.length || 0) + 1}`;
      const entry = { ...reminder, id, status: "Upcoming", createdDate: TODAY() };
      updateEngagement((prev) => ({
        ...prev,
        reminders: [entry, ...(prev.reminders || [])],
      }));
      return id;
    };

    const addEvent = (event) => {
      const id = `EVT-${9200 + (data.events?.length || 0) + 1}`;
      const entry = { ...event, id, status: "Upcoming", createdDate: TODAY() };
      updateEngagement((prev) => ({
        ...prev,
        events: [entry, ...(prev.events || [])],
        activities: addActivity(prev.activities, "event-created", "Event Created", entry.name, "info"),
      }));
      return id;
    };

    const saveMeetingDraft = (meeting) => addMeeting({ ...meeting, status: "Draft" });

    return {
      data,
      partners,
      customers: customersList,
      properties: propertiesList,
      ventures: venturesList,
      layouts: layoutsList,
      plots: plotsList,
      partnersById,
      customersById,
      propertiesById,
      venturesById,
      layoutsById,
      plotsById,
      meetings: data.meetings || [],
      siteVisits: data.siteVisits || [],
      events: data.events || [],
      announcements: data.announcements || [],
      reminders: data.reminders || [],
      communications: data.communications || [],
      activities: data.activities || [],
      getKpis,
      getCalendarEvents,
      addMeeting,
      addSiteVisit,
      addAnnouncement,
      publishAnnouncement,
      addReminder,
      addEvent,
      saveMeetingDraft,
    };
  }, [data, partnersList, customersList, propertiesList, venturesList, layoutsList, plotsList]);

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

export function EngagementLayout() {
  return (
    <EngagementProvider>
      <Outlet />
    </EngagementProvider>
  );
}

export function useEngagement() {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error("useEngagement must be used within EngagementProvider");
  return ctx;
}
