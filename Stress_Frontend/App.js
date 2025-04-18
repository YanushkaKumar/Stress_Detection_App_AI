import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import SplashScreen from './SplashScreen';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [sound, setSound] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [audioName, setAudioName] = useState('No file selected');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [timerInterval, setTimerInterval] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState('');
  const [progress, setProgress] = useState(0);
  // Add this state to control splash screen visibility
  const [showSplash, setShowSplash] = useState(true);

  // Initialize audio playback settings when app loads
  useEffect(() => {
    setupAudio();
    return () => {
      unloadAudio();
      stopRecording();
    };
  }, []);

  const setupAudio = async () => {
    try {
      // Configure audio mode for optimal playback and recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error("Error setting up audio mode:", error);
    }
  };

  // Cleanup function for audio resources
  const unloadAudio = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error unloading sound:", error);
      }
    }
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    }
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
    }
  };

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // Use Audio.requestPermissionsAsync() instead of expo-permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please allow microphone access to use audio features.');
        }
      }
    })();
  }, []);

  // Function to handle splash screen completion
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // NEW FUNCTION: Start recording audio
  const startRecording = async () => {
    try {
      // Make sure we have permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to record audio.');
        return;
      }

      // Make sure no audio is playing
      if (sound) {
        await stopSound();
      }

      console.log('Starting recording...');
      // Prepare the recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      // Create the recording object with high quality settings
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      
      // Start a timer to track recording duration
      setRecordingDuration(0);
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      // Reset any previous analysis results
      setPredictionResult('');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // NEW FUNCTION: Stop recording and save the file
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      
      // Clear the recording timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      // Get the recording URI
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      // Generate a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.m4a`;
      
      // Set the recording as the current audio
      setAudioUri(uri);
      setAudioName(fileName);
      
      // Get duration of audio file
      try {
        const { sound: tempSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );
        
        const status = await tempSound.getStatusAsync();
        if (status.isLoaded) {
          const totalSeconds = Math.floor(status.durationMillis / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
        
        await tempSound.unloadAsync();
      } catch (err) {
        console.error("Error getting audio duration:", err);
        // If we can't get duration from the file, use the timer
        const minutes = Math.floor(recordingDuration / 60);
        const seconds = recordingDuration % 60;
        setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
      
      // Reset recording state
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Reset audio playback
      setProgress(0);
      setTimer("00:00");
      
      // Return to playback mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
      
      // Reset recording state in case of error
      setRecording(null);
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  // Function to format the recording duration
  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to pick an audio file with improved error handling
  const pickAudio = async () => {
    // If currently recording, stop recording first
    if (isRecording) {
      await stopRecording();
    }
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      console.log("Document picker result:", result); // Debug logging

      // Check the structure of the result
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        // New DocumentPicker API structure
        const selectedFile = result.assets[0];
        
        // Unload any existing audio before loading new one
        if (sound) {
          await stopSound();
        }
        
        console.log("Selected file URI:", selectedFile.uri); // Debug logging
        setAudioUri(selectedFile.uri);
        setAudioName(selectedFile.name || "Selected audio");
        
        // Reset play state and timer when new file is selected
        setProgress(0);
        setPredictionResult('');

        // Get duration of audio file
        try {
          const { sound: tempSound } = await Audio.Sound.createAsync(
            { uri: selectedFile.uri },
            { shouldPlay: false }
          );
          
          const status = await tempSound.getStatusAsync();
          if (status.isLoaded) {
            const totalSeconds = Math.floor(status.durationMillis / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
          
          await tempSound.unloadAsync();
        } catch (err) {
          console.error("Error getting audio duration:", err);
          Alert.alert("File Error", "Could not determine audio duration. The file may be corrupted.");
        }
      } 
      // For backwards compatibility with older versions of expo-document-picker
      else if (result.type === 'success') {
        // Unload any existing audio before loading new one
        if (sound) {
          await stopSound();
        }
        
        console.log("Selected file URI (legacy):", result.uri); // Debug logging
        setAudioUri(result.uri);
        setAudioName(result.name || "Selected audio");
        
        // Reset play state and timer when new file is selected
        setProgress(0);
        setPredictionResult('');

        // Get duration of audio file
        try {
          const { sound: tempSound } = await Audio.Sound.createAsync(
            { uri: result.uri },
            { shouldPlay: false }
          );
          
          const status = await tempSound.getStatusAsync();
          if (status.isLoaded) {
            const totalSeconds = Math.floor(status.durationMillis / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
          
          await tempSound.unloadAsync();
        } catch (err) {
          console.error("Error getting audio duration:", err);
          Alert.alert("File Error", "Could not determine audio duration. The file may be corrupted.");
        }
      } else {
        console.log("File selection cancelled or failed");
      }
    } catch (err) {
      console.error("File selection error:", err);
      Alert.alert(
        "File Selection Error", 
        "Failed to pick audio file. Please try again with a different file format.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  // Function to play the audio with improved error handling
  const playAudio = async () => {
    console.log("Play button pressed, audioUri:", audioUri); // Debug logging
    
    try {
      if (isPlaying) {
        // If already playing, pause it
        if (sound) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
        return;
      }

      if (!audioUri) {
        Alert.alert("No Audio Selected", "Please upload or record an audio file first");
        return;
      }

      // If sound is already loaded but paused, resume playback
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
          return;
        } else {
          // If sound exists but not loaded properly, unload it
          await sound.unloadAsync();
          setSound(null);
        }
      }

      console.log("Creating new sound with URI:", audioUri); // Debug logging
      
      // Create and load a new sound object with explicit options
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { 
            shouldPlay: true,
            volume: 1.0,
            isLooping: false,
            progressUpdateIntervalMillis: 100, // Update more frequently
          },
          onPlaybackStatusUpdate
        );
        
        console.log("Sound created successfully"); // Debug logging
        setSound(newSound);
        setIsPlaying(true);
        
        // Ensure playback starts (sometimes needed on Android)
        await newSound.playAsync();
      } catch (error) {
        console.error("Sound creation error:", error);
        Alert.alert("Playback Error", "Failed to load audio file. Please try another file or format.");
      }
      
    } catch (error) {
      console.error("Playback error:", error);
      Alert.alert("Playback Error", "Failed to play audio. The file might be corrupted or in an unsupported format.");
    }
  };

  // Monitor playback status updates with improved progress tracking
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        setTimer("00:00");
        setProgress(0);
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      } else if (status.isPlaying) {
        // Calculate position and progress
        const durationMillis = status.durationMillis || 0;
        const positionMillis = status.positionMillis || 0;
        
        // Update progress bar (0-1 range)
        setProgress(durationMillis > 0 ? positionMillis / durationMillis : 0);
        
        // Convert to minutes and seconds
        const totalSeconds = Math.floor(positionMillis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        setTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    } else if (status.error) {
      console.error(`Playback error: ${status.error}`);
      Alert.alert("Playback Error", "An error occurred during playback.");
    }
  };

  // Stop sound playback with improved error handling
  const stopSound = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
        }
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
      setSound(null);
    }
    setIsPlaying(false);
    setTimer("00:00");
    setProgress(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Upload audio to server with improved error handling and feedback
  const uploadAudio = async () => {
    if (!audioUri) {
      Alert.alert("No Audio Selected", "Please upload or record an audio file first");
      return;
    }

    setLoading(true);
    setPredictionResult('');

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      console.log("File info:", fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error("File does not exist at the specified URI");
      }

      // Prepare form data with the correct file type
      const formData = new FormData();
      
      // Get the file extension
      const uriParts = audioUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      // Determine MIME type based on extension
      let fileType = 'audio/mp3';  // Default
      if (fileExtension === 'wav') fileType = 'audio/wav';
      else if (fileExtension === 'm4a') fileType = 'audio/m4a';
      else if (fileExtension === 'aac') fileType = 'audio/aac';
      
      console.log(`Uploading file with type: ${fileType}`);
      
      // Append file to form data with correct mime type
      formData.append('file', {
        uri: audioUri,
        name: audioName || `audio.${fileExtension}`,
        type: fileType
      });

      // Show upload progress indicator
      let timeout = setTimeout(() => {
        // If taking too long, show a more detailed message
        if (loading) {
          Alert.alert(
            "Processing",
            "Analysis is taking longer than expected. Please wait...",
            [{ text: "OK", style: "default" }]
          );
        }
      }, 10000);

      console.log("Sending request to server...");
      
      // Make sure to update this URL to your actual server address
      const serverUrl = 'http://10.76.164.94:5000/predict';
      console.log(`Sending request to: ${serverUrl}`);
      
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
      });

      clearTimeout(timeout);
      
      console.log("Response status:", response.status);
      
      // Get response as text first for debugging
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (response.ok) {
        if (data.prediction) {
          setPredictionResult(data.prediction);
          console.log("Prediction result:", data.prediction);
        } else if (data.error) {
          throw new Error(`Server error: ${data.error}`);
        } else {
          throw new Error("No prediction in response");
        }
      } else {
        throw new Error(`Server returned ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      
      // Provide more helpful error messages based on common issues
      if (error.message.includes("Network request failed")) {
        Alert.alert(
          "Connection Error", 
          "Cannot connect to the server. Please check your internet connection and server status.",
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert(
          "Upload Error", 
          `Failed to analyze audio: ${error.message}`,
          [{ text: "OK", style: "default" }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if we should show splash screen or main app
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Return the main app UI when splash screen is finished
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      
      <Text style={styles.title}>Stress Analyzer</Text>
      
      {/* Recording UI */}
      <View style={styles.recordingContainer}>
        <TouchableOpacity 
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.recordButton, isRecording && styles.recordingActiveButton]}
        >
          <Text style={styles.recordButtonIcon}>{isRecording ? '■' : '●'}</Text>
          <Text style={styles.recordButtonText}>
            {isRecording ? `Stop (${formatRecordingTime(recordingDuration)})` : 'Record Audio'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.fileInfoContainer}>
        <View style={styles.fileIconContainer}>
          <Text style={styles.fileIcon}>🎵</Text>
        </View>
        <View style={styles.fileTextContainer}>
          <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
            {audioName}
          </Text>
          <Text style={styles.durationText}>Duration: {duration}</Text>
        </View>
      </View>
      
      <View style={styles.playerContainer}>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={playAudio} style={styles.playButton}>
            <Text style={styles.playButtonText}>{isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>
          <Text style={styles.timerText}>{timer} / {duration}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pickAudio} style={styles.button}>
          <Text style={styles.buttonText}>Select Audio File</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={uploadAudio} 
          style={[
            styles.button, 
            styles.primaryButton, 
            (!audioUri || loading) && styles.disabledButton
          ]}
          disabled={!audioUri || loading}
        >
          <Text style={[
            styles.buttonText, 
            styles.primaryButtonText,
            (!audioUri || loading) && styles.disabledButtonText
          ]}>
            Analyze Audio
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6fa5" />
          <Text style={styles.loadingText}>Analyzing audio...</Text>
        </View>
      )}
      
      {predictionResult !== '' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result:</Text>
          <Text style={styles.resultText}>{predictionResult}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 40,
    marginBottom: 30,
    textAlign: 'center',
  },
  recordingContainer: {
    marginBottom: 20,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  recordingActiveButton: {
    backgroundColor: '#ff6b6b',
  },
  recordButtonIcon: {
    color: '#e74c3c',
    fontSize: 18,
    marginRight: 10,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9f0f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileTextContainer: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  playerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e6e8eb',
    borderRadius: 3,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4a6fa5',
    borderRadius: 3,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a6fa5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
  },
  timerText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a6fa5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryButton: {
    backgroundColor: '#4a6fa5',
    borderWidth: 0,
  },
  disabledButton: {
    backgroundColor: '#d1d8e0',
    borderColor: '#d1d8e0',
  },
  buttonText: {
    color: '#4a6fa5',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#a5b1c2',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#4a6fa5',
    fontSize: 14,
  },
  resultContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
});