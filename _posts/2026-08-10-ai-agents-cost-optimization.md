---
title: "AI-Agents Cost Optimization"
categories:
- Blog
toc: true
toc_label: "On this page"      # optional
toc_icon: "list"            # optional (Font Awesome icon name)
toc_sticky: true       
header:
  og_image: /assets/images/og/2026-08-10-ai-agents-cost-optimization.png
tags:
- Agentic AI
- Cost Optimization
---

When a PoC of an agentic AI project faces business reality, the first problem that arises is the cost: every agent run should cost an amount adequate to its business value. With a frontier model and a naive ReAct design, an agent can easily hit $2+ per run. In many cases such a price may make the entire project financially unsustainable. Fortunately, there are many ways to lower the token consumption of your agent.

Here I want to share a few strategies for reducing the cost of AI agents that I've personally utilized on one of my latest projects and found them effective. 

## 1. Don't **Create** an Agent When You Don't Need To
I always keep in mind the following ladder of solutions from the LLM usage point of view: 
1. Tasks that can be completed without an LLM at all
2. Tasks that can be completed with a deterministic flow with some LLM calls here and there 
3. Tasks that really need to be done via an AI agent

Whenever you want to solve a problem with an AI agent, first think carefully about the first two options. Even if a task looks intractable with plain LLM-free code, it may be easily solvable with a deterministic flow that mixes individual LLM calls for some steps and regular code for others. This system will be way cheaper, testable and reliable than a system doing the same work but via a true agentic flow.

## 2. Don't **Run** The Agent If You Don't Need To
The core idea is simple caching: 
- Persist state, input data and output results of the agent on every run
- When a new request arrives, check if this input data and state were already used by this agent. If this is the case, simply return the previous result without running the agent again. 

This strategy is not always available because the state of the agent is a complicated thing. It doesn't only include the context that was sent to the LLM, but also other data stored inside the harness that constructs this context. 

But if it's possible in your case, do it. 

## 3. Prompt Caching
This is the main strategy you should use, supported by all major LLM vendors ([OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching), [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching
) and [Google Gemini](https://ai.google.dev/gemini-api/docs/caching)). 

To make it work, you'll need to rearrange the context of your agent so that static parts that don't change between turns go first in the context window. This is well described in the [OpenAI documentation on structuring prompts](https://developers.openai.com/api/docs/guides/prompt-caching#structuring-prompts): 

<p align="center">
	<img src="/assets/images/ai-agents-cost-optimization/1.png"
		width="700">
</p>

With prompt rearrangement and caching, we were able to achieve around a 40% drop in average cost per agent run. 

## 4. Dynamic Context Compaction
Most of the context that is being dynamically added (e.g. from MCP servers) comes not in a free text form, but rather as JSON strings.  

Depending on the size of such data, you can save many tokens by minifying the JSON string (removing all indentation) and by swapping original field names with abbreviations.  

For example, let's say that our agent calls an MCP tool that retrieves tabular data from a database. Originally we would simply map this tabular data into JSON and add it into the context (indentation added for readability):

{% highlight markdown linenos %}
```
[
   {
      "order_id": 1234, 
      "client_name": "MegaCorp 1",
      "purchased_positions": [...]
   }, 
   {
      "order_id": 4567, 
      "client_name": "MegaCorp 2",
      "purchased_positions": [...]
   }
   .....
]
```
{% endhighlight %}

With enough rows fetched from the database, the amount of tokens spent on field names may become a very significant part of the overall context used for this data.  

What we want to do is to compact this data by replacing each field name with abbreviations: 
- `order_id` --> `oi`
- `client_name` --> `cn`
- `purchased_positions` --> `pp`

And in order to make it meaningful for the LLM, we should provide a glossary explaining the meaning of each abbreviation. So we send the full name of each field only once instead of once for every row fetched from the database. For example (indentation added for readability): 

{% highlight markdown linenos %}
Names of JSON fields in data below were compacted.
Interpret each field name as follows: `oi` --> `order_id`; `cn` --> `client_name`; `pp` --> `purchased_positions`

```
[
   {
      "oi": 1234, 
      "cn": "MegaCorp 1",
      "pp": [...]
   }, 
   {
      "oi": 4567, 
      "cn": "MegaCorp 2",
      "pp": [...]
   }
   .....
]
```
{% endhighlight %}

In our latest project that heavily relies on tabular data we were able to achieve a 20% cost reduction on average by manipulating json this way without degradation of quality.