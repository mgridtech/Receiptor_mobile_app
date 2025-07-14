package com.receiptor;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.facebook.react.ReactActivity;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Locale;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private TextToSpeech tts;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d("MyFirebaseService", "Message received");

        String title = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getTitle() : "";
        String body = remoteMessage.getNotification() != null ? remoteMessage.getNotification().getBody() : "";

        showNotification(title, body);
        speakMessage(body);
    }

    private void speakMessage(String message) {
        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
                tts.setSpeechRate(0.9f);
                tts.speak(message, TextToSpeech.QUEUE_FLUSH, null, "NOTIF_TTS");
            } else {
                Log.e("MyFirebaseService", "TTS init failed");
            }
        });
    }

    private void showNotification(String title, String body) {
        String channelId = "default_channel";
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.getNotificationChannel(channelId) == null) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Default Channel",
                    NotificationManager.IMPORTANCE_HIGH
            );
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            channel.setSound(null, attributes);
            manager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, ReactActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        manager.notify(0, builder.build());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }
}
