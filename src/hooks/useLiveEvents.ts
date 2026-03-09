import { useState, useEffect } from "react";
import { LiveEvent } from "@/features/live-dashboard/components/EventFeed";

const sampleUsers = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"];
const eventTypes: LiveEvent["type"][] = ["follow", "sub", "donation", "raid"];

function createMockEvent(): LiveEvent {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
  const event: LiveEvent = {
    id: crypto.randomUUID(),
    type,
    user,
  };

  if (type === "donation") {
    event.amount = Math.floor(Math.random() * 1000) + 1;
    event.currency = "₽";
  } else if (type === "sub") {
    event.tier = "1";
  } else if (type === "raid") {
    event.amount = Math.floor(Math.random() * 100) + 1;
  }

  return event;
}

export function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prevEvents) => [createMockEvent(), ...prevEvents.slice(0, 19)]);
    }, 3000); // New event every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return events;
}
