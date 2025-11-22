import { useState, useEffect, useRef, useCallback } from "react";
<<<<<<< HEAD
import { useSearchParams } from "react-router-dom";
=======
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Send,
  Phone,
  Video,
  Info,
  MessageSquare,
  Users,
  Mail,
  Bell,
  CalendarDays,
  Clock,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  ChevronRight,
  Flag,
  RefreshCw,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { users } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useSocket } from "@/hooks/use-socket";

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID
 * @property {string} senderId - Sender ID
 * @property {string|null} recipientId - Recipient ID
 * @property {string|null} channelId - Channel ID
 * @property {string} content - Message content
 * @property {string} timestamp - Message timestamp
 * @property {boolean} read - Whether message is read
 * @property {Array} [attachments] - Message attachments
 */

/**
 * @typedef {Object} Channel
 * @property {string} id - Channel ID
 * @property {string} name - Channel name
 * @property {string} description - Channel description
 * @property {string[]} members - Channel members
 * @property {boolean} isPrivate - Whether channel is private
 * @property {string} createdAt - Creation date
 */

// Sample direct messages data (kept for reference, now using API)
const _directMessages = [
  {
    id: "dm1",
    senderId: "u2",
    recipientId: "u1",
    channelId: null,
    content:
      "Hi there! Just checking if you've reviewed the latest marketing materials?",
    timestamp: "2023-08-03T10:30:00Z",
    read: true,
  },
  {
    id: "dm2",
    senderId: "u1",
    recipientId: "u2",
    channelId: null,
    content:
      "Yes, I've looked through them. They look great! Just a few minor adjustments needed.",
    timestamp: "2023-08-03T10:35:00Z",
    read: true,
  },
  {
    id: "dm3",
    senderId: "u2",
    recipientId: "u1",
    channelId: null,
    content: "Perfect! Could you send me your notes by the end of the day?",
    timestamp: "2023-08-03T10:40:00Z",
    read: true,
  },
  {
    id: "dm4",
    senderId: "u1",
    recipientId: "u2",
    channelId: null,
    content: "Sure thing, I'll email them to you.",
    timestamp: "2023-08-03T10:45:00Z",
    read: true,
  },
  {
    id: "dm5",
    senderId: "u3",
    recipientId: "u1",
    channelId: null,
    content:
      "Hello! Are we still meeting at 2pm to discuss the new training program?",
    timestamp: "2023-08-03T09:15:00Z",
    read: false,
  },
  {
    id: "dm6",
    senderId: "u4",
    recipientId: "u1",
    channelId: null,
    content:
      "I've updated the employee handbook with the new policies. Can you review it when you get a chance?",
    timestamp: "2023-08-02T16:20:00Z",
    read: false,
  },
  {
    id: "dm7",
    senderId: "u5",
    recipientId: "u1",
    channelId: null,
    content:
      "The team building event is confirmed for next Friday. Please let me know if that works for your department.",
    timestamp: "2023-08-01T11:45:00Z",
    read: true,
  },
];

// Sample channels data (kept for reference, now using API)
const _channels = [
  {
    id: "c1",
    name: "general",
    description: "General discussions for all employees",
    members: ["u1", "u2", "u3", "u4", "u5"],
    isPrivate: false,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "hr-announcements",
    description: "Important HR announcements and updates",
    members: ["u1", "u2", "u3"],
    isPrivate: false,
    createdAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "c3",
    name: "tech-team",
    description: "Tech team discussions and updates",
    members: ["u1", "u4", "u5"],
    isPrivate: true,
    createdAt: "2023-01-03T00:00:00Z",
  },
];

