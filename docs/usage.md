| [Home](../README.md) |
|--------------------------------------------|

# Usage

The FortiAI Configuration widget helps to set up LLM Integration to use and Model to be used for different mode of FortiAI.

## Features

### Large Language Model (LLM) Configuration
- `LLM Configuration` - Helps to choose the LLM Configuration, such as OpenAI.
- `Conversation Model` - Choose the LLM model to utilize for the Conversation or Response Plans / Jinja / Playbook How To's mode.
- `Playbook Generation Model` - Choose the LLM model to use for Playbook Generation. Recommended models are gpt-4 or above.

### Integration RBAC
- `Enable Per-user LLM configuration` - On enabling this setting, the LLM integration will look for a connector configuration that matches the loginid of the logged-in user. If disabled, the connector configuration marked default for the LLM integration will be used.

>**Note** By default, all these fields are loaded from the record labeled as *FortiAI Configuration* within the Key Store Module.