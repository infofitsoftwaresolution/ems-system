import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Bell,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Save,
  Upload,
  ChevronRight,
  Clock,
  Smartphone,
  Globe,
  AlertCircle,
  Monitor,
  LogOut,
  X,
  Copy,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { getAvatarUrl } from "@/lib/imageUtils";

// Comprehensive timezone list
const TIMEZONES = [
  { value: "america-los_angeles", label: "Pacific Time (US & Canada)" },
  { value: "america-denver", label: "Mountain Time (US & Canada)" },
  { value: "america-chicago", label: "Central Time (US & Canada)" },
  { value: "america-new_york", label: "Eastern Time (US & Canada)" },
  { value: "america/phoenix", label: "Arizona" },
  { value: "america/anchorage", label: "Alaska" },
  { value: "pacific/honolulu", label: "Hawaii" },
  { value: "america/toronto", label: "Toronto" },
  { value: "america/vancouver", label: "Vancouver" },
  { value: "america/mexico_city", label: "Mexico City" },
  { value: "america/sao_paulo", label: "São Paulo" },
  { value: "america/buenos_aires", label: "Buenos Aires" },
  { value: "europe/london", label: "London" },
  { value: "europe/paris", label: "Paris" },
  { value: "europe/berlin", label: "Berlin" },
  { value: "europe/rome", label: "Rome" },
  { value: "europe/madrid", label: "Madrid" },
  { value: "europe/amsterdam", label: "Amsterdam" },
  { value: "europe/stockholm", label: "Stockholm" },
  { value: "europe/moscow", label: "Moscow" },
  { value: "asia/dubai", label: "Dubai" },
  { value: "asia/kolkata", label: "Mumbai, Kolkata, New Delhi" },
  { value: "asia/dhaka", label: "Dhaka" },
  { value: "asia/bangkok", label: "Bangkok" },
  { value: "asia/singapore", label: "Singapore" },
  { value: "asia/hong_kong", label: "Hong Kong" },
  { value: "asia/shanghai", label: "Shanghai" },
  { value: "asia/tokyo", label: "Tokyo" },
  { value: "asia/seoul", label: "Seoul" },
  { value: "australia/sydney", label: "Sydney" },
  { value: "australia/melbourne", label: "Melbourne" },
  { value: "pacific/auckland", label: "Auckland" },
];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState({});
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render of image
  const [sessions, setSessions] = useState([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false, isSetup: false });
  const [twoFactorSetup, setTwoFactorSetup] = useState(null); // { qrCodeUrl, secret, backupCodes }
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");

  // Profile settings state
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    language: "english",
    timezone: "america-los_angeles",
  });

  // Password settings state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    mentionAlerts: true,
    taskReminders: true,
    trainingUpdates: false,
    employeeUpdates: true,
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    rememberDevices: true,
    loginAlerts: true,
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await apiService.getUserProfile();
        setProfile({
          name: profileData.name || user?.name || "",
          email: profileData.email || user?.email || "",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
          language: profileData.language || "english",
          timezone: profileData.timezone || "america-los_angeles",
        });
        if (profileData.avatar) {
          setAvatarUrl(profileData.avatar);
          setAvatarKey(prev => prev + 1); // Force refresh
        } else {
          setAvatarUrl(null);
        }

        // Load notification settings
        if (
          profileData.notificationSettings &&
          Object.keys(profileData.notificationSettings).length > 0
        ) {
          setNotificationSettings({
            emailNotifications:
              profileData.notificationSettings.emailNotifications ?? true,
            pushNotifications:
              profileData.notificationSettings.pushNotifications ?? true,
            weeklyDigest: profileData.notificationSettings.weeklyDigest ?? true,
            mentionAlerts:
              profileData.notificationSettings.mentionAlerts ?? true,
            taskReminders:
              profileData.notificationSettings.taskReminders ?? true,
            trainingUpdates:
              profileData.notificationSettings.trainingUpdates ?? false,
            employeeUpdates:
              profileData.notificationSettings.employeeUpdates ?? true,
          });
        }

        // Load security settings
        if (
          profileData.securitySettings &&
          Object.keys(profileData.securitySettings).length > 0
        ) {
          setSecuritySettings({
            twoFactor: profileData.securitySettings.twoFactor ?? false,
            sessionTimeout: profileData.securitySettings.sessionTimeout || "30",
            rememberDevices:
              profileData.securitySettings.rememberDevices ?? true,
            loginAlerts: profileData.securitySettings.loginAlerts ?? true,
          });
        }

        // Load active sessions
        await loadSessions();

        // Load 2FA status
        await loadTwoFactorStatus();
      } catch (error) {
        console.error("Error loading profile:", error);
        sonnerToast.error("Failed to load profile data");
      }
    };

    if (user?.email) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Load active sessions
  const loadSessions = async () => {
    try {
      const response = await apiService.getMySessions();
      if (response.success) {
        setSessions(response.sessions || []);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  // Load 2FA status
  const loadTwoFactorStatus = async () => {
    try {
      const response = await apiService.getTwoFactorStatus();
      if (response.success) {
        setTwoFactorStatus({
          enabled: response.twoFactorEnabled || false,
          isSetup: response.isSetup || false,
        });
        setSecuritySettings((prev) => ({
          ...prev,
          twoFactor: response.twoFactorEnabled || false,
        }));
      }
    } catch (error) {
      console.error("Error loading 2FA status:", error);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      sonnerToast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      sonnerToast.error("Image size must be less than 5MB");
      return;
    }

    setLoading({ ...loading, avatar: true });
    try {
      const result = await apiService.uploadAvatar(file);
      if (result.success && result.avatar) {
        // Update avatar URL and force image refresh
        const newAvatarUrl = result.avatar;
        setAvatarUrl(newAvatarUrl);
        setAvatarKey(prev => prev + 1); // Force re-render
        
        // Update user context to refresh avatar in header/profile
        if (user && refreshUser) {
          try {
            // Refresh user data in auth context to update avatar everywhere
            await refreshUser();
            
            // Also reload profile data for local state
            const profileData = await apiService.getUserProfile();
            if (profileData.avatar) {
              setAvatarUrl(profileData.avatar);
              setAvatarKey(prev => prev + 1);
            }
          } catch (profileError) {
            console.error("Error refreshing user data:", profileError);
            // Continue with the uploaded avatar URL
          }
        }
        sonnerToast.success("Avatar uploaded successfully");
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      sonnerToast.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading({ ...loading, avatar: false });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle avatar remove
  const handleAvatarRemove = async () => {
    setLoading({ ...loading, avatar: true });
    try {
      await apiService.removeAvatar();
      setAvatarUrl(null);
      setAvatarKey(prev => prev + 1); // Force refresh
      
      // Refresh user context to update avatar in header/profile
      if (refreshUser) {
        await refreshUser();
      }
      
      sonnerToast.success("Avatar removed successfully");
    } catch (error) {
      console.error("Error removing avatar:", error);
      sonnerToast.error(error.message || "Failed to remove avatar");
    } finally {
      setLoading({ ...loading, avatar: false });
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!profile.name.trim()) {
      setErrors({ ...errors, profile: "Name cannot be empty" });
      return;
    }

    setLoading({ ...loading, profile: true });
    try {
      await apiService.updateUserProfile(user?.email, {
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
        language: profile.language,
        timezone: profile.timezone,
      });

      setErrors({ ...errors, profile: undefined });
      sonnerToast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({
        ...errors,
        profile: error.message || "Failed to update profile",
      });
      sonnerToast.error(error.message || "Failed to update profile");
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    const passwordErrors = {};

    if (!passwordForm.currentPassword) {
      passwordErrors.current = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      passwordErrors.new = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      passwordErrors.new = "Password must be at least 8 characters";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordErrors.confirm = "Passwords do not match";
    }

    if (Object.keys(passwordErrors).length > 0) {
      setErrors({ ...errors, password: passwordErrors });
      return;
    }

    setLoading({ ...loading, password: true });
    try {
      await apiService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setErrors({ ...errors, password: undefined });

      // Clear password fields
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      sonnerToast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage = error.message || "Failed to update password";
      if (errorMessage.includes("Current password")) {
        setErrors({ ...errors, password: { current: errorMessage } });
      } else {
        setErrors({ ...errors, password: { new: errorMessage } });
      }
      sonnerToast.error(errorMessage);
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  // Handle notification settings update
  const handleNotificationUpdate = async () => {
    setLoading({ ...loading, notifications: true });
    try {
      await apiService.updateUserProfile(user?.email, {
        notificationSettings: notificationSettings,
      });
      sonnerToast.success("Notification preferences saved");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      sonnerToast.error(
        error.message || "Failed to save notification settings"
      );
    } finally {
      setLoading({ ...loading, notifications: false });
    }
  };

  // Handle security settings update
  const handleSecurityUpdate = async () => {
    setLoading({ ...loading, security: true });
    try {
      await apiService.updateUserProfile(user?.email, {
        securitySettings: securitySettings,
      });
      sonnerToast.success("Security settings updated");
    } catch (error) {
      console.error("Error updating security settings:", error);
      sonnerToast.error(error.message || "Failed to save security settings");
    } finally {
      setLoading({ ...loading, security: false });
    }
  };

  // Setup two-factor auth
  const handleSetupTwoFactor = async () => {
    setLoading({ ...loading, twoFactor: true });
    try {
      const response = await apiService.setupTwoFactor();
      if (response.success) {
        setTwoFactorSetup({
          qrCodeUrl: response.qrCodeUrl,
          secret: response.secret,
          backupCodes: response.backupCodes,
        });
        setShow2FASetup(true);
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      sonnerToast.error(error.message || "Failed to setup 2FA");
    } finally {
      setLoading({ ...loading, twoFactor: false });
    }
  };

  // Verify and enable 2FA
  const handleVerifyTwoFactor = async () => {
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      sonnerToast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading({ ...loading, twoFactor: true });
    try {
      const response = await apiService.verifyTwoFactor(
        twoFactorToken,
        twoFactorSetup?.backupCodes
      );
      if (response.success) {
        setTwoFactorStatus({ enabled: true, isSetup: true });
        setSecuritySettings({ ...securitySettings, twoFactor: true });
        setShow2FASetup(false);
        setTwoFactorToken("");
        setTwoFactorSetup(null);
        sonnerToast.success("Two-factor authentication enabled successfully");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      sonnerToast.error(error.message || "Invalid verification code");
    } finally {
      setLoading({ ...loading, twoFactor: false });
    }
  };

  // Disable two-factor auth
  const handleDisableTwoFactor = async () => {
    setLoading({ ...loading, twoFactor: true });
    try {
      const response = await apiService.disableTwoFactor();
      if (response.success) {
        setTwoFactorStatus({ enabled: false, isSetup: false });
        setSecuritySettings({ ...securitySettings, twoFactor: false });
        sonnerToast.success("Two-factor authentication disabled");
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      sonnerToast.error(error.message || "Failed to disable 2FA");
    } finally {
      setLoading({ ...loading, twoFactor: false });
    }
  };

  // Revoke session
  const handleRevokeSession = async (sessionId) => {
    setLoading({ ...loading, [`session-${sessionId}`]: true });
    try {
      const response = await apiService.revokeSession(sessionId);
      if (response.success) {
        await loadSessions();
        sonnerToast.success("Session revoked successfully");
      }
    } catch (error) {
      console.error("Error revoking session:", error);
      sonnerToast.error(error.message || "Failed to revoke session");
    } finally {
      setLoading({ ...loading, [`session-${sessionId}`]: false });
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    setLoading({ ...loading, revokeAll: true });
    try {
      const response = await apiService.revokeAllOtherSessions();
      if (response.success) {
        await loadSessions();
        sonnerToast.success("All other sessions revoked successfully");
      }
    } catch (error) {
      console.error("Error revoking sessions:", error);
      sonnerToast.error(error.message || "Failed to revoke sessions");
    } finally {
      setLoading({ ...loading, revokeAll: false });
    }
  };

  // Reset security settings
  const handleResetSecuritySettings = async () => {
    if (!confirm("Are you sure you want to reset all security settings to defaults?")) {
      return;
    }

    setLoading({ ...loading, resetSecurity: true });
    try {
      await apiService.resetSecuritySettings();
      setSecuritySettings({
        twoFactor: false,
        sessionTimeout: "30",
        rememberDevices: true,
        loginAlerts: true,
      });
      await loadTwoFactorStatus();
      sonnerToast.success("Security settings reset to defaults");
    } catch (error) {
      console.error("Error resetting security settings:", error);
      sonnerToast.error(error.message || "Failed to reset security settings");
    } finally {
      setLoading({ ...loading, resetSecurity: false });
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    if (twoFactorSetup?.backupCodes) {
      const codesText = twoFactorSetup.backupCodes.join("\n");
      navigator.clipboard.writeText(codesText);
      sonnerToast.success("Backup codes copied to clipboard");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get device icon
  const getDeviceIcon = (deviceInfo) => {
    if (deviceInfo?.device === "Mobile") return <Smartphone className="h-4 w-4" />;
    if (deviceInfo?.device === "Tablet") return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden md:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    key={avatarKey}
                    src={getAvatarUrl(avatarUrl, avatarKey > 0 ? Date.now() : null)}
                    alt={profile.name || "User avatar"}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Avatar image failed to load:", {
                        avatarUrl,
                        fullUrl: getAvatarUrl(avatarUrl),
                        error: e
                      });
                      // Hide broken image and show fallback
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log("Avatar image loaded successfully:", {
                        avatarUrl,
                        fullUrl: getAvatarUrl(avatarUrl)
                      });
                    }}
                  />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {profile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading.avatar}>
                    {loading.avatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Change
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarRemove}
                    disabled={loading.avatar || !avatarUrl}>
                    Remove
                  </Button>
                </div>
              </div>

              <Separator />

              {errors.profile && (
                <Alert variant="destructive" autoDismiss={true}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.profile}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      disabled={user?.role !== "admin"}
                      className={user?.role !== "admin" ? "bg-muted" : ""}
                    />
                    {user?.role !== "admin" && (
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact an administrator.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profile.language}
                      onValueChange={(value) =>
                        setProfile({ ...profile, language: value })
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Brief description for your profile. URLs are hyperlinked.
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) =>
                      setProfile({ ...profile, timezone: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleProfileUpdate} disabled={loading.profile}>
                {loading.profile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password or enable additional security options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5">
                <div className="grid gap-1.5">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          current: !showPassword.current,
                        })
                      }>
                      {showPassword.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password?.current && (
                    <p className="text-sm text-destructive">
                      {errors.password.current}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          new: !showPassword.new,
                        })
                      }>
                      {showPassword.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password?.new && (
                    <p className="text-sm text-destructive">
                      {errors.password.new}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters and include a number
                    or special character.
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          confirm: !showPassword.confirm,
                        })
                      }>
                      {showPassword.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password?.confirm && (
                    <p className="text-sm text-destructive">
                      {errors.password.confirm}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handlePasswordUpdate}
                disabled={loading.password}>
                {loading.password ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a summary of activities every week
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyDigest: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-base">@Mention Alerts</Label>
                      <Badge>Real-time</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.mentionAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        mentionAlerts: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about upcoming and overdue tasks
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        taskReminders: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Training Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about new courses and certifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.trainingUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        trainingUpdates: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Employee Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about new employees, status changes, etc.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.employeeUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        employeeUpdates: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleNotificationUpdate}
                disabled={loading.notifications}>
                {loading.notifications ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage account security and session preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-base">
                        Two-Factor Authentication
                      </Label>
                      {twoFactorStatus.enabled && (
                        <Badge className="bg-green-600">Enabled</Badge>
                      )}
                      {!twoFactorStatus.enabled && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 bg-amber-50 border-amber-200">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorStatus.enabled
                        ? "2FA is enabled on your account"
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {twoFactorStatus.enabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisableTwoFactor}
                        disabled={loading.twoFactor}>
                        {loading.twoFactor ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetupTwoFactor}
                        disabled={loading.twoFactor}>
                        {loading.twoFactor ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Setup
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after a period of inactivity
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: value,
                        })
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Remember Devices</Label>
                    <p className="text-sm text-muted-foreground">
                      Stay logged in on trusted devices
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.rememberDevices}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        rememberDevices: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get alerted when someone logs into your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        loginAlerts: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Active Sessions</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRevokeAllOtherSessions}
                        disabled={loading.revokeAll}>
                        {loading.revokeAll ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Revoke All Others
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {sessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active sessions
                      </p>
                    ) : (
                      sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(session.deviceInfo)}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {session.deviceInfo?.browser || "Unknown Browser"} on{" "}
                                  {session.deviceInfo?.os || "Unknown OS"}
                                </p>
                                {session.isCurrent && (
                                  <Badge variant="outline" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {session.ipAddress} • Last active:{" "}
                                {formatDate(session.lastActivity)}
                              </p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={loading[`session-${session.id}`]}>
                              {loading[`session-${session.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                className="flex items-center gap-1 text-destructive"
                onClick={handleResetSecuritySettings}
                disabled={loading.resetSecurity}>
                {loading.resetSecurity ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Reset Security Settings
              </Button>
              <Button
                onClick={handleSecurityUpdate}
                disabled={loading.security}>
                {loading.security ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {twoFactorSetup?.qrCodeUrl && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <img
                    src={twoFactorSetup.qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="2fa-token">Verification Code</Label>
              <Input
                id="2fa-token"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {twoFactorSetup?.backupCodes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBackupCodes}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    Save these codes in a safe place. You can use them to access your account if you lose your device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {twoFactorSetup.backupCodes.map((code, idx) => (
                      <div key={idx} className="p-2 bg-background rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShow2FASetup(false);
                setTwoFactorToken("");
                setTwoFactorSetup(null);
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyTwoFactor}
              disabled={loading.twoFactor || twoFactorToken.length !== 6}>
              {loading.twoFactor ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
