---
title: "Log-Based Issue Investigation with AI Agents: Designing an MCP That Actually Works"
categories:
- Blog
toc: true
toc_label: "On this page"      # optional
toc_icon: "list"              # optional (Font Awesome icon name)
toc_sticky: true       
header:
  og_image: /assets/images/og/2026-01-17-mcp-for-logs-issue-detection.png
tags:
- MCP
- Agentic AI
---

I believe that, despite the multimodality of modern models, the areas where LLM-based solutions are truly useful and 100% worth investing in are those where you need to extract insights from textual data. Log analysis is one of the most obvious applications where AI agents can be applied and immediately start providing valuable insights. But logs in enterprise software are inherently verbose and massive in volume, which becomes a problem given limited context windows.

Here, I want to briefly describe a few lessons I learned while implementing an MCP (Model Context Protocol) logs provider and an AI agent that investigated issues occurring in the system, using logs as the main source of information.

## 1. The Task
- You have a system producing structured or semi-structured logs with timestamps.
- You have a predefined set of issues that may occur in the system (we’re not building a silver bullet that works for every possible case).
- You have human employees who investigate those issues by drilling into these logs and who have valuable domain knowledge about the logs and their meaning.

Let’s use a toy example of a system that collects events from IoT devices and logs the following fields:
- `timestamp`
- `customer_id`
- `device_class`
- `device_uid`
- `runtime_sec` — how long the device has been running since the last reset
- `temp_cel` — the device temperature in Celsius 
- `device_logs` — unstructured textual logs from the device firmware

## 2. The Problems
- The amount of logs related to each issue can be huge. There’s no chance an agent will be able to analyze them all in bulk without overflowing the context window.
- Even if the entire set of logs fits into the context window, most information in each record is redundant. Even cutting-edge LLMs may fail to identify the relevant records, let alone the relevant fields within those records.
- Additionally, many legacy systems write semi-structured logs. In this case, each record contains a structured part with predefined fields (e.g., `timestamp`, `source`, etc.) and one or more fields with mostly unstructured text describing whatever some developer decided to put in logs ten years ago. This is exactly the case we have in our IoT example. 

## 3. The Solution

> **TL;DR:**
You need to provide the agent with an MCP tool that allows grouping logs by fields. If nested grouping is possible — go for it. For each group, **do not** return the raw logs from the group; instead, return valuable statistics and metadata about the logs in that group. By exploring these statistics across different groupings, the agent will be able to identify a narrow set of logs it should read in raw form to reach a conclusion. If your logs contain unstructured free-text fields, create a separate tool to gather LLM-generated summaries or changelogs for these fields (with strict filtering on which logs are summarized).

When seeing a task like this, you immediately know that the main area where you should apply effort is data provisioning for the AI agent, not the agent itself.

We can think about raw logs as a huge *set of objects in a multi-dimensional space*. Our goal as AI engineers is to provide the agent with *projections* of this set into lower-dimensional spaces, plus a way to efficiently filter this set. Additionally, each projection should contain enough information to decide which other projections or filters the agent should request if it needs more data.

### 3.1. Data Preparation
First of all, you should keep in mind that you’re going to perform a lot of filtering, aggregation, and summarization over logs. So make sure your storage is a good fit for this. If your logs are in a data lake, consider first moving them to something like `ClickHouse` or `Elasticsearch`. Also consider in-memory caching inside the MCP server itself.

### 3.2. Developing an MCP
#### 3.2.1. Mandatory filters for all tools
First of all, make sure the agent cannot request the entire set of raw logs, because that will immediately waste your context window and may even kill your MCP server due to memory limits. The most obvious thing in our case is to make the following filters mandatory for each tool:
- `customer_id`
- `timestamp_from`
- `timestamp_to`

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LogsMandatoryFilters(BaseModel):
    customer_id: int
    timestamp_from: datetime
    timestamp_to: datetime
```

And almost every MCP tool will have it as the first parameter:
```python
@mcp.tool()
async def my_tool(basic_filters: LogsMandatoryFilters):
    pass
