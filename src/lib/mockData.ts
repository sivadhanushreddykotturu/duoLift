import { AppState } from "./types";

export const defaultState: AppState = {
  me: {
    name: "Siva",
    avatar: "S",
  },
  partner: {
    name: "Alex",
    avatar: "A",
  },
  streak: 14,
  myDoneToday: false,
  partnerDoneToday: false,
  workouts: [
    {
      id: "1",
      userId: "me",
      userName: "Siva",
      date: new Date(Date.now() - 86400000).toISOString(),
      label: "Push",
      notes: "Felt strong today",
    },
    {
      id: "2",
      userId: "partner",
      userName: "Alex",
      date: new Date(Date.now() - 86400000).toISOString(),
      label: "Pull",
      notes: "Focused on back width",
    },
    {
      id: "3",
      userId: "me",
      userName: "Siva",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      label: "Legs",
    },
  ],
  photos: [
    {
      id: "p1",
      userId: "me",
      userName: "Siva",
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80",
      caption: "Week 4 check",
    },
    {
      id: "p2",
      userId: "partner",
      userName: "Alex",
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
      caption: "Pump post back day",
    },
  ],
};
