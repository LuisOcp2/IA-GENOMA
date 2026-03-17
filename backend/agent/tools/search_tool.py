"""Tool de búsqueda web usando DuckDuckGo (gratuito)"""

from langchain.tools import tool
from duckduckgo_search import DDGS


@tool
def web_search_tool(query: str) -> str:
    """Busca información actualizada en internet. Úsala cuando necesites datos recientes,
    noticias, precios, o cualquier información que pueda haber cambiado.
    Args:
        query: La búsqueda a realizar en internet
    """
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=4))
            if not results:
                return "No encontré resultados para esa búsqueda."

            formatted = []
            for r in results:
                formatted.append(f"**{r.get('title', '')}**\n{r.get('body', '')}\nFuente: {r.get('href', '')}")

            return "\n\n".join(formatted)
    except Exception as e:
        return f"Error en búsqueda: {str(e)}"
