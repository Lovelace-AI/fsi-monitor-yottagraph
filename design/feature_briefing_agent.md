# Feature Overview

The Briefing Agent provides a natural language summary of Edgar filings data from the watchlist. When a user clicks the "Briefing" button in the watchlist Agents section, a dialog opens showing the agent "thinking", then displays a summary (max 100 words) of the edgar filings present in the dataset.

# Details

## Agent Behavior

The agent receives the current watchlist data (company names and their edgar filings counts) and generates a concise summary. The summary should:

- Be a maximum of 100 words
- Mention the number of companies being watched
- Summarize the total number of edgar filings across all companies
- Highlight any notable patterns (e.g., companies with many filings, companies with none)

## UI Flow

1. User clicks "Briefing" button in the Agents section of the watchlist
2. Dialog opens with "thinking" indicator
3. Watchlist data is sent to the agent via the gateway
4. Agent response is displayed in the dialog
5. User can close the dialog

## Technical Architecture

- **Agent**: `agents/briefing_agent/` - Python ADK agent deployed to Vertex AI
- **Dialog**: `features/watchlist/components/BriefingAgentDialog.vue`
- **Composable**: Uses existing `useAgentChat` pattern but simplified for one-shot queries

## Data Passed to Agent

The message sent to the agent includes:

- List of companies with their names and edgar filings counts
- Request for a summary

# Implementation Steps

- [x] Create feature doc
- [x] Create Python agent at `agents/briefing_agent/`
- [x] Create `BriefingAgentDialog.vue` component
- [x] Update watchlist page to wire up the button to the new dialog
- [x] Update DESIGN.md

# Open Questions

- What happens if no agent is deployed? Show a configuration message.
- What if the watchlist is empty? Agent should handle this gracefully.
