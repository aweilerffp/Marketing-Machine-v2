# Auto QA After Development Task

## Overview
Automatically trigger QA testing after feature development completion to ensure quality gates are met.

## Task Instructions

### Step 1: Check Development Completion
1. Verify the development story status is "Ready for Review"
2. Confirm all development tasks are marked [x] complete
3. Check that tests are passing

### Step 2: Transform to QA Agent
1. Announce automatic QA transition
2. Transform to QA agent using `*agent qa`
3. Load the completed story for review

### Step 3: Execute QA Review
1. Run `*review {story-name}` command
2. Execute comprehensive testing scenarios
3. Document findings in QA Results section

### Step 4: Quality Gate Decision
1. Generate quality gate decision (PASS/CONCERNS/FAIL/WAIVED)
2. If CONCERNS or FAIL, create follow-up tasks for dev agent
3. If PASS, mark story as "QA Approved"

### Step 5: Return Results
1. Summarize QA findings
2. If issues found, transition back to dev agent with specific fix instructions
3. If passed, notify completion and readiness for production

## Success Criteria
- [ ] QA review completed
- [ ] Quality gate decision documented
- [ ] Issues tracked for resolution
- [ ] Story status updated appropriately

## Templates Used
- qa-gate-tmpl.yaml for gate decisions
- story-tmpl.yaml for updates

## Dependencies
- QA agent must be available
- Story must be in "Ready for Review" status
- Test results must be available