// Sample channel messages (kept for reference, now using API)
const _channelMessages = [
  {
    id: "cm1",
    senderId: "u2",
    recipientId: null,
    channelId: "c1",
    content:
      "Good morning everyone! Don't forget about the company-wide meeting at 11am today.",
    timestamp: "2023-08-03T08:00:00Z",
    read: true,
  },
  {
    id: "cm2",
    senderId: "u3",
    recipientId: null,
    channelId: "c1",
    content: "Thanks for the reminder! Will it be in the main conference room?",
    timestamp: "2023-08-03T08:05:00Z",
    read: true,
  },
  {
    id: "cm3",
    senderId: "u2",
    recipientId: null,
    channelId: "c1",
    content:
      "Yes, it will be in the main conference room. The agenda has been emailed to everyone.",
    timestamp: "2023-08-03T08:10:00Z",
    read: true,
  },
  {
    id: "cm4",
    senderId: "u1",
    recipientId: null,
    channelId: "c1",
    content:
      "I'll prepare the projector and make sure everything is set up for the presentations.",
    timestamp: "2023-08-03T08:15:00Z",
    read: true,
  },
  {
    id: "cm5",
    senderId: "u4",
    recipientId: null,
    channelId: "c1",
    content:
      "Great! I've also invited the new team members so they can get up to speed.",
    timestamp: "2023-08-03T08:20:00Z",
    read: true,
  },
  {
    id: "cm6",
    senderId: "u2",
    recipientId: null,
    channelId: "c2",
    content:
      "Important announcement: We've updated the leave policy. Please review the changes in the handbook.",
    timestamp: "2023-08-02T14:30:00Z",
    read: true,
    attachments: [
      {
        id: "a1",
        type: "document",
        url: "#",
        name: "Updated_Leave_Policy_2023.pdf",
      },
    ],
  },
];

