import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

/**
 * AutoDismissAlert - A wrapper component that demonstrates auto-dismissing alerts
 * Usage examples:
 *
 * // Auto-dismiss after 3 seconds
 * <AutoDismissAlert
 *   variant="default"
 *   title="Success!"
 *   description="This alert will disappear in 3 seconds"
 *   autoDismiss={true}
 * />
 *
 * // With close button
 * <AutoDismissAlert
 *   variant="destructive"
 *   title="Error!"
 *   description="Something went wrong"
 *   showCloseButton={true}
 * />
 *
 * // Both auto-dismiss and close button
 * <AutoDismissAlert
 *   variant="default"
 *   title="Info"
 *   description="This alert has both auto-dismiss and close button"
 *   autoDismiss={true}
 *   showCloseButton={true}
 * />
 */
export function AutoDismissAlert({
  variant = "default",
  title,
  description,
  autoDismiss = false,
  showCloseButton = false,
  onDismiss,
  className,
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      variant={variant}
      autoDismiss={autoDismiss}
      showCloseButton={showCloseButton}
      onDismiss={handleDismiss}
      className={className}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
    </Alert>
  );
}

/**
 * AlertDemo - Demo component showing different alert types
 */
export function AlertDemo() {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (
    type,
    title,
    description,
    autoDismiss = false,
    showCloseButton = false
  ) => {
    const id = Date.now();
    const newAlert = {
      id,
      type,
      title,
      description,
      autoDismiss,
      showCloseButton,
    };

    setAlerts((prev) => [...prev, newAlert]);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-x-2">
        <Button
          onClick={() =>
            addAlert(
              "default",
              "Success!",
              "This alert will auto-dismiss in 3 seconds",
              true
            )
          }
          variant="default">
          Auto-dismiss Alert
        </Button>

        <Button
          onClick={() =>
            addAlert(
              "destructive",
              "Error!",
              "This alert has a close button",
              false,
              true
            )
          }
          variant="destructive">
          Close Button Alert
        </Button>

        <Button
          onClick={() =>
            addAlert(
              "default",
              "Info",
              "This alert has both auto-dismiss and close button",
              true,
              true
            )
          }
          variant="outline">
          Both Features
        </Button>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <AutoDismissAlert
            key={alert.id}
            variant={alert.type}
            title={alert.title}
            description={alert.description}
            autoDismiss={alert.autoDismiss}
            showCloseButton={alert.showCloseButton}
            onDismiss={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}
