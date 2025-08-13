---
description: "Complete PR creation workflow with commit, push, and template filling"
allowedTools: ["Bash", "Read", "Glob"]
---

# PR Creation Workflow

Create a pull request for the current branch with proper commit and template handling.

## Workflow Steps

1. **Review Current Changes**
   - Check git status and diff
   - Verify all intended changes are staged

2. **Commit Changes**
   - Create meaningful commit message
   - Follow conventional commit format if applicable
   - Include Co-Authored-By attribution

3. **Push and Create PR**
   - Push branch to origin
   - Create PR using GitHub CLI
   - Fill out PR template with relevant information

4. **PR Template Completion**
   - Add comprehensive description
   - Link related issues if applicable
   - Mark changeset requirements
   - Include testing information
   - Add screenshots if UI changes

## Usage
Use with optional branch name: `/pr [target-branch]`
Defaults to creating PR against main branch.

Arguments: $ARGUMENTS

!git status
!git diff --staged
!git log --oneline -3