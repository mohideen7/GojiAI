import { useState } from "react";
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

export default function HomeScreen() {
  const [message, setMessage] = useState("");
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

    try {
      const response = await fetch("http://192.168.31.76:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages((old) => [
        ...old,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply || "No response from Gemini.",
          sender: "ai",
        },
      ]);
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: (Date.now() + 1).toString(),
          text: "Couldn't connect to Goji AI server 😭",
          sender: "ai",
        },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={gojiraImage} style={styles.gojiraHeader} />

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Goji AI</Text>
          <Text style={styles.subtitle}>Miku × Gojira AI Companion</Text>
          <Text style={styles.online}>● Online</Text>
        </View>

        <Image source={mikuImage} style={styles.mikuHeader} />
      </View>

      {/* MAIN CHAT */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chat}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <Image source={mikuGojiImage} style={styles.heroImage} />
            <Text style={styles.heroTitle}>Welcome to Goji AI 💙</Text>
            <Text style={styles.heroSubtitle}>
              Your Miku × Gojira AI companion
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.sender === "user" ? styles.userRow : styles.aiRow,
            ]}
          >
            {item.sender === "ai" && (
              <Image source={gojiraImage} style={styles.avatar} />
            )}

            <View
              style={[
                styles.message,
                item.sender === "user"
                  ? styles.userMessage
                  : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>

            {item.sender === "user" && (
              <Image source={mikuImage} style={styles.avatar} />
            )}
          </View>
        )}
      />

      {/* INPUT */}
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.voiceButton}>
          <Text style={styles.voiceText}>🎤</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message Goji AI..."
          placeholderTextColor="#8B91A7"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
        />

        <TouchableOpacity style={styles.send} onPress={sendMessage}>
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

  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#101827",
    borderTopWidth: 1,
    borderTopColor: "#263044",
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