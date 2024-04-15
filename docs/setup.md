| [Home](../README.md) |
|----------------------|

# Installation

1. To install a widget, click **Content Hub** > **Discover**.

2. From the list of solution pack that appears, search **FortiAI**. 

3. Click the **FortiAI** widget card.

4. Click **Configure** on the lower-left of the screen to begin configuration.

# Configuration

The **FortiAI Configuration** widget helps ready the **FortiAI** solution pack for use.

1. Click the **Configure** button to bring up the following wizard screen.

    ![FortiAI Configuration](./res/fortiai_start.png)

2. Click **Let's Get Started** to proceed.

3. On **Configuration** page, select the following fields.

    | Field Name                 | Value                                                                |
    |:---------------------------|:---------------------------------------------------------------------|
    | LLM Integration            | OpenAI                                                               |
    | Conversation Model         | `gpt-3.5-turbo`, `gpt-3.5-turbo-0301`, `gpt-4`, `gpt-4-1106-preview` |
    | Playbook Generation Model  | `gpt-3.5-turbo`, `gpt-3.5-turbo-0301`, `gpt-4`, `gpt-4-1106-preview` |
    | Per-user LLM configuration | Enabled                                                              |

    ![Configuration](./res/fortiai_configuration.png)

4. Click **Next** on lower-right corner.

5. On the **Connect LLM** page, configure your LLM Integration. For information on how to configure the OpenAI connector, refer [OpenAI Configuration Parameters](https://docs.fortinet.com/document/fortisoar/2.1.0/openai/815/openai-v2-1-0#Configuration_parameters).

    ![Connect LLM](./res/fortiai_connect_llm.png)

6. Click **Next** on lower-right corner.

7. Click **Finish** to complete the configuration.

    ![Finish Configuration](./res/fortiai_finish.png)

Navigate to the **FortiAI** in the navigation menu to start using the solution pack.

## Next Steps

| [Usage](./usage.md) |
|---------------------|