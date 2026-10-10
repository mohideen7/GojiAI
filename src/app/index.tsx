
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const mikuGojiImage = require("../../assets/images/miku_goji.png");
const mikuImage = require("../../assets/images/miku.png");
const gojiraImage = require("../../assets/images/gojira.png");



function ThinkingDots() {
  const animations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    const loops = animations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((loop) => loop.start());

    return () => loops.forEach((loop) => loop.stop());
  }, [animations]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      {animations.map((animation, index) => (
        <Animated.View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#63E8E1",
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [3, -3],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}


export default function HomeScreen() {
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedPdfText, setUploadedPdfText] = useState("");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hey! I'm Goji AI 🤖💙\nWhat can I help you with?",
      sender: "ai",
    },
  ]);

  
const sendMessage = async () => {
  if (!message.trim()) return;

  const userMessage = message.trim();

  setMessages((old) => [
    ...old,
    {
      id: Date.now().toString(),
      text: userMessage,
      sender: "user",
    },
  ]);

  setMessage("");
  setIsThinking(true);

  try {
    const response = await fetch(
      "https://gojiai-1.onrender.com/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          pdfText: uploadedPdfText,
          imageBase64: uploadedImageBase64,
          imageMimeType: uploadedImageMimeType,
        }),
      }
    );

    const responseText = await response.text();

    console.log("Goji HTTP status:", response.status);
    console.log("Goji response body:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Goji returned non-JSON data (HTTP ${response.status}): ${responseText.slice(0, 200)}`
      );
    }

    console.log("Goji server status:", response.status);
    console.log("Goji server response:", data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    setMessages((old) => [
      ...old,
      {
        id: (Date.now() + 1).toString(),
        text: data.reply || "No response from Goji.",
        sender: "ai",
      },
    ]);
  } catch (error: any) {
    console.error("Goji connection error:", error);

    setMessages((old) => [
      ...old,
      {
        id: (Date.now() + 1).toString(),
        text: `Goji error: ${error.message}`,
        sender: "ai",
      },
    ]);
  } finally {
    setIsThinking(false);
  }
};


  const pickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      const selectedFile = result.assets[0];

      setUploadedFile(selectedFile.name);

      let imageBase64: string | null = null;

    if (selectedFile.mimeType?.startsWith("image/")) {
    const imageFile = new File(selectedFile.uri);
    imageBase64 = await imageFile.base64();

    setUploadedImageBase64(imageBase64);
    setUploadedImageMimeType(selectedFile.mimeType);

   console.log("Image converted and saved for Goji Vision");
}

      console.log("Selected file:", selectedFile);

      const file = new File(selectedFile.uri);

      const formData = new FormData();

      formData.append("file", file);

      const response = await expoFetch(
        "https://gojiai-1.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Upload status:", response.status);
      console.log("Upload response:", data);

      if (response.ok) {
  setUploadedFile(selectedFile.name);

  if (selectedFile.mimeType === "application/pdf") {
    setUploadedPdfText(data.text || "");

    console.log(
      "PDF text saved:",
      (data.text || "").length,
      "characters"
    );
  } else if (selectedFile.mimeType?.startsWith("image/")) {
    setUploadedImage(selectedFile.uri);
    console.log("Image saved for Goji Vision");
  }
}
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={gojiraImage}
          style={styles.gojiraHeader}
        />

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Goji AI</Text>

          <Text style={styles.subtitle}>
            Miku × Gojira AI Companion
          </Text>

          <Text style={styles.online}>● Online</Text>
        </View>

        <Image
          source={mikuImage}
          style={styles.mikuHeader}
        />
      </View>

      {/* MAIN CHAT */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chat}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <Image
              source={mikuGojiImage}
              style={styles.heroImage}
            />

            <Text style={styles.heroTitle}>
              Welcome to Goji AI 💙
            </Text>

            <Text style={styles.heroSubtitle}>
              Your Miku × Gojira AI companion
            </Text>
          </View>
        }

       

        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.sender === "user"
                ? styles.userRow
                : styles.aiRow,
            ]}
          >
            {item.sender === "ai" && (
              <Image
                source={gojiraImage}
                style={styles.avatar}
              />
            )}

            <View
              style={[
                styles.message,
                item.sender === "user"
                  ? styles.userMessage
                  : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>
                {item.text}
              </Text>
            </View>

            {item.sender === "user" && (
              <Image
                source={mikuImage}
                style={styles.avatar}
              />
            )}
          </View>
        
        )}
          ListFooterComponent={
          isThinking ? (
            <View style={[styles.messageRow, styles.aiRow]}>
              <Image
                source={gojiraImage}
                style={styles.avatar}
              />
              <View style={[styles.message, styles.aiMessage]}>
                <ThinkingDots />
              </View>
            </View>
          ) : uploadedFile ? (
            <View style={styles.uploadedFile}>
              <Text style={styles.uploadedFileIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadedFileName}>
                  {uploadedFile}
                </Text>
                <Text style={styles.uploadedFileStatus}>
                  Uploaded ✓
                </Text>
              </View>
            </View>
          ) : null
        }
      />


      {/* INPUT */}
      <View style={styles.inputArea}>
        {/* ATTACHMENT */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickAndUploadFile}
        >
          <Text style={styles.attachText}>📎</Text>
        </TouchableOpacity>

        {/* VOICE */}
        <TouchableOpacity style={styles.voiceButton}>
          <Text style={styles.voiceText}>🎤</Text>
        </TouchableOpacity>

        {/* TEXT INPUT */}
        <TextInput
          style={styles.input}
          placeholder="Message Goji AI..."
          placeholderTextColor="#8B91A7"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
        />

        {/* SEND */}
        <TouchableOpacity
          style={styles.send}
          onPress={sendMessage}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080D18",
  },

  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101827",
    borderBottomWidth: 1,
    borderBottomColor: "#20D9D2",
  },

  gojiraHeader: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },

  mikuHeader: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#63E8E1",
    fontSize: 11,
    marginTop: 2,
  },

  online: {
    color: "#FF72AE",
    fontSize: 11,
    marginTop: 2,
  },

  chat: {
    padding: 14,
    paddingBottom: 20,
  },

  heroCard: {
    backgroundColor: "#111C2B",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#20D9D2",
  },

  heroImage: {
    width: "100%",
    height: 190,
    resizeMode: "cover",
  },

  heroTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },

  heroSubtitle: {
    color: "#FF72AE",
    textAlign: "center",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
  },

  aiRow: {
    alignSelf: "flex-start",
  },

  userRow: {
    alignSelf: "flex-end",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    resizeMode: "cover",
    marginHorizontal: 6,
  },

  message: {
    maxWidth: "70%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
  },

  aiMessage: {
    backgroundColor: "#182536",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#284050",
  },

  userMessage: {
    backgroundColor: "#147F8A",
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: "#3BE1D9",
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },

  uploadedFile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111C2B",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#20D9D2",
    padding: 12,
    marginBottom: 12,
  },

  uploadedFileIcon: {
    fontSize: 25,
    marginRight: 10,
  },

  uploadedFileName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  uploadedFileStatus: {
    color: "#63E8E1",
    fontSize: 12,
    marginTop: 3,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#101827",
    borderTopWidth: 1,
    borderTopColor: "#263044",
  },

  attachButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#202B3D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  attachText: {
    fontSize: 19,
  },

  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#202B3D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  voiceText: {
    fontSize: 19,
  },

  input: {
    flex: 1,
    height: 46,
    backgroundColor: "#192334",
    color: "#FFFFFF",
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#344158",
  },

  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FF5FA2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
});