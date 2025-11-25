import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Users, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
// Socket will be handled via notifications

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date_time: "",
    end_date_time: "",
    visibility_type: "ALL",
    assigned_users: [],
  });

  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  // Load employees for selection
  useEffect(() => {
    const loadEmployees = async () => {
      if (isAdminOrHR) {
        try {
          const employeesData = await apiService.getEmployees();
          setEmployees(Array.isArray(employeesData) ? employeesData : employeesData.data || []);
        } catch (error) {
          console.error("Error loading employees:", error);
        }
      }
    };
    loadEmployees();
  }, [isAdminOrHR]);

  // Load events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startOfCurrentMonth = startOfMonth(currentDate);
      const endOfCurrentMonth = endOfMonth(currentDate);
      
      const eventsData = await apiService.getEvents({
        start: startOfCurrentMonth.toISOString(),
        end: endOfCurrentMonth.toISOString(),
      });
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Real-time updates will be handled via the notification system
  // Events are automatically refreshed when notifications are received

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter((event) => {
      try {
        const eventStart = event.start ? (typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start)) : null;
        const eventEnd = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
        if (!eventStart || !eventEnd) return false;
        return (
          isSameDay(eventStart, day) ||
          isSameDay(eventEnd, day) ||
          (eventStart <= day && eventEnd >= day)
        );
      } catch (error) {
        console.error("Error parsing event date:", error, event);
        return false;
      }
    });
  };

  // Handle create event
  const handleCreateEvent = async () => {
    try {
      if (!newEvent.title.trim()) {
        toast.error("Event title is required");
        return;
      }

      if (!newEvent.start_date_time || !newEvent.end_date_time) {
        toast.error("Start and end date/time are required");
        return;
      }

      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || null,
        start_date_time: new Date(newEvent.start_date_time).toISOString(),
        end_date_time: new Date(newEvent.end_date_time).toISOString(),
        visibility_type: newEvent.visibility_type,
        assigned_users: newEvent.visibility_type === "SPECIFIC" ? newEvent.assigned_users : null,
      };

      await apiService.createEvent(eventData);
      toast.success("Event created successfully");
      setIsCreateDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        start_date_time: "",
        end_date_time: "",
        visibility_type: "ALL",
        assigned_users: [],
      });
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    }
  };

  // Handle update event
  const handleUpdateEvent = async () => {
    try {
      if (!selectedEvent) return;

      if (!selectedEvent.title.trim()) {
        toast.error("Event title is required");
        return;
      }

      const eventData = {
        title: selectedEvent.title.trim(),
        description: selectedEvent.description?.trim() || null,
        start_date_time: new Date(selectedEvent.start).toISOString(),
        end_date_time: new Date(selectedEvent.end).toISOString(),
        visibility_type: selectedEvent.visibility_type,
        assigned_users: selectedEvent.visibility_type === "SPECIFIC" ? selectedEvent.assigned_users : null,
      };

      await apiService.updateEvent(selectedEvent.id, eventData);
      toast.success("Event updated successfully");
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error(error.message || "Failed to update event");
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await apiService.deleteEvent(eventId);
      toast.success("Event deleted successfully");
      setIsViewDialogOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Failed to delete event");
    }
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Calendar Events
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(currentDate, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            Next
          </Button>
          {isAdminOrHR && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Create a calendar event and notify employees
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      placeholder="Enter event description (optional)"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date_time">Start Date & Time *</Label>
                      <Input
                        id="start_date_time"
                        type="datetime-local"
                        value={newEvent.start_date_time}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            start_date_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date_time">End Date & Time *</Label>
                      <Input
                        id="end_date_time"
                        type="datetime-local"
                        value={newEvent.end_date_time}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            end_date_time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="visibility_type">Visibility Type *</Label>
                    <Select
                      value={newEvent.visibility_type}
                      onValueChange={(value) =>
                        setNewEvent({
                          ...newEvent,
                          visibility_type: value,
                          assigned_users: value === "ALL" ? [] : newEvent.assigned_users,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Employees</SelectItem>
                        <SelectItem value="SPECIFIC">Specific Employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newEvent.visibility_type === "SPECIFIC" && (
                    <div>
                      <Label>Select Employees</Label>
                      <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                        {employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={newEvent.assigned_users.includes(employee.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewEvent({
                                    ...newEvent,
                                    assigned_users: [
                                      ...newEvent.assigned_users,
                                      employee.id,
                                    ],
                                  });
                                } else {
                                  setNewEvent({
                                    ...newEvent,
                                    assigned_users: newEvent.assigned_users.filter(
                                      (id) => id !== employee.id
                                    ),
                                  });
                                }
                              }}
                            />
                            <span>
                              {employee.name} ({employee.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading events...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-sm text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`aspect-square border rounded-lg p-2 ${
                        isToday ? "bg-primary/10 border-primary" : ""
                      } ${
                        !isSameMonth(day, currentDate)
                          ? "opacity-50"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (dayEvents.length > 0) {
                          setSelectedEvent(dayEvents[0]);
                          setIsViewDialogOpen(true);
                        }
                      }}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday ? "text-primary" : ""
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.description || "No description"}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label>Start</Label>
                <p className="text-sm">
                  {selectedEvent.start 
                    ? format(
                        typeof selectedEvent.start === 'string' 
                          ? parseISO(selectedEvent.start) 
                          : new Date(selectedEvent.start),
                        "PPpp"
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label>End</Label>
                <p className="text-sm">
                  {selectedEvent.end 
                    ? format(
                        typeof selectedEvent.end === 'string' 
                          ? parseISO(selectedEvent.end) 
                          : new Date(selectedEvent.end),
                        "PPpp"
                      )
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label>Visibility</Label>
                <Badge variant={selectedEvent.visibility_type === "ALL" ? "default" : "secondary"}>
                  {selectedEvent.visibility_type === "ALL" ? (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      All Employees
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Specific Employees
                    </>
                  )}
                </Badge>
              </div>
              {selectedEvent.creator && (
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm">{selectedEvent.creator.name || selectedEvent.creator.email}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {isAdminOrHR && selectedEvent && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEvent.description || ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">Start Date & Time *</Label>
                  <Input
                    id="edit-start"
                    type="datetime-local"
                    value={
                      selectedEvent.start
                        ? format(
                            typeof selectedEvent.start === 'string' 
                              ? parseISO(selectedEvent.start) 
                              : new Date(selectedEvent.start),
                            "yyyy-MM-dd'T'HH:mm"
                          )
                        : ""
                    }
                    onChange={(e) => {
                      const dateValue = new Date(e.target.value);
                      setSelectedEvent({
                        ...selectedEvent,
                        start: dateValue.toISOString(),
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end">End Date & Time *</Label>
                  <Input
                    id="edit-end"
                    type="datetime-local"
                    value={
                      selectedEvent.end
                        ? format(
                            typeof selectedEvent.end === 'string' 
                              ? parseISO(selectedEvent.end) 
                              : new Date(selectedEvent.end),
                            "yyyy-MM-dd'T'HH:mm"
                          )
                        : ""
                    }
                    onChange={(e) => {
                      const dateValue = new Date(e.target.value);
                      setSelectedEvent({
                        ...selectedEvent,
                        end: dateValue.toISOString(),
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-visibility">Visibility Type *</Label>
                <Select
                  value={selectedEvent.visibility_type}
                  onValueChange={(value) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      visibility_type: value,
                      assigned_users: value === "ALL" ? [] : selectedEvent.assigned_users || [],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>
                    <SelectItem value="SPECIFIC">Specific Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedEvent.visibility_type === "SPECIFIC" && (
                <div>
                  <Label>Select Employees</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {employees.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={(selectedEvent.assigned_users || []).includes(employee.id)}
                          onChange={(e) => {
                            const currentAssigned = selectedEvent.assigned_users || [];
                            if (e.target.checked) {
                              setSelectedEvent({
                                ...selectedEvent,
                                assigned_users: [...currentAssigned, employee.id],
                              });
                            } else {
                              setSelectedEvent({
                                ...selectedEvent,
                                assigned_users: currentAssigned.filter(
                                  (id) => id !== employee.id
                                ),
                              });
                            }
                          }}
                        />
                        <span>
                          {employee.name} ({employee.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>Update Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
