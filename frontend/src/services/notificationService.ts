import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import apiService from './api';

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Configure push notifications
    PushNotification.configure({
      onRegister: async (token) => {
        console.log('Device token:', token);
        try {
          await apiService.registerDeviceToken(token, Platform.OS as 'ios' | 'android');
        } catch (error) {
          console.error('Failed to register device token:', error);
        }
      },

      onNotification: (notification) => {
        console.log('Received notification:', notification);
        // Handle notification tap
        if (notification.userInteraction) {
          // Navigate to specific screen based on notification data
          this.handleNotificationTap(notification);
        }
      },

      onAction: (notification) => {
        console.log('Notification action:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Registration error:', err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'food-expiration',
          channelName: 'Food Expiration Alerts',
          channelDescription: 'Notifications for food items nearing expiration',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }

    this.isInitialized = true;
  }

  private handleNotificationTap(notification: any): void {
    // Handle navigation based on notification data
    const { data } = notification;
    
    if (data?.type === 'expiration_alert') {
      // Navigate to food item details
      // This would be handled by your navigation service
      console.log('Navigate to food item:', data.foodItemId);
    } else if (data?.type === 'recipe_suggestion') {
      // Navigate to recipe suggestions
      console.log('Navigate to recipe suggestions');
    }
  }

  async scheduleExpirationNotification(foodItem: any, daysUntilExpiration: number): Promise<void> {
    const expirationDate = new Date(foodItem.expirationDate);
    const notificationDate = new Date(expirationDate.getTime() - (daysUntilExpiration * 24 * 60 * 60 * 1000));

    // Only schedule if the notification date is in the future
    if (notificationDate > new Date()) {
      PushNotification.localNotificationSchedule({
        channelId: 'food-expiration',
        title: 'Food Expiring Soon!',
        message: `${foodItem.name} expires in ${daysUntilExpiration} day${daysUntilExpiration > 1 ? 's' : ''}`,
        date: notificationDate,
        allowWhileIdle: true,
        repeatType: 'day',
        repeatTime: 1,
        id: `expiration_${foodItem.id}`,
        userInfo: {
          type: 'expiration_alert',
          foodItemId: foodItem.id,
        },
      });
    }
  }

  async cancelExpirationNotification(foodItemId: string): Promise<void> {
    PushNotification.cancelLocalNotifications({ id: `expiration_${foodItemId}` });
  }

  async showRecipeSuggestionNotification(recipe: any): Promise<void> {
    PushNotification.localNotification({
      channelId: 'food-expiration',
      title: 'Recipe Suggestion',
      message: `Try making ${recipe.title} with your expiring ingredients!`,
      userInfo: {
        type: 'recipe_suggestion',
        recipeId: recipe.id,
      },
    });
  }

  async showWasteReportNotification(report: any): Promise<void> {
    PushNotification.localNotification({
      channelId: 'food-expiration',
      title: 'Monthly Waste Report',
      message: `Your food waste score: ${report.wasteScore}% - Keep up the good work!`,
      userInfo: {
        type: 'waste_report',
        month: report.month,
      },
    });
  }

  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then((permissions) => {
        resolve(permissions.alert || false);
      });
    });
  }

  async getBadgeCount(): Promise<number> {
    return new Promise((resolve) => {
      PushNotification.getApplicationIconBadgeNumber((count) => {
        resolve(count);
      });
    });
  }

  async setBadgeCount(count: number): Promise<void> {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  async clearAllNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }
}

export const notificationService = new NotificationService();
export default notificationService;

