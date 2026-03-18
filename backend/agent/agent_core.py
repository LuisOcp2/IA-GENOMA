"""IA-GENOMA - Núcleo del Agente LangChain v2 - Con todas las herramientas"""

import os
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
from agent.tools.memory_tool import remember_tool, recall_tool
from agent.tools.weather_tool import get_weather_tool
from agent.tools.whatsapp_tool import send_whatsapp_tool, open_app_tool
from agent.tools.timer_tool import set_alarm_tool, set_timer_tool

load_dotenv()


class GenomaAgent:
    """Agente personal GENOMA con memoria por sesión y todas las herramientas"""

    def __init__(self):
        self.llm = self._load_llm()
        self.tools = self._load_tools()
        self.conversation_history = {}
        self.max_history = int(os.getenv("MAX_CONVERSATION_HISTORY", 20))
        self.agent_executor = self._build_agent()
        provider = os.getenv('LLM_PROVIDER', 'groq')
        model = os.getenv('LLM_MODEL', 'llama-3.3-70b-versatile')
        print(f"[GENOMA] ✅ Agente iniciado | Proveedor: {provider} | Modelo: {model}")
        print(f"[GENOMA] 🛠️  Herramientas cargadas: {len(self.tools)}")

    def _load_llm(self):
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
            return ChatGroq(
                api_key=os.getenv("GROQ_API_KEY"),
                model="llama-3.3-70b-versatile",
                temperature=0.7,
            )

    def _load_tools(self):
        return [
            # Información y búsqueda
            web_search_tool,
            get_weather_tool,
            get_datetime_tool,
            # Productividad
            create_reminder_tool,
            list_reminders_tool,
            get_calendar_events_tool,
            create_note_tool,
            list_notes_tool,
            # Memoria del usuario
            remember_tool,
            recall_tool,
            # Control del celular Android
            send_whatsapp_tool,
            open_app_tool,
            set_alarm_tool,
            set_timer_tool,
            send_android_action_tool,
        ]

    def _build_agent(self):
        agent_name = os.getenv("AGENT_NAME", "GENOMA")
        personality = os.getenv(
            "AGENT_PERSONALITY",
            "Eres GENOMA, el asistente personal de Luis. Eres inteligente, directo, hablas en español colombiano casual. Eres eficiente y proactivo."
        )

        system_prompt = f"""{personality}

Herramientas disponibles:
🔍 Búsqueda web - información actualizada
🌤️ Clima - temperatura y pronóstico (Cali por defecto)
📅 Calendario Google - eventos
⏰ Recordatorios - crear y listar
📝 Notas - crear y consultar
🧠 Memoria - recordar info del usuario entre conversaciones
📱 WhatsApp - enviar mensajes
📲 Apps - abrir aplicaciones en el celular
⏱️ Alarmas/Timers - programar en el celular
🕐 Fecha y hora actual

Reglas:
1. Responde SIEMPRE en español colombiano
2. En respuestas de voz sé BREVE (máx 2-3 oraciones)
3. Ejecuta herramientas sin preguntar si el intent es claro
4. Si el usuario te dice algo personal, guárdalo en memoria con remember_tool
5. Antes de responder sobre el usuario, consulta recall_tool si es relevante
6. Cuando el usuario diga 'abre X', 'manda mensaje a X', 'pon alarma X' → ejecuta directo
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
            max_iterations=6,
            handle_parsing_errors=True,
        )

    async def process(self, text: str, session_id: str = "default") -> dict:
        history = self.conversation_history.get(session_id, [])
        try:
            result = await self.agent_executor.ainvoke({
                "input": text,
                "chat_history": history
            })
            response = result["output"]
            actions = result.get("intermediate_steps", [])

            history.append(HumanMessage(content=text))
            history.append(AIMessage(content=response))
            if len(history) > self.max_history:
                history = history[-self.max_history:]
            self.conversation_history[session_id] = history

            return {"response": response, "actions": [str(a) for a in actions]}
        except Exception as e:
            print(f"[GENOMA ERROR] {e}")
            return {"response": f"Ocurrió un error: {str(e)}", "actions": []}

    def clear_memory(self, session_id: str):
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
