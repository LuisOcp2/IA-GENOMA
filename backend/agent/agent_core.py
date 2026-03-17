"""IA-GENOMA - Núcleo del Agente LangChain"""

import os
from typing import Optional
from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from agent.tools.search_tool import web_search_tool
from agent.tools.reminder_tool import create_reminder_tool, list_reminders_tool
from agent.tools.calendar_tool import get_calendar_events_tool
from agent.tools.notes_tool import create_note_tool, list_notes_tool
from agent.tools.datetime_tool import get_datetime_tool
from agent.tools.android_tool import send_android_action_tool

load_dotenv()


class GenomaAgent:
    """Agente personal GENOMA con memoria por sesión"""

    def __init__(self):
        self.llm = self._load_llm()
        self.tools = self._load_tools()
        self.conversation_history = {}  # session_id -> [messages]
        self.max_history = int(os.getenv("MAX_CONVERSATION_HISTORY", 20))
        self.agent_executor = self._build_agent()
        print(f"[GENOMA] Agente iniciado con proveedor: {os.getenv('LLM_PROVIDER', 'groq')}")

    def _load_llm(self):
        """Carga el LLM según el proveedor configurado"""
        provider = os.getenv("LLM_PROVIDER", "groq").lower()

        if provider == "groq":
            return ChatGroq(
                api_key=os.getenv("GROQ_API_KEY"),
                model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
                temperature=0.7,
                max_tokens=1024,
            )
        elif provider == "google":
            return ChatGoogleGenerativeAI(
                google_api_key=os.getenv("GOOGLE_AI_KEY"),
                model=os.getenv("LLM_MODEL", "gemini-2.0-flash"),
                temperature=0.7,
            )
        elif provider == "openrouter":
            return ChatOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                model=os.getenv("LLM_MODEL", "meta-llama/llama-3.3-70b-instruct"),
                temperature=0.7,
            )
        elif provider == "sambanova":
            return ChatOpenAI(
                api_key=os.getenv("SAMBANOVA_API_KEY"),
                base_url="https://api.sambanova.ai/v1",
                model=os.getenv("LLM_MODEL", "Meta-Llama-3.3-70B-Instruct"),
                temperature=0.7,
            )
        else:
            # Default: Groq
            return ChatGroq(
                api_key=os.getenv("GROQ_API_KEY"),
                model="llama-3.3-70b-versatile",
                temperature=0.7,
            )

    def _load_tools(self):
        """Carga todas las herramientas del agente"""
        return [
            web_search_tool,
            create_reminder_tool,
            list_reminders_tool,
            get_calendar_events_tool,
            create_note_tool,
            list_notes_tool,
            get_datetime_tool,
            send_android_action_tool,
        ]

    def _build_agent(self):
        """Construye el AgentExecutor con LangChain"""
        agent_name = os.getenv("AGENT_NAME", "GENOMA")
        personality = os.getenv(
            "AGENT_PERSONALITY",
            "Eres GENOMA, el asistente personal de Luis. Eres inteligente, directo, hablas en español colombiano casual. Eres eficiente y proactivo."
        )

        system_prompt = f"""{personality}

Tienes acceso a las siguientes herramientas para ayudar a tu usuario:
- Búsqueda web: para información actualizada
- Recordatorios: crear y listar recordatorios
- Calendario: consultar eventos de Google Calendar
- Notas: crear y listar notas personales
- Fecha/Hora: obtener fecha y hora actual
- Acciones Android: enviar comandos al celular del usuario

Reglas importantes:
1. Siempre responde en español
2. Sé conciso en tus respuestas de voz (máximo 3 oraciones)
3. Si necesitas ejecutar una herramienta, hazlo sin preguntar
4. Si no puedes hacer algo, dilo claramente
5. Recuerda el contexto de la conversación
"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5,
            handle_parsing_errors=True,
        )

    async def process(self, text: str, session_id: str = "default") -> dict:
        """Procesa un mensaje y retorna la respuesta del agente"""
        # Obtener historial de esta sesión
        history = self.conversation_history.get(session_id, [])

        try:
            result = await self.agent_executor.ainvoke({
                "input": text,
                "chat_history": history
            })
            response = result["output"]
            actions = result.get("intermediate_steps", [])

            # Actualizar historial
            history.append(HumanMessage(content=text))
            history.append(AIMessage(content=response))

            # Mantener solo los últimos N mensajes
            if len(history) > self.max_history:
                history = history[-self.max_history:]

            self.conversation_history[session_id] = history

            return {
                "response": response,
                "actions": [str(a) for a in actions]
            }

        except Exception as e:
            print(f"[GENOMA ERROR] {e}")
            return {
                "response": f"Hubo un error procesando tu solicitud: {str(e)}",
                "actions": []
            }

    def clear_memory(self, session_id: str):
        """Limpia el historial de una sesión"""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
            print(f"[GENOMA] Memoria limpiada para sesión: {session_id}")
