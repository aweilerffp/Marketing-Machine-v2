# Auto QA Integration Checklist

## Pre-Development Setup
- [ ] Dev agent has `auto-qa-after-dev.md` task in dependencies
- [ ] QA agent is available and functional
- [ ] Application is running (frontend + backend)
- [ ] Test data and environment prepared

## Development Phase Checkpoints
- [ ] Story is in "Ready for Review" status after dev completion
- [ ] All development tasks marked [x] complete
- [ ] Tests are passing
- [ ] Dev agent triggers auto-qa-after-dev task automatically

## Auto QA Execution
- [ ] System automatically transforms to QA agent
- [ ] QA agent loads the completed story
- [ ] Comprehensive test scenarios execute
- [ ] Live application testing performed
- [ ] Quality gate decision generated (PASS/CONCERNS/FAIL/WAIVED)

## Results Processing
- [ ] QA findings documented in story QA Results section
- [ ] Quality gate decision file created in docs/qa/gates/
- [ ] If issues found, dev agent notified with specific fixes needed
- [ ] Story status updated based on QA results

## Integration Validation
- [ ] No manual intervention required for QA trigger
- [ ] QA results are comprehensive and actionable
- [ ] Development-QA cycle completes end-to-end
- [ ] Quality standards maintained consistently

## Success Criteria
- [ ] **Zero-touch QA**: QA triggers automatically after dev completion
- [ ] **Comprehensive Coverage**: All critical functionality tested
- [ ] **Fast Feedback**: Results available within minutes of dev completion
- [ ] **Quality Gates**: Clear PASS/FAIL decisions with rationale
- [ ] **Issue Tracking**: Specific, actionable feedback for any problems

## Rollback Plan
- [ ] Manual QA process available as backup
- [ ] Dev agent can bypass auto-QA if needed (emergency)
- [ ] QA agent can be run independently: `*agent qa` → `*review {story}`

## Continuous Improvement
- [ ] Monitor auto-QA accuracy and effectiveness
- [ ] Gather feedback from dev and QA processes
- [ ] Refine test scenarios based on found issues
- [ ] Update automation as needed for new feature types

---

**Note**: This checklist ensures the auto-QA integration works smoothly and maintains high quality standards for all feature development.