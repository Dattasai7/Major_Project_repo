// Mock user data for prototyping
const MOCK_USER = {
    id: "1",
    email: "test@example.com"
};

const MOCK_TOKEN = "dummy-jwt-token-123";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signupApi(email: string, _password: string) {
    console.log("Mock Signup:", email);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.setItem("token", MOCK_TOKEN);
    // Return the email they used so the UI reflects their input
    return { ...MOCK_USER, email };
}

export async function loginApi(email: string, _password: string) {
    console.log("Mock Login:", email);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app we'd validate, but for mock, just succeed
    localStorage.setItem("token", MOCK_TOKEN);
    return { ...MOCK_USER, email };
}

export function logoutApi() {
    localStorage.removeItem("token");
}

export async function getCurrentUser() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if they are "logged in" by checking the token
    if (!localStorage.getItem("token")) {
        throw new Error("No valid session");
    }

    return MOCK_USER;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function sendChat(message: string) {
    console.log("Mock Send Chat:", message);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking

    // Mock a response based on keywords or just return a default
    let mockResponse;
    if (message.toLowerCase().includes("symptoms")) {
        mockResponse = { identified_disease: "Common Cold", symptoms: "Runny nose, sore throat, mild fever." };
    } else if (message.toLowerCase().includes("disease")) {
        mockResponse = "Based on the name, this is a respiratory illness. Ensure plenty of fluids and rest.";
    } else {
        mockResponse = "I am a mocked diagnostic AI. I received your message: " + message;
    }

    return {
        message: message, // The user's input
        response: mockResponse,
        timestamp: new Date().toISOString()
    };
}

export async function getChatHistory() {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        history: [
            {
                id: "msg_1",
                message: "Hello",
                response: "Hi there! This is a mock chat history. Are you here to check symptoms or learn about a disease?",
                timestamp: new Date(Date.now() - 10000).toISOString()
            }
        ]
    };
}
