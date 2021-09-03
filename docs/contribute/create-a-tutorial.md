---
sidebar_position: 1
---

# Create a Tutorial


## Create your first Tutorial

Create a markdown file at `docs/tutorials/your_tutorial_name.md`:

```md title="docs/tutorials/your_tutorial_name.md"
# Hello

This is my **first Tutorial**!
```

A new document is now available at `http://localhost:3000/docs/tutorials/your_tutorial_name`.

## Configure the Sidebar

Add metadatas to customize the sidebar label and position:

```diff title="docs/hello.md"
+ ---
+ sidebar_label: "My first Tutorial!"
+ sidebar_position: 1
+ ---
