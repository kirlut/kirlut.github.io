---
title: "AI‑Assisted Software Engineering: A Step‑by‑Step Example for Developers Who Don’t Know How to Start"
categories:
- Blog
toc: true
toc_label: "On this page"      # optional
toc_icon: "list"              # optional (Font Awesome icon name)
toc_sticky: true       
header:
  og_image: /assets/images/og/2026-02-07-ai-assisted-swe-workshop.jpg
tags:
- AI‑Assisted Software Engineering
---
# 0. Introduction

So, you are a professional mid- to senior-level developer (if not, this post may not be for you). You know how to write good, effective code and get work done. You hear all the hype around “vibe coding”, all the success stories about LLMs in software development, and so on.

You get a Cursor / Claude Code subscription from your employer and decide to try it out yourself. You ask the agent to implement your task by typing something like: `Implement interface of repository X for working with database Y`. The agent immediately starts working, and as a result you get a bunch of code that not only doesn’t work as needed, but that you can’t even remotely understand.

You ask the agent to fix it a few times and end up with even less understandable code that you can't trust. You look at this garbage, realize that you’ve spent the entire day on it, delete all the generated code, close Cursor, open your regular IDE, and continue working on the task from scratch the way you always do.

The aftertaste is frustration and FOMO, because the success stories of others are still there.

This was exactly my case: I made two attempts to start creating software with the help of AI, but both times I ended up with the disaster described above. As it turned out, I was simply using this new tool the wrong way. Very wrong.

The goal of this post is to help you overcome this frustration and actually start developing software with the help of AI coding agents by showing how to do it the right way. We’ll first discuss the mindset developers should have toward AI coding agents, and then take a real task and implement it step by step with the help of AI. We’ll use Cursor as a beginner-friendly IDE for AI-assisted engineering. My goal is to provide a very specific and reproducible example that you can use to kickstart your journey into building software better and faster with the help of AI.

# 1. New Developer Mindset

First things first: an AI coding agent is not just a new tool like an IDE or a Git UI. It’s a tool that requires a change in how you think about your workflow. You can read a lot of near-philosophical takes about it on the web, but the practical essence is the following:

> You are not the developer anymore. You’re the technical lead.  
> The AI agent is the developer who will implement the task you’re responsible for.

This is it. This is the main thing you should keep in mind all the way down the road of working with an AI coding agent. A good tech lead will never simply ask a developer “do this task” when the task is big and implies important technical decisions.

As a good technical lead, you’re responsible for:
- In./l;vestigating all technical details related to your task (the AI will help with this too!)
- Making all core technical decisions relevant to the implementation: what packages to use, which algorithm fits best, what concurrency scenarios should be taken into account, etc.
- Writing a clear technical spec that provides all the necessary implementation details and requirements the developer needs to successfully implement the task the way you want it
- Making sure the developer understood your requirements correctly
- Reviewing the developer’s code and asking to fix problems, if any

Now, let’s choose a real-world task and implement it with an AI coding agent!

# 2. The Task
> This task is very specific to developing AI agents in Python. Don’t worry if you don’t fully understand it - the point of this article isn’t agent development in Python, but development with the help of AI agents in general. Focus on the workflow. This task is just an example; it could be any other task in any other language.

[Google ADK](https://google.github.io/adk-docs/) is a Python framework for developing AI agents. This framework provides the abstract class [`BaseSessionService`](https://github.com/google/adk-python/blob/main/src/google/adk/sessions/base_session_service.py). An implementation of this abstract class can be plugged into an agent written with this framework and is responsible for storing the state of an agent session.

Out of the box, Google provides only two implementations of this class:
- One for storing session state in a Google Cloud service (Vertex AI).
- Another for storing information in SQL databases: [`DatabaseSessionService`](https://github.com/google/adk-python/blob/main/src/google/adk/sessions/database_session_service.py)

Our task is to implement this abstract class to store information in MongoDB. It’s a decent task for a day or two of work for a senior developer. We’ll do it in a few hours - even if the developer isn’t familiar with Google ADK at all.

# 3. Development Flow
Enought said. Let's open Cursor and start working. 
## 3.1. Technical Investigation. 
As technical leads we should 