```
Additionally, I recommend adding extra validation for these params in code—for example, checking that `timestamp_from < timestamp_to` and that `(timestamp_to - timestamp_from) <= MAX_RANGE`.

#### 3.2.2. Single tool to obtain summaries of logs groupings
**This is the most crucial part**, that will allow agent to explore logs space under different angles without receiving too much information.  
In our example, this method may provide agent with the capability to group logs by: 
- `device_class`
- `runtime_range` (enum with predefined options e.g. 1-60 sec, 1-5 min, 5-60 min, etc)
- `temp_range` (also enum with predefined options)

There’s no grouping by `customer_id` here because we already decided to include this field in the mandatory filters.

Ideally, you can also implement nested grouping to give the agent a more granular picture of the data.

The content of each group should contain *not the log records themselves* (which can be huge), but useful metadata and statistics about the logs in that group.

For example, the result of this tool when grouping by `device_class`, with a nested grouping by `runtime_range`:

```json
[
   {
        "group_by": "device_class",
	"group_name": "co2_detector", 
	"logs_count": 2114, 
	"unique_devices_count": 34, 
	"devices_uids": ["cod21", "cod22", ...],
	"temp_cel_max": 85,
	"temp_cel_min": -3, 
	"temp_cel_median": 26
	"runtime_sec_max": 322541.5,
	"runtime_sec_min": 1.8,
	"runtime_sec_median": 26056.1,
	"nested_groups": [
	    	{
		    "group_by": "runtime_range",
		    "group_name": "less than 10 sec",
		    "unique_devices_count": 6, 
		    "devices_uids": ["cod35", "cod46", ...],
         	    "logs_count": 248, 
	            "temp_cel_max": 85,
	            "temp_cel_min": 72, 
	            "temp_cel_median": 75,
	            "runtime_sec_max": 9.7,
	            "runtime_sec_min": 1.8,
	            "runtime_sec_median": 2.1
		}, 
		{
		    "group_by": "runtime_range",
		    "group_name": "1 hour and more",
		    "unique_devices_count": 28, 
		    "devices_uids": ["cod21", "cod28", ...],
		    "logs_count": 1866, 
	            "temp_cel_max": 27,
	            "temp_cel_min": -2, 
	            "temp_cel_median": 23, 
	            "runtime_sec_max": 322541.5,
	            "runtime_sec_min": 2356.1,
	            "runtime_sec_median": 2356.1
		}
	]
   }, 
   ...
]
```
Even with this single request, our agent will be able to detect that something is wrong with the CO2 detectors in the first nested groups (low runtime and very high device temperature), and then drill down to get more information about logs from these devices. And this is without ever seeing raw logs! Moreover, now the agent has all the information needed to investigate this group of logs in great detail (`device_uid`, time range, etc.).

#### 3.2.3. Analysis of unstructured parts of log records

If your logs are semi-structured (as in our case), you’ll usually have fields with free text in each record. In our example, this is the `device_logs` field.  
I recommend providing a separate MCP tool that performs LLM-based summarization or changelog generation for such fields.

A few important things to consider:
- This tool should have very strict filtering requirements, such as an even lower `MAX_RANGE` than the one used for mandatory filters.
- Use a fast and low-cost LLM for this operation.

In our case, the agent may want to use this tool to get a summary of device logs from the problematic group detected in section 3.2.2 and obtain a summary that likely indicates device malfunction due to high environmental temperature.


### 3.3. Agent Instructions and MCP Docs

Finally, it should be obvious that this entire approach must be completely transparent to the agent, so you must:
1. Clearly describe the log structure in the docs.
2. Explain to the agent that it should explore groupings with statistics first to narrow down the investigation, and only then use other tools.
3. Ensure the docstrings of MCP tools contain detailed information about their behavior. This is especially important for the grouping tool described in section 3.2.2.

## 4. Conclusion
If you need to remember just one thing, here it is:  
when you need to empower an agent with the ability to find insights in structured or semi-structured logs, grouping with statistics for each group is the key to success. The agent gets a way to explore information from logs without seeing the logs themselves, and then select only a tiny subset of records that need to be explored in raw format.

Good luck!