export default function Communication() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("direct");
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] =
    useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Handle real-time direct messages
  const handleNewDirectMessage = useCallback(
    (newMessage) => {
      // Only add if it's for the current conversation
      if (
        activeConversation?.type === "direct" &&
        (newMessage.senderEmail === activeConversation.email ||
          newMessage.recipientEmail === activeConversation.email)
      ) {
        const transformedMessage = {
          id: newMessage.id.toString(),
          senderId: newMessage.senderEmail,
          senderEmail: newMessage.senderEmail,
          senderName: newMessage.senderName,
          recipientId: newMessage.recipientEmail,
          recipientEmail: newMessage.recipientEmail,
          content: newMessage.content,
          timestamp: newMessage.createdAt || new Date().toISOString(),
          read: newMessage.read,
          attachments: newMessage.attachments
            ? JSON.parse(newMessage.attachments)
            : [],
        };

        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          const messageExists = prev.some(
            (msg) => msg.id === transformedMessage.id
          );
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          return [...prev, transformedMessage];
        });
        scrollToBottom();
      }

      // Update conversations list
      setConversations((prevConversations) => {
        const existing = prevConversations.find(
          (c) =>
            c.email === newMessage.senderEmail ||
            c.email === newMessage.recipientEmail
        );
        if (existing) {
          return prevConversations.map((conv) =>
            conv.email === newMessage.senderEmail ||
            conv.email === newMessage.recipientEmail
              ? {
                  ...conv,
                  lastMessage: newMessage.content,
                  timestamp: newMessage.createdAt,
                }
              : conv
          );
        }
        return prevConversations;
      });
    },
    [activeConversation]
  );

  // Handle real-time channel messages
  const handleNewChannelMessage = useCallback(
    (channelId, newMessage) => {
      // Only add if it's for the current channel
      if (
        activeConversation?.type === "channel" &&
        activeConversation.id === channelId
      ) {
        const transformedMessage = {
          id: newMessage.id.toString(),
          senderId: newMessage.senderEmail,
          senderEmail: newMessage.senderEmail,
          senderName: newMessage.senderName,
          recipientId: null,
          channelId: newMessage.channelId,
          content: newMessage.content,
          timestamp: newMessage.createdAt || new Date().toISOString(),
          read: newMessage.read,
          attachments: newMessage.attachments
            ? JSON.parse(newMessage.attachments)
            : [],
        };

        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          const messageExists = prev.some(
            (msg) => msg.id === transformedMessage.id
          );
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          return [...prev, transformedMessage];
        });
        scrollToBottom();
      }

      // Update channels list
      setConversations((prevConversations) => {
        return prevConversations.map((conv) =>
          conv.id === channelId
            ? {
                ...conv,
                lastMessage: newMessage.content,
                timestamp: newMessage.createdAt,
              }
            : conv
        );
      });
    },
    [activeConversation]
  );

  // Setup Socket.io connection
  useSocket(handleNewDirectMessage, handleNewChannelMessage);

  // Load conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      if (activeTab === "direct" && user?.email) {
        try {
          setIsLoadingConversations(true);
          const conversationsData = await apiService.getConversations();

          // Transform API data to match component format
          const transformedConversations = conversationsData.map((conv) => ({
            id: conv.email, // Use email as ID
            email: conv.email,
            name: conv.name,
            lastMessage: conv.lastMessage || "No messages yet",
            timestamp: conv.lastMessageTime || new Date().toISOString(),
            unread: conv.unread || 0,
            online: false, // Can be enhanced later with real-time status
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              conv.name
            )}`,
          }));

          setConversations(transformedConversations);
        } catch (error) {
          console.error("Error loading conversations:", error);
          toast.error("Failed to load conversations");
          setConversations([]);
        } finally {
          setIsLoadingConversations(false);
        }
      } else if (activeTab === "channels") {
        try {
          setIsLoadingConversations(true);
          const channelsData = await apiService.getChannels();

          // Transform API data to match component format
          const transformedChannels = channelsData.map((channel) => ({
            id: channel.id,
            name: channel.name,
            lastMessage: channel.lastMessage || "No messages yet",
            timestamp: channel.lastMessageTime || new Date().toISOString(),
            unread: channel.unread || 0,
            online: true,
          }));

          setConversations(transformedChannels);
        } catch (error) {
          console.error("Error loading channels:", error);
          toast.error("Failed to load channels");
          setConversations([]);
        } finally {
          setIsLoadingConversations(false);
        }
      }
    };

    loadConversations();
  }, [activeTab, user?.email]);

  // Handle URL query parameters to open conversations/channels
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    const channelParam = searchParams.get("channel");

    // Only process if conversations are loaded
    if (conversations.length === 0) return;

    if (conversationParam) {
      // Decode the email from URL
      const decodedEmail = decodeURIComponent(conversationParam);

      // Find the conversation
      const foundConversation = conversations.find(
        (conv) => conv.email === decodedEmail || conv.id === decodedEmail
      );

      if (
        foundConversation &&
        (!activeConversation || activeConversation.email !== decodedEmail)
      ) {
        setActiveTab("direct");
        setActiveConversation({
          id: foundConversation.id,
          email: foundConversation.email || foundConversation.id,
          type: "direct",
          name: foundConversation.name,
        });
      } else if (!foundConversation) {
        // Conversation not found in list, try to create/open it
        // This handles cases where the conversation doesn't exist yet
        setActiveTab("direct");
        setActiveConversation({
          id: decodedEmail,
          email: decodedEmail,
          type: "direct",
          name: decodedEmail.split("@")[0] || decodedEmail,
        });
      }
    } else if (channelParam) {
      // Decode the channel ID from URL
      const decodedChannelId = decodeURIComponent(channelParam);

      // Find the channel
      const foundChannel = conversations.find(
        (conv) => conv.id === decodedChannelId
      );

      if (
        foundChannel &&
        (!activeConversation || activeConversation.id !== decodedChannelId)
      ) {
        setActiveTab("channels");
        setActiveConversation({
          id: foundChannel.id,
          type: "channel",
          name: foundChannel.name,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeConversation]);

  // Load messages when a conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation || !user?.email) return;

      if (activeConversation.type === "direct") {
        try {
          setIsLoadingMessages(true);
          const messagesData = await apiService.getConversation(
            activeConversation.email || activeConversation.id
          );

          // Transform API data to match component format
          const transformedMessages = messagesData.map((msg) => ({
            id: msg.id.toString(),
            senderId: msg.senderEmail,
            senderEmail: msg.senderEmail,
            senderName: msg.senderName,
            recipientId: msg.recipientEmail,
            recipientEmail: msg.recipientEmail,
            content: msg.content,
            timestamp: msg.createdAt || msg.timestamp,
            read: msg.read,
            attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
          }));

          setMessages(transformedMessages);

          // Mark messages as read (don't block if this fails)
          if (activeConversation.email) {
            try {
              await apiService.markMessagesAsRead(activeConversation.email);
              setConversations((prevConversations) =>
                prevConversations.map((conv) =>
                  conv.email === activeConversation.email
                    ? { ...conv, unread: 0 }
                    : conv
                )
              );
            } catch (readError) {
              console.error("Error marking messages as read:", readError);
              // Continue anyway - not critical
            }
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          toast.error("Failed to load messages");
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      } else if (activeConversation.type === "channel") {
        try {
          setIsLoadingMessages(true);
          const messagesData = await apiService.getChannelMessages(
            activeConversation.id
          );

          // Transform API data to match component format
          const transformedMessages = messagesData.map((msg) => ({
            id: msg.id.toString(),
            senderId: msg.senderEmail,
            senderEmail: msg.senderEmail,
            senderName: msg.senderName,
            recipientId: null,
            channelId: msg.channelId,
            content: msg.content,
            timestamp: msg.createdAt || msg.timestamp,
            read: msg.read,
            attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
          }));

          setMessages(transformedMessages);
        } catch (error) {
          console.error("Error loading channel messages:", error);
          toast.error("Failed to load channel messages");
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      }

      // Scroll to bottom of messages
      scrollToBottom();
    };

    loadMessages();
  }, [activeConversation, user?.email, activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (
      !message.trim() ||
      !activeConversation ||
      !user?.email ||
      isSendingMessage
    )
      return;

    const messageContent = message.trim();
    setMessage(""); // Clear input immediately for better UX

    if (activeConversation.type === "direct") {
      try {
        setIsSendingMessage(true);
        const recipientEmail =
          activeConversation.email || activeConversation.id;

        // Send message via API
        const sentMessage = await apiService.sendMessage(
          recipientEmail,
          messageContent
        );

        // Add message to local state only if it doesn't already exist
        // (socket event might have already added it)
        const newMessage = {
          id: sentMessage.id.toString(),
          senderId: sentMessage.senderEmail,
          senderEmail: sentMessage.senderEmail,
          senderName: sentMessage.senderName,
          recipientId: sentMessage.recipientEmail,
          recipientEmail: sentMessage.recipientEmail,
          content: sentMessage.content,
          timestamp: sentMessage.createdAt || new Date().toISOString(),
          read: false,
          attachments: [],
        };

        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === newMessage.id);
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          return [...prev, newMessage];
        });

        // Update conversation last message
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.email === recipientEmail
              ? {
                  ...conv,
                  lastMessage: messageContent,
                  timestamp: newMessage.timestamp,
                }
              : conv
          )
        );

        scrollToBottom();

        // Refresh conversations list to update last message
        if (activeTab === "direct" && user?.email) {
          try {
            const conversationsData = await apiService.getConversations();
            const transformedConversations = conversationsData.map((conv) => ({
              id: conv.email,
              email: conv.email,
              name: conv.name,
              lastMessage: conv.lastMessage || "No messages yet",
              timestamp: conv.lastMessageTime || new Date().toISOString(),
              unread: conv.unread || 0,
              online: false,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                conv.name
              )}`,
            }));
            setConversations(transformedConversations);
          } catch (error) {
            console.error("Error refreshing conversations:", error);
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        setMessage(messageContent); // Restore message on error
      } finally {
        setIsSendingMessage(false);
      }
    } else if (activeConversation.type === "channel") {
      try {
        setIsSendingMessage(true);
        const channelId = activeConversation.id;

        // Send message via API
        const sentMessage = await apiService.sendMessage(
          null,
          messageContent,
          channelId,
          channelId
        );

        // Add message to local state only if it doesn't already exist
        // (socket event might have already added it)
        const newMessage = {
          id: sentMessage.id.toString(),
          senderId: sentMessage.senderEmail,
          senderEmail: sentMessage.senderEmail,
          senderName: sentMessage.senderName,
          recipientId: null,
          channelId: sentMessage.channelId,
          content: sentMessage.content,
          timestamp: sentMessage.createdAt || new Date().toISOString(),
          read: false,
          attachments: [],
        };

        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === newMessage.id);
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          return [...prev, newMessage];
        });

        // Update channel last message
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === channelId
              ? {
                  ...conv,
                  lastMessage: messageContent,
                  timestamp: newMessage.timestamp,
                }
              : conv
          )
        );

        scrollToBottom();
      } catch (error) {
        console.error("Error sending channel message:", error);
        toast.error("Failed to send message");
        setMessage(messageContent); // Restore message on error
      } finally {
        setIsSendingMessage(false);
      }
    }
  };

  // Format date for messages
  const formatMessageDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  // Get sender info
  const getSenderInfo = (senderEmail) => {
    // Try to find in current messages first
    const message = messages.find((m) => m.senderEmail === senderEmail);
    if (message) {
      return {
        name: message.senderName || "Unknown User",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          message.senderName || "Unknown"
        )}`,
      };
    }

    // Fallback to users list
    const foundUser = users.find(
      (u) => u.email === senderEmail || u.id === senderEmail
    );
    if (foundUser) {
      return {
        name: foundUser.name,
        avatar:
          foundUser.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            foundUser.name
          )}`,
      };
    }

    return {
      name: "Unknown User",
      avatar: `https://ui-avatars.com/api/?name=Unknown`,
    };
  };

  // Load available users for new conversation
  useEffect(() => {
    const loadUsers = async () => {
      if (!isNewConversationDialogOpen) return;

      try {
        setIsLoadingUsers(true);
        // Get all employees/users for messaging
        let usersData = [];
        try {
          // Try to get employees first
          const employees = await apiService.getEmployees();
          usersData = employees
            .filter((emp) => emp.email !== user?.email) // Exclude current user
            .map((emp) => ({
              id: emp.email, // Use email as ID
              email: emp.email,
              name: emp.name,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                emp.name
              )}`,
            }));

          // Also try to get users (for admins) - only if user is admin
          if (user?.role === "admin") {
            try {
              const allUsers = await apiService.getUsers();
              if (Array.isArray(allUsers)) {
                allUsers.forEach((u) => {
                  if (
                    u.email !== user?.email &&
                    !usersData.find((ud) => ud.email === u.email)
                  ) {
                    usersData.push({
                      id: u.email,
                      email: u.email,
                      name: u.name,
                      avatar:
                        u.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.name
                        )}`,
                    });
                  }
                });
              }
            } catch (userError) {
              console.error("Error loading users:", userError);
              // Don't show error toast for this, as employees endpoint might be sufficient
            }
          }
        } catch (error) {
          console.error("Error loading employees:", error);
          toast.error("Failed to load users");
        }
        setAvailableUsers(usersData);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [isNewConversationDialogOpen, user?.id, user?.email, user?.role]);

  // Handle starting a new conversation
  const handleStartNewConversation = (selectedUser) => {
    if (!selectedUser) return;

    // Check if conversation already exists
    const existingConversation = conversations.find(
      (conv) => conv.id === selectedUser.id
    );

    if (existingConversation) {
      // Open existing conversation
      setActiveConversation({
        id: existingConversation.id,
        type: "direct",
        name: existingConversation.name,
      });
      setIsNewConversationDialogOpen(false);
      toast.info("Opened existing conversation");
    } else {
      // Create new conversation
      const newConversation = {
        id: selectedUser.email || selectedUser.id,
        email: selectedUser.email || selectedUser.id,
        name: selectedUser.name,
        lastMessage: "No messages yet",
        timestamp: new Date().toISOString(),
        unread: 0,
        online: false,
        avatar: selectedUser.avatar,
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation({
        id: selectedUser.email || selectedUser.id,
        email: selectedUser.email || selectedUser.id,
        type: "direct",
        name: selectedUser.name,
      });
      setIsNewConversationDialogOpen(false);
      setActiveTab("direct");
      toast.success(`Started conversation with ${selectedUser.name}`);
    }
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter((conv) =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Filter available users by search query
  const filteredAvailableUsers = userSearchQuery
    ? availableUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
      )
    : availableUsers;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Communication</h1>
        <p className="text-muted-foreground">
          Chat with your team members and departments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="px-4 space-y-3">
            <div className="flex justify-between items-center">
              <CardTitle>Messages</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (activeTab === "direct" && user?.email) {
                      try {
                        setIsLoadingConversations(true);
                        const conversationsData =
                          await apiService.getConversations();
                        const transformedConversations = conversationsData.map(
                          (conv) => ({
                            id: conv.email,
                            email: conv.email,
                            name: conv.name,
                            lastMessage: conv.lastMessage || "No messages yet",
                            timestamp:
                              conv.lastMessageTime || new Date().toISOString(),
                            unread: conv.unread || 0,
                            online: false,
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              conv.name
                            )}`,
                          })
                        );
                        setConversations(transformedConversations);
                        toast.success("Conversations refreshed");
                      } catch (error) {
                        console.error("Error refreshing conversations:", error);
                        toast.error("Failed to refresh conversations");
                      } finally {
                        setIsLoadingConversations(false);
                      }
                    }
                  }}
                  title="Refresh"
                  disabled={isLoadingConversations}>
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoadingConversations ? "animate-spin" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNewConversationDialogOpen(true)}
                  title="New Conversation">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs
              defaultValue="direct"
              onValueChange={(value) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Direct</span>
                </TabsTrigger>
                <TabsTrigger
                  value="channels"
                  className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Channels</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-3 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Loading conversations...
                    </p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No conversations</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No results found"
                      : "Start a new conversation"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation, index) => (
                  <div
                    key={`${conversation.id}-${conversation.email || index}`}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${
                      activeConversation?.id === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => {
                      setActiveConversation({
                        id: conversation.id,
                        email:
                          conversation.email ||
                          (activeTab === "direct" ? conversation.id : null),
                        type: activeTab,
                        name: conversation.name,
                      });
                      // Update URL to reflect the selected conversation
                      if (activeTab === "direct" && conversation.email) {
                        setSearchParams({ conversation: conversation.email });
                      } else if (activeTab === "channels") {
                        setSearchParams({ channel: conversation.id });
                      } else {
                        setSearchParams({});
                      }
                    }}>
                    <div className="relative">
                      {activeTab === "direct" ? (
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>
                            {conversation.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                          <span className="text-sm font-medium">
                            #{conversation.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.online && activeTab === "direct" && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-medium truncate">
                          {activeTab === "direct"
                            ? conversation.name
                            : `#${conversation.name}`}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(conversation.timestamp), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {activeConversation ? (
            <>
              <CardHeader className="px-6 py-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  {activeConversation.type === "direct" ? (
                    <>
                      <Avatar>
                        <AvatarImage
                          src={
                            users.find((u) => u.id === activeConversation.id)
                              ?.avatar
                          }
                        />
                        <AvatarFallback>
                          {activeConversation.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {activeConversation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {conversations.find(
                            (c) => c.id === activeConversation.id
                          )?.online
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                        <span className="text-sm font-medium">
                          #{activeConversation.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          #{activeConversation.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {conversations.find(
                            (c) => c.id === activeConversation.id
                          )?.description ||
                            `${activeConversation.name} department channel`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  {activeConversation.type === "direct" && (
                    <>
                      <Button variant="ghost" size="icon" title="Call">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Video call">
                        <Video className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" title="Info">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">
                          Loading messages...
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isCurrentUser =
                        msg.senderEmail === user?.email ||
                        msg.senderId === user?.id;
                      const sender = getSenderInfo(
                        msg.senderEmail || msg.senderId
                      );

                      // Check for date change
                      const showDateDivider =
                        index === 0 ||
                        format(
                          parseISO(messages[index - 1].timestamp),
                          "yyyy-MM-dd"
                        ) !== format(parseISO(msg.timestamp), "yyyy-MM-dd");

                      return (
                        <div
                          key={`msg-${msg.id}-${index}`}
                          className="space-y-4">
                          {showDateDivider && (
                            <div className="flex justify-center">
                              <Badge
                                variant="outline"
                                className="bg-background">
                                {format(
                                  parseISO(msg.timestamp),
                                  "MMMM d, yyyy"
                                )}
                              </Badge>
                            </div>
                          )}
                          <div
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}>
                            <div
                              className={`flex gap-2 max-w-[80%] ${
                                isCurrentUser ? "flex-row-reverse" : ""
                              }`}>
                              {!isCurrentUser &&
                                activeConversation.type === "channel" && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={sender.avatar} />
                                    <AvatarFallback>
                                      {sender.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              <div
                                className={`space-y-1 ${
                                  isCurrentUser ? "items-end" : "items-start"
                                }`}>
                                {!isCurrentUser &&
                                  activeConversation.type === "channel" && (
                                    <p className="text-xs font-medium">
                                      {sender.name}
                                    </p>
                                  )}
                                <div
                                  className={`rounded-lg px-4 py-2 inline-block ${
                                    isCurrentUser
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                {msg.attachments &&
                                  msg.attachments.length > 0 && (
                                    <div className="flex gap-2 mt-1">
                                      {msg.attachments.map(
                                        (attachment, attIdx) => (
                                          <div
                                            key={`attachment-${
                                              attachment.id || attIdx
                                            }-${msg.id}`}
                                            className={`rounded-md p-2 flex items-center gap-2 text-xs ${
                                              isCurrentUser
                                                ? "bg-primary/80 text-primary-foreground"
                                                : "bg-muted/80"
                                            }`}>
                                            <FileText className="h-4 w-4" />
                                            <span className="truncate max-w-[150px]">
                                              {attachment.name}
                                            </span>
                                            <ChevronRight className="h-3 w-3" />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                <p
                                  className={`text-xs text-muted-foreground ${
                                    isCurrentUser ? "text-right" : "text-left"
                                  }`}>
                                  {formatMessageDate(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="flex items-center gap-2 w-full">
                  <Button variant="outline" size="icon" title="Attach file">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder={`Message ${
                      activeConversation.type === "direct"
                        ? activeConversation.name
                        : "#" + activeConversation.name
                    }`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!message.trim() || isSendingMessage}
                    onClick={handleSendMessage}>
                    {isSendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold">No conversation selected</h2>
              <p className="text-muted-foreground max-w-md mt-2">
                Select a conversation from the sidebar to start chatting or
                create a new one.
              </p>
              <Button
                className="mt-6"
                onClick={() => setIsNewConversationDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Conversation
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <Dialog
        open={isNewConversationDialogOpen}
        onOpenChange={setIsNewConversationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select a team member to start a new conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Loading users...
                  </p>
                </div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {userSearchQuery ? "No users found" : "No users available"}
                  </p>
                </div>
              ) : (
                filteredAvailableUsers.map((availableUser, userIdx) => (
                  <div
                    key={`user-${
                      availableUser.id || availableUser.email || userIdx
                    }`}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleStartNewConversation(availableUser)}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={availableUser.avatar} />
                      <AvatarFallback>
                        {availableUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {availableUser.name}
                      </h4>
                      {availableUser.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {availableUser.email}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
