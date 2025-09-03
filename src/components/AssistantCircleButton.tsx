import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AssistantCircleButton = () => {
  const navigate = useNavigate();
  return (
    <button
      aria-label="Open AI Assistant"
      onClick={() => navigate("/assistant")}
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg rounded-full w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform border-4 border-white/80"
      style={{ boxShadow: "0 4px 24px 0 rgba(80, 63, 205, 0.15)" }}
    >
      <Bot className="h-8 w-8 text-white" />
      <span className="sr-only">Open AI Assistant</span>
    </button>
  );
};
