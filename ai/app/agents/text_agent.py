"""Google ADK text agent for the AI service."""

from google.adk.agents import Agent

from app.core.config import settings


def create_text_agent() -> Agent:
    """Create the root text agent.

    Returns:
        A configured Google ADK Agent instance.
    """
    return Agent(
        model=settings.text_model,
        name="text_agent",
        description="Helpful assistant for the booking AI service.",
        instruction=(
            "You are a helpful assistant for a booking application. "
            "Be concise and accurate."
        ),
        tools=[],
    )


root_agent = create_text_agent()
