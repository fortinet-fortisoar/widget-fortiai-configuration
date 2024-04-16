| [Home](../README.md) |
|----------------------|

# Usage

The FortiAI Configuration widget helps to set up LLM Integration and LLM Model to be used for different FortiAI modes.

## Features

### Large Language Model (LLM) Configuration

- `LLM Configuration` - Select the LLM Configuration, such as OpenAI.
- `Conversation Model` - Select the LLM model to utilize for the Conversation or Response Plans / Jinja / Playbook How To's mode.
- `Playbook Generation Model` - Select the LLM model to use for Playbook Generation. Recommended models are gpt-4 or above.

### Integration RBAC

- `Enable Per-user LLM configuration` - If enabled, the LLM integration looks for a connector configuration that matches the login ID of the logged-in user. If disabled, the default connector configuration is used.

>**Note** By default, all these fields are loaded from the record labeled as *FortiAI Configuration* within the Key Store Module.

## Next Steps

| [Installation](./setup.md#installation) | [Configuration](./setup.md#configuration) |
|-----------------------------------------|-------------------------------------------|