# Feature Development with Automatic QA Workflow

## Overview
End-to-end workflow for developing new features with automatic QA testing and quality gates.

## Workflow Steps

### Phase 1: Requirements & Planning
1. **Story Creation** - Product Owner creates detailed user story
2. **Technical Review** - Architect reviews technical approach
3. **QA Planning** - QA reviews story and defines test scenarios

### Phase 2: Development
1. **Development Start** - Dev agent implements story tasks
2. **Code Implementation** - Follow story tasks sequentially
3. **Testing** - Run unit tests and validations
4. **Code Review** - Internal code quality checks

### Phase 3: Automatic QA (NEW)
1. **Auto QA Trigger** - Automatically triggered when dev completes story
2. **QA Agent Activation** - System switches to QA agent automatically
3. **Live Testing** - Execute comprehensive test scenarios against running app
4. **Quality Gate Decision** - PASS/CONCERNS/FAIL determination
5. **Results Documentation** - QA findings documented in story

### Phase 4: Resolution & Completion
1. **If QA PASS** - Story marked as "QA Approved", ready for production
2. **If QA CONCERNS/FAIL** - Issues returned to dev agent for fixes
3. **Fix Implementation** - Dev agent addresses QA findings
4. **Re-QA Testing** - Automatic re-testing after fixes
5. **Final Approval** - Story completion with quality assurance

## Automation Points
- ✅ **Dev Completion** → **Auto QA Trigger**
- ✅ **QA Results** → **Auto Dev Notification** (if issues found)
- ✅ **Quality Gate** → **Auto Status Updates**

## Benefits
- **Zero Manual QA Trigger** - QA happens automatically
- **Consistent Quality** - Every feature goes through comprehensive testing
- **Fast Feedback** - Issues caught immediately after development
- **Documentation** - All QA results tracked in story files

## Usage
1. Start with: `*workflow feature-dev-with-qa`
2. Dev agent completes story normally
3. QA automatically triggers on completion
4. Receive quality gate decision and any issues
5. Address issues (if any) and re-test automatically

## Quality Gates
- **PASS**: Feature ready for production
- **CONCERNS**: Minor issues, production acceptable with monitoring
- **FAIL**: Critical issues, must fix before production
- **WAIVED**: Issues acknowledged and accepted by product team