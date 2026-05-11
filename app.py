from google import genai

client = genai.Client(api_key="AIzaSyAr_MTmz6wtwtj-2oo5DNpKj-JjyJSOrZk")

chat = client.chats.create(
    model="gemini-2.5-flash",
    config={
        "system_instruction":
        "You are Chatuu, a friendly AI mentor who explains coding in simple and motivating way."
    }
)

while True:
    user_input = input("You: ")y

    if user_input.lower() == "exit":
        break

    response = chat.send_message(user_input)

    print("AI:", response.text)