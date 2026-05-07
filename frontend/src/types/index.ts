export type WasteType = "organico" | "reciclavel" | "vidro" | "poda" | "oleo" | "pilhas" | "eletronicos" | "medicamentos";

export interface Schedule {
  wasteType: string;
  days: string[];
  timeSlot: string;
  notes?: string;
}

export interface ScheduleResponse {
  neighborhood: string;
  schedules: Schedule[];
}

export interface CollectionPoint {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedTypes: string[];
  openingHours: string;
}

export interface NearbyPointsResponse {
  points: (CollectionPoint & { distanceMeters: number })[];
}

export interface Reminder {
  id: string;
  sessionId: string;
  itemType: string;
  itemDesc?: string;
  pointId: number;
  pointName: string;
  pointAddress: string;
  status: "pendente" | "concluido";
  createdAt: string;
}

export interface CreateReminderRequest {
  sessionId: string;
  itemType: string;
  itemDesc?: string;
  pointId: number;
}

export interface CreateReminderResponse {
  id: string;
  sessionId: string;
  itemType: string;
  itemDesc?: string;
  pointId: number;
  pointName: string;
  pointAddress: string;
  status: "pendente" | "concluido";
  createdAt: string;
}

export interface ListRemindersResponse {
  reminders: Reminder[];
}

export interface CreateScheduleRequest {
  neighborhood: string;
  wasteType: string;
  days: string[];
  timeSlot: string;
  notes?: string;
}

export interface CreateScheduleResponse {
  id: number;
  neighborhood: string;
  wasteType: string;
  days: string[];
  timeSlot: string;
  notes?: string;
}

export interface CreateCollectionPointRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedTypes: string[];
  openingHours: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
}

export interface SuggestedPoint {
  id: number;
  name: string;
  address: string;
  distanceMeters: number;
}

export interface ReminderSummary {
  id: string;
  itemType: string;
  itemDesc?: string;
  pointName: string;
  status: string;
}

export interface NextCollectionInfo {
  wasteType: string;
  neighborhood: string;
  nextDay: string;
  daysUntil: number;
}

export interface FilteredPoint {
  id: number;
  name: string;
  address: string;
  distanceMeters: number;
  acceptedTypes: string[];
}

export interface ScheduleSummary {
  id: number;
  neighborhood: string;
  wasteType: string;
  days: string[];
  timeSlot: string;
  notes?: string;
}

export interface PointSummary {
  id: number;
  name: string;
  address: string;
  acceptedTypes: string[];
  openingHours: string;
}

export interface ChatResponse {
  action:
    | "schedule_info"
    | "suggest_reminder"
    | "create_reminder"
    | "list_reminders"
    | "complete_reminder"
    | "delete_reminder"
    | "next_collection"
    | "filter_points"
    | "create_schedule"
    | "create_point"
    | "general_reply"
    | "unknown";
  reply: string;
  neighborhood?: string;
  wasteType?: string;
  itemType?: string;
  suggestedPoint?: SuggestedPoint;
  reminders?: ReminderSummary[];
  completedReminderId?: string;
  createdReminder?: ReminderSummary;
  deletedReminderId?: string;
  nextCollection?: NextCollectionInfo;
  filteredPoints?: FilteredPoint[];
  createdSchedule?: ScheduleSummary;
  createdPoint?: PointSummary;
}
