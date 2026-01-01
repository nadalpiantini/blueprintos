"use client";

import { useState } from "react";
import { useChat, useGeneratePRD, useGenerateSpec, useSuggestADR, useResearch } from "@/lib/hooks/useAI";
import { Button, Card, CardContent, CardHeader } from "./ui";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: string;
}

interface AIAssistantProps {
  projectId?: string;
  projectName?: string;
}

const QUICK_ACTIONS = [
  { action: "generate_prd", label: "Generar PRD", icon: "📝" },
  { action: "generate_spec", label: "Spec Técnica", icon: "🏗️" },
  { action: "suggest_adr", label: "Sugerir ADR", icon: "📋" },
  { action: "research", label: "Investigar", icon: "🔍" },
] as const;

export function AIAssistant({ projectId, projectName }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("chat");

  const chatMutation = useChat();
  const prdMutation = useGeneratePRD();
  const specMutation = useGenerateSpec();
  const adrMutation = useSuggestADR();
  const researchMutation = useResearch();

  const isLoading =
    chatMutation.isPending ||
    prdMutation.isPending ||
    specMutation.isPending ||
    adrMutation.isPending ||
    researchMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input, action: selectedAction };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      let response;

      switch (selectedAction) {
        case "generate_prd":
          response = await prdMutation.generatePRD(input, projectId);
          break;
        case "generate_spec":
          response = await specMutation.generateSpec(input, projectId);
          break;
        case "suggest_adr":
          response = await adrMutation.suggestADR(input, projectId);
          break;
        case "research":
          response = await researchMutation.research(input, projectId);
          break;
        default:
          response = await chatMutation.chat(input, projectId);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        action: selectedAction,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>🤖</span> AI Assistant
            </h2>
            {projectName && (
              <p className="text-sm text-gray-500">Proyecto: {projectName}</p>
            )}
          </div>
          <div className="flex gap-1">
            {QUICK_ACTIONS.map(({ action, label, icon }) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedAction === action
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-4xl mb-4">🤖</p>
              <p className="font-medium">¡Hola! Soy tu asistente de Blueprint OS</p>
              <p className="text-sm mt-2">
                Puedo ayudarte a generar PRDs, specs técnicas, ADRs, o investigar temas.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map(({ action, label, icon }) => (
                  <button
                    key={action}
                    onClick={() => {
                      handleQuickAction(action);
                      setInput(
                        action === "generate_prd"
                          ? "Genera un PRD para "
                          : action === "generate_spec"
                          ? "Crea una especificación técnica para "
                          : action === "suggest_adr"
                          ? "Sugiere un ADR para la decisión de "
                          : "Investiga sobre "
                      );
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.action && message.role === "user" && (
                    <div className="text-xs opacity-75 mb-1">
                      {QUICK_ACTIONS.find((a) => a.action === message.action)?.label || "Chat"}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-pulse">🤖</div>
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedAction === "chat"
                  ? "Escribe tu mensaje..."
                  : `${QUICK_ACTIONS.find((a) => a.action === selectedAction)?.label}...`
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? "..." : "Enviar"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Modo: {QUICK_ACTIONS.find((a) => a.action === selectedAction)?.label || "Chat"}
            {" "}• Powered by DeepSeek
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
