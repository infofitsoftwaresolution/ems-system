# Enhanced Alert Component

The Alert component has been enhanced with auto-dismiss and close button functionality.

## Features

- **Auto-dismiss**: Alerts can automatically disappear after 3 seconds
- **Close button**: Alerts can have a close button for manual dismissal
- **Combined functionality**: Alerts can have both auto-dismiss and close button
- **Callback support**: Optional `onDismiss` callback when alert is dismissed

## Usage

### Basic Alert (no auto-dismiss)

```jsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="default">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your action was completed successfully.</AlertDescription>
</Alert>;
```

### Auto-dismiss Alert (disappears after 3 seconds)

```jsx
<Alert variant="default" autoDismiss={true}>
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>This alert will disappear in 3 seconds.</AlertDescription>
</Alert>
```

### Alert with Close Button

```jsx
<Alert variant="destructive" showCloseButton={true}>
  <AlertTitle>Error!</AlertTitle>
  <AlertDescription>Something went wrong. Click X to dismiss.</AlertDescription>
</Alert>
```

### Alert with Both Auto-dismiss and Close Button

```jsx
<Alert
  variant="default"
  autoDismiss={true}
  showCloseButton={true}
  onDismiss={() => console.log("Alert dismissed")}>
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>
    This alert has both auto-dismiss and close button.
  </AlertDescription>
</Alert>
```

## Props

| Prop              | Type                         | Default     | Description                      |
| ----------------- | ---------------------------- | ----------- | -------------------------------- |
| `variant`         | `"default" \| "destructive"` | `"default"` | Alert variant                    |
| `autoDismiss`     | `boolean`                    | `false`     | Auto-dismiss after 3 seconds     |
| `showCloseButton` | `boolean`                    | `false`     | Show close button                |
| `onDismiss`       | `function`                   | `undefined` | Callback when alert is dismissed |
| `className`       | `string`                     | `undefined` | Additional CSS classes           |

## Examples in the Codebase

- **Login.jsx**: Error alerts with auto-dismiss
- **Settings.jsx**: Error alerts with auto-dismiss, info alerts with close button
- **auto-dismiss-alert.jsx**: Demo component with examples

## Best Practices

1. **Error alerts**: Use `autoDismiss={true}` for temporary error messages
2. **Info alerts**: Use `showCloseButton={true}` for informational messages that users might want to keep visible
3. **Success messages**: Use `autoDismiss={true}` for success confirmations
4. **Important warnings**: Use `showCloseButton={true}` for warnings that require user acknowledgment
